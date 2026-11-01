/**
 * Makes a repository from this template with only the selected modules.
 * It needs Node and no installed packages, so it runs before `pnpm install`.
 *
 *   node scripts/setup.ts                                 Interactive
 *   node scripts/setup.ts --name app --modules api,auth   Non-interactive
 *
 * Shared files mark the lines of a module with comment lines:
 *
 *   // @module auth
 *   ...
 *   // @end-module
 *
 * A marker can name more modules as `a|b`. The lines stay if one of them is
 * selected. The name `template` is never selected. Setup always removes the
 * marker lines.
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { stdin, stdout } from "node:process";
import * as readline from "node:readline";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");

type Module = {
  description: string;
  needs: string[];
  /** Files and folders that belong only to this module. */
  paths: string[];
  /** Workspace package names, relative to @acme. Other package.json files lose these. */
  packages: string[];
  /** Third-party dependencies to remove from a package.json file, by its folder. */
  dependencies: Record<string, string[]>;
  /** Scripts to remove from the root package.json. */
  scripts: string[];
};

/** The one list of modules and what each one needs. */
const MODULES: Record<string, Module> = {
  api: {
    description: "oRPC contract and router, and the Hono API server",
    needs: [],
    paths: [
      "packages/api",
      ".claude/skills/orpc",
      "apps/server",
      "apps/mobile/src/utils/api.ts",
      "apps/desktop/src/renderer/src/lib",
    ],
    packages: ["api", "server"],
    dependencies: {
      "apps/mobile": [
        "@tanstack/react-query",
        "@babel/plugin-transform-parameters",
      ],
      "apps/desktop": ["@tanstack/react-query"],
    },
    scripts: [],
  },
  db: {
    description: "Prisma database client",
    needs: [],
    paths: ["packages/db"],
    packages: ["db"],
    dependencies: {},
    scripts: ["db:push", "db:studio"],
  },
  auth: {
    description: "better-auth email sign-in, served by the API server",
    needs: ["api", "db"],
    paths: [
      "packages/auth",
      "apps/web/src/routes/api/auth",
      "apps/web/src/routes/sign-in.tsx",
      "apps/web/src/_components",
    ],
    packages: ["auth"],
    dependencies: {},
    scripts: [],
  },
  ui: {
    description: "Shared React components",
    needs: [],
    paths: ["packages/ui", "tailwind.config.js"],
    packages: ["ui"],
    dependencies: {
      ".": ["prettier-plugin-tailwindcss"],
    },
    scripts: [],
  },
  web: {
    description: "TanStack Start app, with tRPC as its backend for frontend",
    needs: ["api", "ui"],
    paths: ["apps/web", ".claude/skills/trpc", ".claude/skills/frontend-dev"],
    packages: ["web"],
    dependencies: {},
    scripts: [],
  },
  mobile: {
    description: "Expo app",
    needs: [],
    paths: ["apps/mobile"],
    packages: ["mobile"],
    dependencies: {},
    scripts: [],
  },
  desktop: {
    description: "Electron app",
    needs: ["ui"],
    paths: ["apps/desktop"],
    packages: ["desktop"],
    dependencies: {},
    scripts: [],
  },
  chrome: {
    description: "Chrome extension",
    needs: ["ui"],
    paths: ["apps/chrome"],
    packages: ["chrome-extension"],
    dependencies: {},
    scripts: [],
  },
  pyapp: {
    description: "FastAPI and Marimo app, managed by uv",
    needs: [],
    paths: ["apps/pyapp"],
    packages: [],
    dependencies: {},
    scripts: [],
  },
  clients: {
    description: "TypeScript clients generated from OpenAPI, starting with pyapp",
    needs: ["pyapp"],
    paths: ["packages/clients", "scripts/add-client.ts"],
    packages: ["clients"],
    dependencies: {},
    scripts: ["clients:codegen", "clients:add"],
  },
};

const HELP = `Template setup

Usage:
  node scripts/setup.ts                               Interactive
  node scripts/setup.ts --name app --modules api,auth Non-interactive

Options:
  --name, -n        Project name. It replaces @acme.
  --modules, -m     Comma-separated modules. A module brings what it needs.
  --reinit-git      Delete .git and run git init
  --no-reinit-git   Keep .git (default when --name is given)
  --keep-script     Keep this script after setup
  --help, -h        Show this help

Modules:
${Object.entries(MODULES)
  .map(([name, { description }]) => `  ${name.padEnd(9)} ${description}`)
  .join("\n")}
`;

type Options = {
  name?: string;
  modules?: string[];
  reinitGit?: boolean;
  keepScript: boolean;
  help: boolean;
};

function parseArgs(argv: string[]): Options {
  const options: Options = { keepScript: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--name" || arg === "-n") {
      i++;
      options.name = argv[i];
    } else if (arg === "--modules" || arg === "-m") {
      i++;
      options.modules = parseModules(argv[i] ?? "");
    } else if (arg === "--reinit-git") {
      options.reinitGit = true;
    } else if (arg === "--no-reinit-git") {
      options.reinitGit = false;
    } else if (arg === "--keep-script") {
      options.keepScript = true;
    } else {
      throw new Error(`Unknown option: ${arg}. Use --help to see the options.`);
    }
  }

  return options;
}

function parseModules(value: string) {
  return value
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

function validateName(name: string) {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid name "${name}". Use lowercase letters, digits and hyphens, and start with a letter.`,
    );
  }
}

function resolveModules(requested: string[]) {
  if (requested.length === 0) {
    throw new Error("Select at least one module.");
  }

  const selected = new Set<string>();
  const added: string[] = [];

  function add(name: string, neededBy?: string) {
    const module = MODULES[name];
    if (!module) {
      throw new Error(
        `Unknown module "${name}". Use one of: ${Object.keys(MODULES).join(", ")}.`,
      );
    }

    if (selected.has(name)) {
      return;
    }

    selected.add(name);
    if (neededBy && !requested.includes(name)) {
      added.push(`${name} (${neededBy} needs it)`);
    }

    for (const need of module.needs) {
      add(need, name);
    }
  }

  for (const name of requested) {
    add(name);
  }

  return { selected, added };
}

/** Removes the lines of unselected modules and all marker lines. */
function stripMarkers(args: {
  content: string;
  selected: Set<string>;
  file: string;
}) {
  const { content, selected, file } = args;
  const start = /^\s*(?:\/\/|#|<!--|\{\/\*)\s*@module\s+([\w|-]+)/;
  const end = /^\s*(?:\/\/|#|<!--|\{\/\*)\s*@end-module\b/;

  const kept: string[] = [];
  let keepBlock: boolean | undefined;

  for (const line of content.split("\n")) {
    const match = start.exec(line);
    if (match) {
      if (keepBlock !== undefined) {
        throw new Error(`Nested @module marker in ${file}`);
      }
      const names = (match[1] ?? "").split("|");
      keepBlock = names.some((name) => selected.has(name));
      continue;
    }

    if (end.test(line)) {
      if (keepBlock === undefined) {
        throw new Error(`Unmatched @end-module marker in ${file}`);
      }
      keepBlock = undefined;
      continue;
    }

    if (keepBlock !== false) {
      kept.push(line);
    }
  }

  if (keepBlock !== undefined) {
    throw new Error(`Unclosed @module marker in ${file}`);
  }

  return kept.join("\n");
}

function getTextFiles(dir: string): string[] {
  const binary = /\.(png|jpe?g|gif|ico|ttf|woff2?|icns|hbc)$/i;
  const files: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...getTextFiles(fullPath));
    } else if (entry.isFile() && !binary.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function rewriteTextFiles(args: { selected: Set<string>; name: string }) {
  const { selected, name } = args;
  const self = new Set([
    path.join(ROOT_DIR, "scripts/setup.ts"),
    path.join(ROOT_DIR, "scripts/test-setup.sh"),
  ]);

  for (const file of getTextFiles(ROOT_DIR)) {
    if (self.has(file)) {
      continue;
    }

    const content = fs.readFileSync(file, "utf-8");
    const stripped = stripMarkers({ content, selected, file });
    const renamed = stripped.replaceAll("@acme", `@${name}`);

    if (renamed !== content) {
      fs.writeFileSync(file, renamed);
    }
  }
}

function updatePackageJson(args: {
  file: string;
  update: (pkg: PackageJson) => void;
}) {
  const { file, update } = args;
  const pkg: PackageJson = JSON.parse(fs.readFileSync(file, "utf-8"));
  update(pkg);
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Removes every dependency and script of the unselected modules. */
function prunePackageJsons(args: { removed: Module[]; name: string }) {
  const { removed, name } = args;
  const scripts = removed.flatMap((module) => module.scripts);
  const workspacePackages = removed.flatMap((module) =>
    module.packages.map((packageName) => `@acme/${packageName}`),
  );

  const folders = [
    ".",
    ...["apps", "packages"].flatMap((parent) =>
      fs
        .readdirSync(path.join(ROOT_DIR, parent))
        .map((child) => path.join(parent, child)),
    ),
  ];

  for (const folder of folders) {
    const file = path.join(ROOT_DIR, folder, "package.json");
    if (!fs.existsSync(file)) {
      continue;
    }

    const dependencies = removed.flatMap(
      (module) => module.dependencies[folder] ?? [],
    );

    updatePackageJson({
      file,
      update: (pkg) => {
        for (const dependency of [...workspacePackages, ...dependencies]) {
          delete pkg.dependencies?.[dependency];
          delete pkg.devDependencies?.[dependency];
        }
      },
    });
  }

  updatePackageJson({
    file: path.join(ROOT_DIR, "package.json"),
    update: (pkg) => {
      pkg.name = name;
      for (const script of scripts) {
        delete pkg.scripts?.[script];
      }
    },
  });
}

function removeSetupFiles() {
  const scriptsDir = path.join(ROOT_DIR, "scripts");

  for (const file of ["setup.ts", "test-setup.sh", "tsconfig.json"]) {
    fs.rmSync(path.join(scriptsDir, file), { force: true });
  }

  if (fs.readdirSync(scriptsDir).length === 0) {
    fs.rmdirSync(scriptsDir);
  }

  updatePackageJson({
    file: path.join(ROOT_DIR, "package.json"),
    update: (pkg) => {
      delete pkg.scripts?.setup;
    },
  });
}

function reinitializeGit() {
  fs.rmSync(path.join(ROOT_DIR, ".git"), { recursive: true, force: true });
  execFileSync("git", ["init", "--quiet"], { cwd: ROOT_DIR });
}

/** Reads one answer for each question, from a terminal or from piped input. */
function createPrompter() {
  const rl = readline.createInterface({ input: stdin, terminal: false });
  const lines = rl[Symbol.asyncIterator]();

  return {
    ask: async (question: string, fallback = "") => {
      stdout.write(`${question} `);
      const line = await lines.next();
      if (line.done) {
        throw new Error("Input ended before setup got all its answers.");
      }

      return String(line.value).trim() || fallback;
    },
    close: () => rl.close(),
  };
}

async function askMissingOptions(options: Options) {
  const interactive = options.name === undefined;
  const prompter = createPrompter();

  let { name, modules, reinitGit, keepScript } = options;

  if (name === undefined) {
    name = await prompter.ask("Project name (replaces @acme):");
  }

  if (modules === undefined) {
    stdout.write(HELP.slice(HELP.indexOf("Modules:")));
    const answer = await prompter.ask("Modules (comma-separated) [api]:", "api");
    modules = parseModules(answer);
  }

  if (interactive && reinitGit === undefined) {
    const answer = await prompter.ask(
      'Delete .git and run git init? Type "yes" to confirm [no]:',
      "no",
    );
    reinitGit = answer.toLowerCase() === "yes";
  }

  if (interactive && !keepScript) {
    const answer = await prompter.ask("Remove this script after setup? [yes]:", "yes");
    keepScript = answer.toLowerCase() !== "yes";
  }

  prompter.close();

  return { name, modules, reinitGit: reinitGit ?? false, keepScript };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    stdout.write(HELP);
    return;
  }

  const { name, modules, reinitGit, keepScript } = await askMissingOptions(options);
  validateName(name);

  const { selected, added } = resolveModules(modules);
  const removed = Object.keys(MODULES).filter((module) => !selected.has(module));
  const removedModules = removed.flatMap((module) => MODULES[module] ?? []);

  if (added.length > 0) {
    console.log(`Added: ${added.join(", ")}`);
  }
  console.log(`Modules: ${[...selected].join(", ")}`);
  console.log(`Removed: ${removed.join(", ") || "none"}`);

  for (const module of removedModules) {
    for (const modulePath of module.paths) {
      fs.rmSync(path.join(ROOT_DIR, modulePath), { recursive: true, force: true });
    }
  }

  prunePackageJsons({ removed: removedModules, name });
  rewriteTextFiles({ selected, name });

  if (reinitGit) {
    reinitializeGit();
  }

  if (!keepScript) {
    removeSetupFiles();
  }

  console.log("Setup is complete. Run `pnpm install` to update the lockfile.");
}

main().catch((error: Error) => {
  console.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
