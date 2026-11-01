/**
 * Adds a TypeScript client, generated from an OpenAPI spec, to the clients package.
 *
 *   node scripts/add-client.ts --spec apps/pyapp/openapi.json --name pyapp
 *   node scripts/add-client.ts --spec https://example.com/openapi.json --name my-api --type sdk
 *
 * Options:
 *   --spec, -s   Path to the spec, relative to the repository root, or a URL
 *   --name, -n   Client name in kebab-case. It is the folder and export name.
 *   --type, -t   sdk, react-query or both (default: both)
 */
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CLIENTS_DIR = path.join(ROOT_DIR, "packages", "clients");

type ClientConfig = {
  spec: string;
  name: string;
  withReactQuery: boolean;
};

function readConfig(): ClientConfig {
  const { values } = parseArgs({
    options: {
      spec: { type: "string", short: "s" },
      name: { type: "string", short: "n" },
      type: { type: "string", short: "t", default: "both" },
    },
  });
  const { spec, name, type } = values;

  if (!spec || !name) {
    throw new Error("Use --spec <path or URL> and --name <kebab-case name>.");
  }

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error(`Invalid name "${name}". Use kebab-case.`);
  }

  if (type !== "sdk" && type !== "react-query" && type !== "both") {
    throw new Error(`Invalid type "${type}". Use sdk, react-query or both.`);
  }

  return { spec: getSpecPath(spec), name, withReactQuery: type !== "sdk" };
}

function getSpecPath(spec: string) {
  if (/^https?:\/\//.test(spec)) {
    return spec;
  }

  const fullPath = path.resolve(ROOT_DIR, spec);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  return path.relative(CLIENTS_DIR, fullPath);
}

function updatePackageJson(config: ClientConfig) {
  const { spec, name, withReactQuery } = config;
  const file = path.join(CLIENTS_DIR, "package.json");
  const pkg = JSON.parse(fs.readFileSync(file, "utf-8"));

  pkg.exports[`./${name}`] = `./src/${name}/index.ts`;

  let plugins = "-p @hey-api/client-fetch";
  if (withReactQuery) {
    plugins += " @tanstack/react-query";
    pkg.exports[`./${name}/react-query`] =
      `./src/${name}/@tanstack/react-query.gen.ts`;
  }

  // openapi-ts needs the JS compiler API, which TypeScript 7 does not have.
  pkg.scripts[`codegen:${name}`] =
    `pnpm dlx --package=@hey-api/openapi-ts@0.99.0 --package=typescript@6.0.3 openapi-ts -i ${spec} -o ./src/${name} ${plugins}`;
  pkg.scripts.codegen = Object.keys(pkg.scripts)
    .filter((script) => script.startsWith("codegen:"))
    .map((script) => `pnpm ${script}`)
    .join(" && ");

  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

function updateIndex(config: ClientConfig) {
  const { name, withReactQuery } = config;
  const file = path.join(CLIENTS_DIR, "src", "index.ts");
  const content = fs.readFileSync(file, "utf-8");

  if (content.includes(`"./${name}"`)) {
    return;
  }

  const variable = name.replace(/-([a-z])/g, (_, letter) =>
    letter.toUpperCase(),
  );

  let exports = `\n// ${name} client\nexport * as ${variable} from "./${name}";\n`;
  if (withReactQuery) {
    exports += `export * as ${variable}Queries from "./${name}/@tanstack/react-query.gen";\n`;
  }

  fs.writeFileSync(file, content.trimEnd() + "\n" + exports);
}

function main() {
  const config = readConfig();

  updatePackageJson(config);
  execSync(`pnpm codegen:${config.name}`, {
    cwd: CLIENTS_DIR,
    stdio: "inherit",
  });
  updateIndex(config);

  console.log(`Client added: @acme/clients/${config.name}`);
}

main();
