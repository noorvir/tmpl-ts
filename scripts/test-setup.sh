#!/bin/bash
# Tests the whole creation flow. For each selection it copies the template to a
# clean folder, runs setup, and then runs install, typecheck, lint, tests and
# build in the generated repo. It also starts the servers and calls them.
#
#   scripts/test-setup.sh                    All selections
#   scripts/test-setup.sh api api,auth,web   These selections
#
# Servers bind to 127.0.0.1 on free ports. The database for sign-in is PGlite,
# installed in the temporary folder and not in the generated repo.

set -u

TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ALL_MODULES="api,db,auth,ui,web,mobile,desktop,chrome,pyapp,clients"
PROJECT="testapp"
TEST_SECRET="test-secret-with-at-least-32-characters"

if [ "$#" -gt 0 ]; then
  SELECTIONS=("$@")
else
  SELECTIONS=(api api,auth api,auth,web web db mobile mobile,api desktop chrome clients "$ALL_MODULES")
fi

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/tmpl-ts-test.XXXXXX")"
RESULTS_FILE="$WORK_DIR/results"
STARTED_PIDS=""
FAILED=0

cleanup() {
  for pid in $STARTED_PIDS; do
    kill "$pid" 2>/dev/null
  done
  wait 2>/dev/null
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

has_module() {
  case ",$1," in
    *",$2,"*) return 0 ;;
    *) return 1 ;;
  esac
}

leftover_pattern() {
  case "$1" in
    api) echo "@orpc/|@$PROJECT/api|@$PROJECT/server|apps/server|packages/api|\"hono\"|hono:|API_URL" ;;
    db) echo "prisma|DATABASE_URL|@$PROJECT/db|packages/db" ;;
    auth) echo "better-auth|AUTH_SECRET|@$PROJECT/auth|packages/auth|sign-in" ;;
    ui) echo "@radix-ui|@$PROJECT/ui|packages/ui|lucide-react" ;;
    web) echo "@tanstack/react-start|trpc|apps/web" ;;
    mobile) echo "swiftui|swift build|xcodeproj|apps/mobile" ;;
    desktop) echo "\\belectron\\b([^-]|$)|electron-(vite|builder|store)|apps/desktop" ;;
    chrome) echo "apps/chrome|@types/chrome|chrome-extension" ;;
    pyapp) echo "pyapp|marimo|fastapi|langchain" ;;
    clients) echo "@hey-api|@$PROJECT/clients|packages/clients" ;;
  esac
}

# Selected modules bring third-party packages with other names. For example,
# Prisma Studio brings Radix and Hono. The lockfile search therefore covers its
# importers, and these main packages of each module in its whole package list.
lockfile_main_packages() {
  case "$1" in
    api) echo "@orpc/server" ;;
    db) echo "prisma|@prisma/client" ;;
    auth) echo "better-auth" ;;
    ui) echo "lucide-react|cmdk" ;;
    web) echo "@tanstack/react-start|@trpc/server" ;;
    desktop) echo "electron|electron-vite" ;;
  esac
}

ALWAYS_REMOVED='@acme|Acme|@module|@end-module|create-t3|t3-oss|turbo|\bexpo\b|@expo/|react-native|twrnc|\bbun\b|bunx|bunfig|@ai-sdk|@clack|eslint'

copy_template() {
  local target="$1"
  mkdir -p "$target"
  git -C "$TEMPLATE_DIR" ls-files -co --exclude-standard |
    rsync -a --files-from=- "$TEMPLATE_DIR/" "$target/"
}

# Runs one named step and records it for the table at the end.
step() {
  local selection="$1" name="$2"
  shift 2
  local log="$WORK_DIR/step.log"

  if "$@" >"$log" 2>&1; then
    echo "  pass  $name"
    echo "$selection|$name|pass" >>"$RESULTS_FILE"
    return 0
  fi

  echo "  FAIL  $name"
  sed 's/^/        /' "$log" | tail -40
  echo "$selection|$name|FAIL" >>"$RESULTS_FILE"
  FAILED=1
  return 1
}

skip() {
  echo "$1|$2|-" >>"$RESULTS_FILE"
}

check_setup_rejects_bad_input() {
  local dir="$WORK_DIR/bad-input"
  copy_template "$dir"

  if node "$dir/scripts/setup.ts" --name app --modules nope; then
    echo "Setup accepted an unknown module"
    return 1
  fi

  if node "$dir/scripts/setup.ts" --name app --apps web; then
    echo "Setup accepted a removed flag"
    return 1
  fi

  if node "$dir/scripts/setup.ts" --name BAD --modules api; then
    echo "Setup accepted an invalid name"
    return 1
  fi

  git -C "$TEMPLATE_DIR" ls-files -co --exclude-standard | while read -r file; do
    if [ -f "$TEMPLATE_DIR/$file" ] && ! cmp -s "$TEMPLATE_DIR/$file" "$dir/$file"; then
      echo "Setup changed $file after bad input"
      exit 1
    fi
  done
}

run_setup() {
  local dir="$1" selection="$2"
  local output
  output="$(node "$dir/scripts/setup.ts" --name "$PROJECT" --modules "$selection")" || {
    echo "$output"
    return 1
  }
  echo "$output"

  if [ "$selection" = "api,auth" ]; then
    echo "$output" | grep -q "db (auth needs it)" || {
      echo "Setup did not say that auth brings db"
      return 1
    }
  fi

  if [ "$selection" = "web" ]; then
    echo "$output" | grep -q "api (web needs it)" || {
      echo "Setup did not say that web brings api"
      return 1
    }
  fi
}

check_interactive_matches_flags() {
  local flags_dir="$1" selection="$2"
  local dir="$WORK_DIR/interactive"
  rm -rf "$dir"
  copy_template "$dir"

  printf '%s\n%s\n%s\n%s\n' "$PROJECT" "$selection" "no" "yes" |
    node "$dir/scripts/setup.ts" || return 1

  diff -r "$flags_dir" "$dir"
  local result=$?
  rm -rf "$dir"
  return $result
}

resolved_modules() {
  local dir="$1" resolved="" module
  for module in api db auth ui web mobile desktop chrome pyapp clients; do
    case "$module" in
      api) [ -d "$dir/packages/api" ] && resolved="$resolved,api" ;;
      db) [ -d "$dir/packages/db" ] && resolved="$resolved,db" ;;
      auth) [ -d "$dir/packages/auth" ] && resolved="$resolved,auth" ;;
      ui) [ -d "$dir/packages/ui" ] && resolved="$resolved,ui" ;;
      clients) [ -d "$dir/packages/clients" ] && resolved="$resolved,clients" ;;
      *) [ -d "$dir/apps/$module" ] && resolved="$resolved,$module" ;;
    esac
  done
  echo "${resolved#,}"
}

check_no_leftovers() {
  local dir="$1" modules="$2" module pattern main found=0
  local files="$WORK_DIR/files"

  (
    cd "$dir" || exit 1
    git init -q . && git ls-files -co --exclude-standard | grep -v '^pnpm-lock.yaml$' >"$files"
    awk '/^importers:/{on=1} /^packages:/{on=0} on' pnpm-lock.yaml >"$WORK_DIR/importers"
  ) || return 1

  [ -s "$WORK_DIR/importers" ] || {
    echo "The lockfile has no importers section"
    return 1
  }

  search() {
    (cd "$dir" && tr '\n' '\0' <"$files" | xargs -0 grep -I -d skip -n "$@")
  }

  for module in api db auth ui web mobile desktop chrome pyapp clients; do
    has_module "$modules" "$module" && continue
    pattern="$(leftover_pattern "$module")"

    # Wheel URLs in uv.lock have hash folders, such as packages/db/00/.
    if search -i -E -- "$pattern" | grep -v 'files.pythonhosted.org' >"$WORK_DIR/hits"; then
      echo "Leftovers of module $module:"
      cut -c1-160 "$WORK_DIR/hits" | head -20
      found=1
    fi

    if grep -n -i -E -- "$pattern" "$WORK_DIR/importers" >"$WORK_DIR/hits"; then
      echo "Lockfile importers have leftovers of module $module:"
      cut -c1-160 "$WORK_DIR/hits" | head -20
      found=1
    fi

    main="$(lockfile_main_packages "$module")"
    if [ -n "$main" ] && grep -n -E "^  '?($main)@" "$dir/pnpm-lock.yaml" >"$WORK_DIR/hits"; then
      echo "Lockfile packages have leftovers of module $module:"
      cut -c1-160 "$WORK_DIR/hits" | head -20
      found=1
    fi

    for folder in "packages/$module" "apps/$module"; do
      if [ -e "$dir/$folder" ]; then
        echo "Folder $folder exists for module $module"
        found=1
      fi
    done
  done

  # A generator writes the lint comments in the .gen.ts files.
  if search -E -- "$ALWAYS_REMOVED" | grep -v -E '\.gen\.ts:[0-9]+:.*eslint-disable' | cut -c1-160 | head -20 | grep .; then
    found=1
  fi

  if grep -n -E "^  '?(bun|turbo|eslint|effect|expo|react-native)@" "$dir/pnpm-lock.yaml" | grep -v -E "^[0-9]+:  '?effect@" | grep .; then
    echo "The lockfile has a removed tool"
    found=1
  fi

  if search -E -- '"effect"|from "effect' | grep .; then
    found=1
  fi

  [ -e "$dir/scripts/setup.ts" ] && {
    echo "Setup script is still in the generated repo"
    found=1
  }

  return "$found"
}

# A search that cannot fail proves nothing, so it must find a planted leftover.
check_leftover_search_finds_plant() {
  local dir="$1" modules="$2"
  local plant="$dir/packages/utils/src/plant.ts"

  echo 'export const plant = "better-auth";' >"$plant"
  if check_no_leftovers "$dir" "$modules" >/dev/null; then
    rm -f "$plant"
    echo "The leftover search missed a planted leftover"
    return 1
  fi

  rm -f "$plant"
}

in_repo() {
  local dir="$1"
  shift
  (cd "$dir" && env -u CI "$@")
}

free_port() {
  node -e 'const s=require("node:net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})'
}

wait_for_url() {
  local url="$1" attempt
  for attempt in $(seq 1 100); do
    curl -s -o /dev/null "$url" && return 0
    sleep 0.2
  done
  echo "No answer from $url"
  return 1
}

start_process() {
  local log="$1"
  shift
  "$@" >"$log" 2>&1 &
  LAST_PID=$!
  STARTED_PIDS="$STARTED_PIDS $LAST_PID"
}

stop_process() {
  kill "$1" 2>/dev/null
  wait "$1" 2>/dev/null
  return 0
}

# The server and web tests share these values in one selection run.
API_URL=""
API_PID=""
WEB_URL=""
WEB_PID=""
DB_PID=""
DATABASE_URL_VALUE=""

ensure_pglite() {
  local tool="$WORK_DIR/pglite"
  [ -d "$tool/node_modules" ] && return 0
  mkdir -p "$tool"
  cat >"$tool/package.json" <<'EOF'
{
  "name": "pglite-test-database",
  "private": true,
  "type": "module",
  "dependencies": {
    "@electric-sql/pglite": "0.5.14",
    "@electric-sql/pglite-socket": "0.2.17"
  }
}
EOF
  cat >"$tool/server.mjs" <<'EOF'
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const db = await PGlite.create();
const server = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: Number(process.argv[2]),
  maxConnections: 20,
});

await server.start();
process.on("SIGTERM", async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
EOF
  (cd "$tool" && npm install --silent --no-audit --no-fund) || return 1
}

start_database() {
  local dir="$1" port
  ensure_pglite || return 1
  port="$(free_port)"
  start_process "$WORK_DIR/database.log" node "$WORK_DIR/pglite/server.mjs" "$port"
  DB_PID="$LAST_PID"
  sleep 2
  DATABASE_URL_VALUE="postgresql://postgres:postgres@127.0.0.1:$port/postgres?sslmode=disable"
  (cd "$dir/packages/db" && DATABASE_URL="$DATABASE_URL_VALUE" pnpm exec prisma db push)
}

start_api_server() {
  local dir="$1" modules="$2" port web_port="$3"
  port="$(free_port)"
  API_URL="http://127.0.0.1:$port"

  (
    cd "$dir/apps/server" || exit 1
    export HOST=127.0.0.1 PORT="$port" PUBLIC_URL="$API_URL"
    export TRUSTED_ORIGINS="http://127.0.0.1:$web_port"
    if has_module "$modules" auth; then
      export AUTH_SECRET="$TEST_SECRET"
    fi
    if has_module "$modules" db; then
      export DATABASE_URL="${DATABASE_URL_VALUE:-postgresql://127.0.0.1:1/unused}"
    fi
    exec node dist/index.js
  ) >"$WORK_DIR/api.log" 2>&1 &
  API_PID=$!
  STARTED_PIDS="$STARTED_PIDS $API_PID"

  wait_for_url "$API_URL/health" || {
    cat "$WORK_DIR/api.log"
    return 1
  }
}

# Xcode is needed to build the iOS target. Without it, only the project files are checked.
check_ios_project() {
  local dir="$1/apps/mobile"
  plutil -lint "$dir/ios/App.xcodeproj/project.pbxproj" "$dir/ios/App/Info.plist"
}

check_swift_client() {
  local output
  output="$(cd "$1/apps/mobile" && API_URL="$API_URL" swift test 2>&1)" || {
    echo "$output"
    return 1
  }

  echo "$output" | grep -q 'createsGreeting() passed' || {
    echo "The Swift tests did not run against the server"
    echo "$output"
    return 1
  }
}

check_api_server() {
  local dir="$1" modules="$2"

  curl -sf "$API_URL/health" | grep -q '"status":"ok"' || {
    echo "/health did not answer"
    return 1
  }

  curl -sf "$API_URL/openapi.json" >"$WORK_DIR/openapi.json" || {
    echo "/openapi.json did not answer"
    return 1
  }

  WANT_AUTH=no
  has_module "$modules" auth && WANT_AUTH=yes
  node - "$WORK_DIR/openapi.json" "$WANT_AUTH" <<'EOF' || return 1
const [file, wantAuth] = process.argv.slice(2);
const doc = JSON.parse(require("node:fs").readFileSync(file, "utf8"));
const paths = Object.keys(doc.paths);
if (!/^3\./.test(doc.openapi)) throw new Error(`Bad version: ${doc.openapi}`);
if (!doc.info?.title) throw new Error("No info.title");
for (const path of ["/health", "/greeting"]) {
  if (!paths.includes(path)) throw new Error(`No route: ${path}`);
}
if ((wantAuth === "yes") !== paths.includes("/auth/session")) {
  throw new Error(`Wrong auth routes: ${paths}`);
}
for (const path of paths) {
  for (const operation of Object.values(doc.paths[path])) {
    if (!operation.responses) throw new Error(`No responses: ${path}`);
  }
}
console.log("OpenAPI routes:", paths.join(", "));
EOF

  # The same typed-client tests, now against the running server process.
  (cd "$dir/apps/server" && API_URL="$API_URL" pnpm test)
}

# The client must not bring server code to the apps that import it.
check_client_has_no_server_code() {
  local dir="$1" meta="$WORK_DIR/client-meta.json"

  (cd "$dir/apps/server" && pnpm exec esbuild ../../packages/api/src/client.ts \
    --bundle --format=esm --platform=browser --metafile="$meta" --outfile="$WORK_DIR/client.js") || return 1

  if grep -E '@orpc\+server|hono|src/router|better-auth|prisma' "$meta"; then
    echo "The client bundle contains server code"
    return 1
  fi
}

check_auth_on_server() {
  local jar="$WORK_DIR/api-cookies" origin="$1"
  rm -f "$jar"

  curl -sf -X POST "$API_URL/api/auth/sign-up/email" -H 'content-type: application/json' \
    -H "origin: $origin" -d '{"email":"server@example.com","password":"password-1234","name":"Server User"}' >/dev/null || {
    echo "Sign-up failed"
    return 1
  }

  local bad_status
  bad_status="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API_URL/api/auth/sign-in/email" \
    -H 'content-type: application/json' -H "origin: $origin" \
    -d '{"email":"server@example.com","password":"wrong-password"}')"
  [ "$bad_status" = "401" ] || {
    echo "A wrong password returned $bad_status"
    return 1
  }

  curl -sf -c "$jar" -X POST "$API_URL/api/auth/sign-in/email" -H 'content-type: application/json' \
    -H "origin: $origin" -d '{"email":"server@example.com","password":"password-1234"}' >/dev/null || {
    echo "Sign-in failed"
    return 1
  }

  curl -sf -b "$jar" "$API_URL/auth/session" | grep -q '"email":"server@example.com"' || {
    echo "The session route did not return the user"
    return 1
  }

  [ "$(curl -s "$API_URL/auth/session")" = "null" ] || {
    echo "A request with no cookie returned a session"
    return 1
  }
}

start_web() {
  local dir="$1" port="$2"
  WEB_URL="http://127.0.0.1:$port"

  (
    cd "$dir/apps/web" || exit 1
    export API_URL
    exec node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port "$port" --strictPort
  ) >"$WORK_DIR/web.log" 2>&1 &
  WEB_PID=$!
  STARTED_PIDS="$STARTED_PIDS $WEB_PID"

  wait_for_url "$WEB_URL/" || {
    cat "$WORK_DIR/web.log"
    return 1
  }
}

trpc_query() {
  local jar="$1" procedure="$2"
  curl -s -b "$jar" "$WEB_URL/api/trpc/$procedure"
}

check_web_reaches_api() {
  curl -sf "$WEB_URL/" | grep -qi '<html' || {
    echo "The home page did not render"
    return 1
  }

  # This client call goes through the tRPC procedure, then oRPC, then the API.
  trpc_query /dev/null health.check | grep -q '"status":"ok"' || {
    echo "The tRPC procedure did not reach the API"
    trpc_query /dev/null health.check
    return 1
  }
}

check_sign_in_through_web() {
  local jar="$WORK_DIR/web-cookies"
  rm -f "$jar"

  curl -sfL "$WEB_URL/sign-in" | grep -q 'autoComplete="current-password"' || {
    echo "The sign-in page did not render"
    return 1
  }

  trpc_query /dev/null auth.getSession | grep -q '"data":null' || {
    echo "A request with no cookie did not return a null session"
    trpc_query /dev/null auth.getSession
    return 1
  }

  curl -sf -X POST "$WEB_URL/api/auth/sign-up/email" -H 'content-type: application/json' \
    -H "origin: $WEB_URL" -d '{"email":"web@example.com","password":"password-1234","name":"Web User"}' >/dev/null || {
    echo "Sign-up through web failed"
    return 1
  }

  curl -sf -c "$jar" -X POST "$WEB_URL/api/auth/sign-in/email" -H 'content-type: application/json' \
    -H "origin: $WEB_URL" -d '{"email":"web@example.com","password":"password-1234"}' >/dev/null || {
    echo "Sign-in through web failed"
    return 1
  }

  grep -q 'better-auth.session_token' "$jar" || {
    echo "Web did not pass the session cookie"
    return 1
  }

  trpc_query "$jar" auth.getSession | grep -q '"email":"web@example.com"' || {
    echo "The tRPC session procedure did not return the signed-in user"
    trpc_query "$jar" auth.getSession
    return 1
  }

  curl -sf -b "$jar" -c "$jar" -X POST "$WEB_URL/api/auth/sign-out" -H 'content-type: application/json' \
    -H "origin: $WEB_URL" -d '{}' >/dev/null || {
    echo "Sign-out through web failed"
    return 1
  }

  trpc_query "$jar" auth.getSession | grep -q '"data":null' || {
    echo "The session stayed after sign-out"
    return 1
  }
}

check_web_reports_api_failure() {
  stop_process "$API_PID"
  API_PID=""

  if trpc_query /dev/null health.check | grep -q '"status":"ok"'; then
    echo "The procedure answered with the API stopped"
    return 1
  fi

  trpc_query /dev/null health.check | grep -q '"error"' || {
    echo "The procedure did not return an error with the API stopped"
    return 1
  }
}

stop_selection_processes() {
  for pid in "$WEB_PID" "$API_PID" "$DB_PID"; do
    [ -n "$pid" ] && stop_process "$pid"
  done
  WEB_PID=""
  API_PID=""
  DB_PID=""
  DATABASE_URL_VALUE=""
}

test_selection() {
  local selection="$1"
  local dir="$WORK_DIR/repo"
  local modules web_port

  echo ""
  echo "=== $selection"
  rm -rf "$dir"
  copy_template "$dir"

  step "$selection" setup run_setup "$dir" "$selection" || return
  modules="$(resolved_modules "$dir")"
  echo "  modules: $modules"
  step "$selection" interactive check_interactive_matches_flags "$dir" "$selection"
  step "$selection" install in_repo "$dir" pnpm install --no-frozen-lockfile || return
  step "$selection" leftovers check_no_leftovers "$dir" "$modules"
  if ! has_module "$modules" auth; then
    step "$selection" plant check_leftover_search_finds_plant "$dir" "$modules"
  fi
  step "$selection" typecheck in_repo "$dir" pnpm typecheck
  step "$selection" lint in_repo "$dir" pnpm lint
  step "$selection" test in_repo "$dir" pnpm test
  step "$selection" build in_repo "$dir" pnpm build || return

  if has_module "$modules" mobile; then
    step "$selection" ios-project check_ios_project "$dir"
    if xcodebuild -version >/dev/null 2>&1; then
      step "$selection" ios-build in_repo "$dir" pnpm --filter "@$PROJECT/mobile" build:ios
    else
      echo "  skip  ios-build (no Xcode on this machine)"
      skip "$selection" ios-build
    fi
  else
    skip "$selection" ios-project
    skip "$selection" ios-build
  fi

  if has_module "$modules" pyapp; then
    step "$selection" pyapp in_repo "$dir/apps/pyapp" sh -c 'uv sync --quiet && uv run python -c "import server"'
  else
    skip "$selection" pyapp
  fi

  if ! has_module "$modules" api; then
    skip "$selection" server
    skip "$selection" web-to-api
    skip "$selection" sign-in
    return
  fi

  step "$selection" client-only check_client_has_no_server_code "$dir"

  if has_module "$modules" db; then
    step "$selection" database start_database "$dir" || {
      stop_selection_processes
      return
    }
  fi

  web_port="$(free_port)"
  step "$selection" server-start start_api_server "$dir" "$modules" "$web_port" || {
    stop_selection_processes
    return
  }
  step "$selection" server check_api_server "$dir" "$modules"

  if has_module "$modules" mobile; then
    step "$selection" swift-client check_swift_client "$dir"
  fi

  if has_module "$modules" auth; then
    step "$selection" sign-in check_auth_on_server "http://127.0.0.1:$web_port"
  else
    skip "$selection" sign-in
  fi

  if has_module "$modules" web; then
    if step "$selection" web-start start_web "$dir" "$web_port"; then
      step "$selection" web-to-api check_web_reaches_api
      if has_module "$modules" auth; then
        step "$selection" web-sign-in check_sign_in_through_web
      fi
      step "$selection" web-api-down check_web_reports_api_failure
    fi
  else
    skip "$selection" web-to-api
  fi

  stop_selection_processes
}

print_table() {
  local steps="setup interactive install leftovers typecheck lint test build ios-project ios-build pyapp client-only server swift-client sign-in web-to-api web-sign-in web-api-down"
  echo ""
  echo "selection | $(echo "$steps" | sed 's/ / | /g')"
  local selection name result row
  for selection in "${SELECTIONS[@]}"; do
    row="$selection"
    for name in $steps; do
      result="$(awk -F'|' -v s="$selection" -v n="$name" '$1 == s && $2 == n { r = $3 } END { print r }' "$RESULTS_FILE")"
      row="$row | ${result:--}"
    done
    echo "$row"
  done
}

echo "Template: $TEMPLATE_DIR"
echo "Work dir: $WORK_DIR"
echo ""
echo "=== bad input"
step bad-input bad-input check_setup_rejects_bad_input

for selection in "${SELECTIONS[@]}"; do
  test_selection "$selection"
done

print_table

if [ "$FAILED" -ne 0 ]; then
  echo ""
  echo "RESULT: FAILED"
  exit 1
fi

echo ""
echo "RESULT: PASSED"
