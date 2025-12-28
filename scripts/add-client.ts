#!/usr/bin/env bun
/**
 * Add a new OpenAPI client to the clients package
 *
 * This script generates TypeScript clients from OpenAPI specs.
 *
 * Usage:
 *   bun scripts/add-client.ts                           # Interactive mode
 *   bun scripts/add-client.ts --spec ./path/to/openapi.json --name my-api
 *   bun scripts/add-client.ts --spec ./path/to/openapi.json --name my-api --type both
 *
 * Options:
 *   --spec, -s     Path to OpenAPI spec file (relative to repo root or absolute)
 *   --name, -n     Name for the client (used for folder and exports)
 *   --type, -t     Client type: sdk, react-query, or both (default: both)
 *   --help, -h     Show help
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as p from "@clack/prompts";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const CLIENTS_DIR = path.join(ROOT_DIR, "packages", "clients");
const CLIENT_TYPES = ["sdk", "react-query", "both"] as const;
type ClientType = (typeof CLIENT_TYPES)[number];

interface ClientConfig {
  spec: string;
  name: string;
  type: ClientType;
}

function parseArgs(): Partial<ClientConfig> & { help?: boolean } {
  const args = process.argv.slice(2);
  const result: Partial<ClientConfig> & { help?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--spec" || arg === "-s") {
      result.spec = args[++i];
    } else if (arg === "--name" || arg === "-n") {
      result.name = args[++i];
    } else if (arg === "--type" || arg === "-t") {
      const type = args[++i] as ClientType;
      if (CLIENT_TYPES.includes(type)) {
        result.type = type;
      }
    }
  }

  return result;
}

function showHelp() {
  console.log(`
Add OpenAPI Client

This script generates TypeScript clients from OpenAPI specs and adds them
to the @acme/clients package.

Usage:
  bun scripts/add-client.ts                           # Interactive mode
  bun scripts/add-client.ts --spec ./openapi.json --name my-api
  bun scripts/add-client.ts -s ./api.json -n my-api -t react-query

Options:
  --spec, -s     Path to OpenAPI spec file (relative to repo root or absolute)
  --name, -n     Name for the client (kebab-case, e.g., my-api)
  --type, -t     Client type: sdk, react-query, or both (default: both)
  --help, -h     Show help

Examples:
  bun scripts/add-client.ts --spec apps/pyapp/openapi.json --name pyapp
  bun scripts/add-client.ts --spec https://api.example.com/openapi.json --name example-api --type sdk
`);
}

function validateName(name: string): string | undefined {
  if (!name) return "Name is required";
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return "Must be kebab-case: lowercase, start with a letter, use hyphens";
  }
  return undefined;
}

function validateSpec(spec: string): string | undefined {
  if (!spec) return "Spec path is required";

  // Allow URLs
  if (spec.startsWith("http://") || spec.startsWith("https://")) {
    return undefined;
  }

  // Check if file exists
  const fullPath = path.isAbsolute(spec) ? spec : path.join(ROOT_DIR, spec);
  if (!fs.existsSync(fullPath)) {
    return `File not found: ${fullPath}`;
  }

  return undefined;
}

function getRelativeSpecPath(spec: string): string {
  // If it's a URL, return as-is
  if (spec.startsWith("http://") || spec.startsWith("https://")) {
    return spec;
  }

  // Get path relative to clients package
  const fullPath = path.isAbsolute(spec) ? spec : path.join(ROOT_DIR, spec);
  return path.relative(CLIENTS_DIR, fullPath);
}

function generateClient(config: ClientConfig): void {
  const { spec, name, type } = config;
  const relativeSpec = getRelativeSpecPath(spec);
  const outputDir = `./src/${name}`;

  // Build the openapi-ts command
  const plugins: string[] = [];
  if (type === "react-query" || type === "both") {
    plugins.push("@tanstack/react-query");
  }

  const pluginArg = plugins.length > 0 ? `-p ${plugins.join(" ")}` : "";
  const cmd = `npx openapi-ts -i "${relativeSpec}" -o "${outputDir}" -c @hey-api/client-fetch ${pluginArg}`;

  console.log(`Running: ${cmd}`);
  execSync(cmd, { cwd: CLIENTS_DIR, stdio: "inherit" });
}

function updatePackageJson(config: ClientConfig): void {
  const { name, type } = config;
  const relativeSpec = getRelativeSpecPath(config.spec);
  const pkgPath = path.join(CLIENTS_DIR, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  // Add exports
  pkg.exports = pkg.exports || {};
  pkg.exports[`./${name}`] = { default: `./src/${name}/index.ts` };

  if (type === "react-query" || type === "both") {
    pkg.exports[`./${name}/react-query`] = {
      default: `./src/${name}/@tanstack/react-query.gen.ts`,
    };
  }

  // Add codegen script for this client
  pkg.scripts = pkg.scripts || {};
  const plugins: string[] = [];
  if (type === "react-query" || type === "both") {
    plugins.push("@tanstack/react-query");
  }
  const pluginArg = plugins.length > 0 ? ` -p ${plugins.join(" ")}` : "";
  pkg.scripts[`codegen:${name}`] =
    `openapi-ts -i ${relativeSpec} -o ./src/${name} -c @hey-api/client-fetch${pluginArg}`;

  // Update main codegen script to include this client
  const codegenScripts = Object.keys(pkg.scripts)
    .filter((s) => s.startsWith("codegen:"))
    .map((s) => `bun run ${s}`)
    .join(" && ");
  pkg.scripts.codegen = codegenScripts;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

function updateIndexTs(config: ClientConfig): void {
  const { name, type } = config;
  const indexPath = path.join(CLIENTS_DIR, "src", "index.ts");

  let content = fs.readFileSync(indexPath, "utf-8");

  // Create a safe variable name (replace hyphens with camelCase)
  const varName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

  // Check if already exported
  if (content.includes(`"./${name}"`)) {
    console.log(`Client "${name}" already exported in index.ts`);
    return;
  }

  // Add export statements - use namespaced exports to avoid conflicts
  const exports: string[] = [];
  exports.push(`export * as ${varName} from "./${name}";`);

  if (type === "react-query" || type === "both") {
    exports.push(
      `export * as ${varName}Queries from "./${name}/@tanstack/react-query.gen";`,
    );
  }

  // Append to file
  content = content.trimEnd() + "\n\n// " + name + " client\n";
  content += exports.join("\n") + "\n";

  fs.writeFileSync(indexPath, content, "utf-8");
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  p.intro("Add OpenAPI Client");

  // Get spec path
  let spec = args.spec;
  if (!spec) {
    const specResult = await p.text({
      message: "Path to OpenAPI spec file (or URL)",
      placeholder: "apps/pyapp/openapi.json",
      validate: validateSpec,
    });

    if (p.isCancel(specResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    spec = specResult;
  } else {
    const error = validateSpec(spec);
    if (error) {
      p.cancel(error);
      process.exit(1);
    }
  }

  // Get client name
  let name = args.name;
  if (!name) {
    const nameResult = await p.text({
      message: "Client name (kebab-case)",
      placeholder: "my-api",
      validate: validateName,
    });

    if (p.isCancel(nameResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    name = nameResult;
  } else {
    const error = validateName(name);
    if (error) {
      p.cancel(error);
      process.exit(1);
    }
  }

  // Get client type
  let type = args.type;
  if (!type) {
    const typeResult = await p.select({
      message: "What to generate?",
      options: [
        { value: "both", label: "Both SDK and React Query hooks" },
        { value: "sdk", label: "SDK only (fetch client)" },
        { value: "react-query", label: "React Query hooks only" },
      ],
      initialValue: "both",
    });

    if (p.isCancel(typeResult)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    type = typeResult as ClientType;
  }

  const config: ClientConfig = { spec, name, type };

  // Summary
  p.note(
    [
      `Spec: ${spec}`,
      `Name: ${name}`,
      `Type: ${type}`,
      `Output: packages/clients/src/${name}/`,
    ].join("\n"),
    "Summary",
  );

  // Confirm in interactive mode
  if (!args.name) {
    const confirmResult = await p.confirm({
      message: "Generate client?",
      initialValue: true,
    });

    if (p.isCancel(confirmResult) || !confirmResult) {
      p.cancel("Cancelled");
      process.exit(0);
    }
  }

  const spinner = p.spinner();

  // Generate client
  spinner.start("Generating TypeScript client...");
  try {
    generateClient(config);
    spinner.stop("Client generated");
  } catch (error) {
    spinner.stop("Failed to generate client");
    throw error;
  }

  // Update package.json
  spinner.start("Updating package.json exports...");
  updatePackageJson(config);
  spinner.stop("Package.json updated");

  // Update index.ts
  spinner.start("Updating index.ts exports...");
  updateIndexTs(config);
  spinner.stop("Index.ts updated");

  p.outro(`Client "${name}" added successfully!

Usage:
  import { ... } from "@acme/clients/${name}";${type !== "sdk" ? `\n  import { ... } from "@acme/clients/${name}/react-query";` : ""}`);
}

main().catch((error) => {
  p.cancel(`Failed: ${error.message}`);
  process.exit(1);
});
