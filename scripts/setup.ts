#!/usr/bin/env bun
/**
 * Template setup script
 *
 * This script helps configure the template repository for a new project.
 *
 * Usage:
 *   bun scripts/setup.ts                    # Interactive mode
 *   bun scripts/setup.ts --name myapp       # With project name
 *   bun scripts/setup.ts --name myapp --apps web --no-auth
 *
 * Options:
 *   --name, -n     Project name (replaces @acme)
 *   --apps, -a     Comma-separated list of apps to keep (web,mobile,desktop,chrome,pyapp)
 *   --auth         Include authentication (default: true)
 *   --no-auth      Exclude authentication
 *   --reinit-git   Reinitialize git repository (deletes .git and runs git init)
 *   --no-reinit-git Skip git reinitialization
 *   --keep-script  Don't remove setup script after running
 *   --help, -h     Show help
 */
import * as fs from "fs";
import * as path from "path";
import * as p from "@clack/prompts";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const ALL_APPS = ["web", "mobile", "desktop", "chrome", "pyapp"] as const;
type AppName = (typeof ALL_APPS)[number];

// Parse command line arguments
function parseArgs(): {
  name?: string;
  apps?: AppName[];
  auth?: boolean;
  reinitGit?: boolean;
  keepScript?: boolean;
  help?: boolean;
} {
  const args = process.argv.slice(2);
  const result: ReturnType<typeof parseArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--name" || arg === "-n") {
      result.name = args[++i];
    } else if (arg === "--apps" || arg === "-a") {
      const appsStr = args[++i];
      if (appsStr) {
        result.apps = appsStr
          .split(",")
          .filter((a) => ALL_APPS.includes(a as AppName)) as AppName[];
      }
    } else if (arg === "--auth") {
      result.auth = true;
    } else if (arg === "--no-auth") {
      result.auth = false;
    } else if (arg === "--reinit-git") {
      result.reinitGit = true;
    } else if (arg === "--no-reinit-git") {
      result.reinitGit = false;
    } else if (arg === "--keep-script") {
      result.keepScript = true;
    }
  }

  return result;
}

function showHelp() {
  console.log(`
Template Setup Script

Usage:
  bun scripts/setup.ts                    # Interactive mode
  bun scripts/setup.ts --name myapp       # With project name
  bun scripts/setup.ts --name myapp --apps web --no-auth

Options:
  --name, -n     Project name (replaces @acme)
  --apps, -a     Comma-separated list of apps to keep (web,mobile,desktop,chrome,pyapp)
  --auth         Include authentication (default: true)
  --no-auth      Exclude authentication
  --reinit-git   Reinitialize git repository (deletes .git and runs git init)
  --no-reinit-git Skip git reinitialization
  --keep-script  Don't remove setup script after running
  --help, -h     Show help

Examples:
  bun scripts/setup.ts --name myapp --apps web,mobile --no-auth
  bun scripts/setup.ts -n myproject -a web
`);
}

// Get all files matching a pattern recursively
function getFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules and .git
    if (entry.name === "node_modules" || entry.name === ".git") continue;

    if (entry.isDirectory()) {
      getFiles(fullPath, files);
    } else if (
      entry.name.endsWith(".ts") ||
      entry.name.endsWith(".tsx") ||
      entry.name.endsWith(".js") ||
      entry.name.endsWith(".json") ||
      entry.name.endsWith(".hbs") ||
      entry.name.endsWith(".mjs") ||
      entry.name.endsWith(".cjs") ||
      entry.name.endsWith(".css")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

// Replace @acme with new project name in all files
function replaceProjectName(args: {
  oldName: string;
  newName: string;
}): number {
  const { oldName, newName } = args;

  const files = getFiles(ROOT_DIR);
  let count = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    const newContent = content.replace(new RegExp(oldName, "g"), newName);

    if (content !== newContent) {
      fs.writeFileSync(file, newContent, "utf-8");
      count++;
    }
  }

  // Also update bun.lock if it exists
  const bunLock = path.join(ROOT_DIR, "bun.lock");
  if (fs.existsSync(bunLock)) {
    const content = fs.readFileSync(bunLock, "utf-8");
    const newContent = content.replace(new RegExp(oldName, "g"), newName);
    if (content !== newContent) {
      fs.writeFileSync(bunLock, newContent, "utf-8");
      count++;
    }
  }

  return count;
}

// Delete a directory recursively
function deleteDirectory(dir: string): boolean {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  }
  return false;
}

// Remove apps that are not selected
function removeApps(args: { appsToKeep: string[] }): string[] {
  const { appsToKeep } = args;
  const appsToRemove = ALL_APPS.filter((app) => !appsToKeep.includes(app));
  const removed: string[] = [];

  for (const app of appsToRemove) {
    if (deleteDirectory(path.join(ROOT_DIR, "apps", app))) {
      removed.push(app);
    }
  }

  return removed;
}

// Update root package.json name
function updateRootPackageName(newName: string) {
  const pkgPath = path.join(ROOT_DIR, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

  pkg.name = newName;

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

/**
 * Stub the auth package instead of removing it entirely.
 * This approach is safer as it maintains the package structure
 * but provides no-op implementations.
 */
function stubAuth(): string[] {
  const changes: string[] = [];

  // 1. Stub the auth package - keep it but make it a no-op
  const authSrcDir = path.join(ROOT_DIR, "packages", "auth", "src");
  if (fs.existsSync(authSrcDir)) {
    // Create a stubbed auth.ts that exports null/no-op implementations
    const stubbedAuth = `/**
 * Auth stub - authentication is disabled
 * This file provides type-compatible stubs for the auth package
 */

// Stub types that match the original interface
export type Session = null;
export type Auth = {
  api: {
    getSession: (args: { headers: Headers }) => Promise<null>;
  };
};

// Stub auth object
export const auth: Auth = {
  api: {
    getSession: async () => null,
  },
};
`;
    fs.writeFileSync(path.join(authSrcDir, "auth.ts"), stubbedAuth, "utf-8");
    changes.push("Stubbed packages/auth/src/auth.ts");

    // Update auth package.json to remove dependencies that are no longer needed
    const authPkgPath = path.join(ROOT_DIR, "packages", "auth", "package.json");
    if (fs.existsSync(authPkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(authPkgPath, "utf-8"));
      // Remove all dependencies - the stub doesn't need any
      pkg.dependencies = {};
      fs.writeFileSync(
        authPkgPath,
        JSON.stringify(pkg, null, 2) + "\n",
        "utf-8",
      );
      changes.push(
        "Updated packages/auth/package.json (removed auth dependencies)",
      );
    }
  }

  // 2. Update packages/api/src/context/index.ts to use base context only
  const contextIndexPath = path.join(
    ROOT_DIR,
    "packages",
    "api",
    "src",
    "context",
    "index.ts",
  );
  if (fs.existsSync(contextIndexPath)) {
    const newContent = `/**
 * Context composition - base context only (auth disabled)
 */

import { createBaseContext } from "./base";

export type { BaseContext } from "./base";

export const createTRPCContext = async (args: { headers: Headers }) => {
  return createBaseContext(args.headers);
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
`;
    fs.writeFileSync(contextIndexPath, newContent, "utf-8");
    changes.push("Updated packages/api/src/context/index.ts");
  }

  // 3. Delete packages/api/src/context/with-auth.ts
  const withAuthPath = path.join(
    ROOT_DIR,
    "packages",
    "api",
    "src",
    "context",
    "with-auth.ts",
  );
  if (fs.existsSync(withAuthPath)) {
    fs.unlinkSync(withAuthPath);
    changes.push("Deleted packages/api/src/context/with-auth.ts");
  }

  // 4. Update packages/api/src/router/auth.ts to be a stub
  const authRouterPath = path.join(
    ROOT_DIR,
    "packages",
    "api",
    "src",
    "router",
    "auth.ts",
  );
  if (fs.existsSync(authRouterPath)) {
    const stubbedRouter = `import type { TRPCRouterRecord } from "@trpc/server";

import { publicProcedure } from "../trpc";

/**
 * Auth router stub - returns null session (auth disabled)
 */
export const authRouter = {
  getSession: publicProcedure.query(() => {
    return null;
  }),
} satisfies TRPCRouterRecord;
`;
    fs.writeFileSync(authRouterPath, stubbedRouter, "utf-8");
    changes.push("Stubbed packages/api/src/router/auth.ts");
  }

  // 5. Update packages/api/src/trpc.ts to have a no-op protectedProcedure
  const trpcPath = path.join(ROOT_DIR, "packages", "api", "src", "trpc.ts");
  if (fs.existsSync(trpcPath)) {
    const newContent = `import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(\`[TRPC] \${path} took \${end - start}ms to execute\`);

  return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected procedure stub - auth is disabled so this always throws.
 * Replace this with your own auth logic if needed.
 */
export const protectedProcedure = t.procedure.use(timingMiddleware).use(({ next }) => {
  // Auth is disabled - protected routes are not accessible
  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "Authentication is disabled. Enable auth or use publicProcedure.",
  });
});
`;
    fs.writeFileSync(trpcPath, newContent, "utf-8");
    changes.push(
      "Updated packages/api/src/trpc.ts (stubbed protectedProcedure)",
    );
  }

  // 6. If web app exists, stub/update auth-related files
  const webAppDir = path.join(ROOT_DIR, "apps", "web");
  if (fs.existsSync(webAppDir)) {
    // Stub auth showcase component
    const authShowcasePath = path.join(
      webAppDir,
      "src",
      "_components",
      "auth-showcase.tsx",
    );
    if (fs.existsSync(authShowcasePath)) {
      const stubbedShowcase = `"use client";

/**
 * Auth showcase stub - authentication is disabled
 */
export function AuthShowcase() {
  return (
    <div className="text-muted-foreground text-center">
      <p>Authentication is disabled</p>
    </div>
  );
}
`;
      fs.writeFileSync(authShowcasePath, stubbedShowcase, "utf-8");
      changes.push("Stubbed apps/web/src/_components/auth-showcase.tsx");
    }

    // Stub the index.tsx to not use session
    const indexPath = path.join(webAppDir, "src", "routes", "index.tsx");
    if (fs.existsSync(indexPath)) {
      const stubbedIndex = `import { createFileRoute, Link } from "@tanstack/react-router";

import { AuthShowcase } from "~/_components/auth-showcase";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          TypeScript Template
        </h1>
        <AuthShowcase />

        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-lg border p-6 text-center">
            <h2 className="mb-4 text-2xl font-semibold">Ready to Build</h2>
            <p className="text-muted-foreground mb-4">
              This is a clean TypeScript template ready to go. Start building
              your application by adding your own components and API routes.
            </p>
            <Link
              to="/about"
              className="text-primary underline-offset-4 hover:underline"
            >
              Learn more about this project →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
`;
      fs.writeFileSync(indexPath, stubbedIndex, "utf-8");
      changes.push("Stubbed apps/web/src/routes/index.tsx");
    }

    // Stub auth middleware
    const authMiddlewarePath = path.join(
      webAppDir,
      "src",
      "middleware",
      "auth.ts",
    );
    if (fs.existsSync(authMiddlewarePath)) {
      const stubbedMiddleware = `/**
 * Auth middleware stub - authentication is disabled
 *
 * This middleware does nothing. Replace with your own auth logic if needed.
 */

import { createMiddleware } from "@tanstack/react-start";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  // Auth is disabled - pass through
  return next();
});
`;
      fs.writeFileSync(authMiddlewarePath, stubbedMiddleware, "utf-8");
      changes.push("Stubbed apps/web/src/middleware/auth.ts");
    }

    // Stub auth API route
    const authRoutePath = path.join(
      webAppDir,
      "src",
      "routes",
      "api",
      "auth",
      "$.ts",
    );
    if (fs.existsSync(authRoutePath)) {
      const stubbedRoute = `import { createFileRoute } from "@tanstack/react-router";

/**
 * Auth handler stub - authentication is disabled
 */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: () => new Response("Auth is disabled", { status: 404 }),
      POST: () => new Response("Auth is disabled", { status: 404 }),
    },
  },
});
`;
      fs.writeFileSync(authRoutePath, stubbedRoute, "utf-8");
      changes.push("Stubbed apps/web/src/routes/api/auth/$.ts");
    }
  }

  // 7. Update Prisma schema to remove auth-related models but keep the structure
  const schemaPath = path.join(
    ROOT_DIR,
    "packages",
    "db",
    "prisma",
    "schema.prisma",
  );
  if (fs.existsSync(schemaPath)) {
    const newSchema = `generator client {
    provider        = "prisma-client-js"
    previewFeatures = ["relationJoins"]
    binaryTargets   = ["native", "rhel-openssl-3.0.x", "debian-openssl-1.1.x"]
}

datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
}

// Auth models have been removed. Add your own models here.
// Example:
// model User {
//     id        String   @id @default(cuid())
//     email     String   @unique
//     name      String?
//     createdAt DateTime @default(now())
//     updatedAt DateTime @updatedAt
// }
`;
    fs.writeFileSync(schemaPath, newSchema, "utf-8");
    changes.push(
      "Updated packages/db/prisma/schema.prisma (removed auth models)",
    );
  }

  // 8. Update config/env.ts to remove AUTH_SECRET
  const envPath = path.join(ROOT_DIR, "packages", "config", "env.ts");
  if (fs.existsSync(envPath)) {
    const newEnvContent = `import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z.enum(["development", "production", "preview"]).default("development"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
`;
    fs.writeFileSync(envPath, newEnvContent, "utf-8");
    changes.push("Updated packages/config/env.ts");
  }

  // 9. Update turbo.json to remove AUTH_SECRET from globalEnv
  const turboPath = path.join(ROOT_DIR, "turbo.json");
  if (fs.existsSync(turboPath)) {
    const turboConfig = JSON.parse(fs.readFileSync(turboPath, "utf-8"));
    if (turboConfig.globalEnv) {
      turboConfig.globalEnv = turboConfig.globalEnv.filter(
        (env: string) => !env.includes("AUTH"),
      );
    }
    fs.writeFileSync(
      turboPath,
      JSON.stringify(turboConfig, null, 2) + "\n",
      "utf-8",
    );
    changes.push("Updated turbo.json");
  }

  // 10. Update root package.json to remove auth:generate script
  const rootPkgPath = path.join(ROOT_DIR, "package.json");
  if (fs.existsSync(rootPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));
    if (pkg.scripts) {
      delete pkg.scripts["auth:generate"];
    }
    fs.writeFileSync(rootPkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
    changes.push("Updated root package.json");
  }

  // 11. If mobile app exists, remove auth-related dependencies
  const mobileAppDir = path.join(ROOT_DIR, "apps", "mobile");
  if (fs.existsSync(mobileAppDir)) {
    const mobilePkgPath = path.join(mobileAppDir, "package.json");
    if (fs.existsSync(mobilePkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(mobilePkgPath, "utf-8"));
      let changed = false;
      if (pkg.dependencies) {
        if (pkg.dependencies["@better-auth/expo"]) {
          delete pkg.dependencies["@better-auth/expo"];
          changed = true;
        }
        if (pkg.dependencies["better-auth"]) {
          delete pkg.dependencies["better-auth"];
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(
          mobilePkgPath,
          JSON.stringify(pkg, null, 2) + "\n",
          "utf-8",
        );
        changes.push(
          "Updated apps/mobile/package.json (removed auth dependencies)",
        );
      }
    }
  }

  // 12. Delete better-auth.patch if it exists
  const patchPath = path.join(ROOT_DIR, "patches", "better-auth.patch");
  if (fs.existsSync(patchPath)) {
    fs.unlinkSync(patchPath);
    changes.push("Deleted patches/better-auth.patch");

    // Remove patches directory if empty
    try {
      fs.rmdirSync(path.join(ROOT_DIR, "patches"));
      changes.push("Deleted patches/ directory");
    } catch {
      // Not empty
    }
  }

  return changes;
}

/**
 * Update the clients package when pyapp is removed.
 * Removes pyapp generated files and updates package.json.
 */
function updateClientsPackage(args: { appsToKeep: string[] }): string[] {
  const { appsToKeep } = args;
  const changes: string[] = [];
  const clientsDir = path.join(ROOT_DIR, "packages", "clients");

  // If pyapp is removed, update the clients package
  if (!appsToKeep.includes("pyapp")) {
    // Remove generated pyapp client files
    const pyappDir = path.join(clientsDir, "src", "pyapp");
    if (fs.existsSync(pyappDir)) {
      fs.rmSync(pyappDir, { recursive: true, force: true });
      changes.push("Deleted packages/clients/src/pyapp/");
    }

    // Update the index.ts to remove pyapp export
    const indexPath = path.join(clientsDir, "src", "index.ts");
    if (fs.existsSync(indexPath)) {
      const emptyIndex = `/**
 * Generated API clients
 *
 * This package contains auto-generated TypeScript clients from OpenAPI specs.
 * Run \`bun run generate:clients\` to regenerate after API changes.
 *
 * To add a new API client:
 * 1. Add an openapi.json file to your API app
 * 2. Update the codegen script in package.json
 * 3. Re-export the generated client here
 */
`;
      fs.writeFileSync(indexPath, emptyIndex, "utf-8");
      changes.push("Updated packages/clients/src/index.ts (removed pyapp)");
    }

    // Update package.json to remove pyapp exports and codegen script
    const pkgPath = path.join(clientsDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      let changed = false;

      if (pkg.exports && pkg.exports["./pyapp"]) {
        delete pkg.exports["./pyapp"];
        changed = true;
      }
      if (pkg.exports && pkg.exports["./pyapp/react-query"]) {
        delete pkg.exports["./pyapp/react-query"];
        changed = true;
      }

      // Update codegen script to be a placeholder
      if (pkg.scripts && pkg.scripts.codegen) {
        pkg.scripts.codegen =
          "echo 'No API clients configured. Update this script to generate clients from your OpenAPI specs.'";
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        changes.push(
          "Updated packages/clients/package.json (removed pyapp exports)",
        );
      }
    }
  }

  return changes;
}

// Reinitialize git repository
function reinitializeGit(): boolean {
  const gitDir = path.join(ROOT_DIR, ".git");
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  // Run git init
  const { execSync } = require("child_process");
  try {
    execSync("git init", { cwd: ROOT_DIR, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

// Remove template-specific cursor rules
function removeTemplateRules(): boolean {
  const templateRulePath = path.join(
    ROOT_DIR,
    ".cursor",
    "rules",
    "template-setup.mdc",
  );
  if (fs.existsSync(templateRulePath)) {
    fs.unlinkSync(templateRulePath);
    return true;
  }
  return false;
}

// Self-destruct: remove the setup script and related files after running
function removeSetupScript(): boolean {
  const scriptsDir = path.join(ROOT_DIR, "scripts");
  const scriptPath = path.join(scriptsDir, "setup.ts");
  const testScriptPath = path.join(scriptsDir, "test-setup.sh");

  let removed = false;

  if (fs.existsSync(scriptPath)) {
    fs.unlinkSync(scriptPath);
    removed = true;
  }

  if (fs.existsSync(testScriptPath)) {
    fs.unlinkSync(testScriptPath);
    removed = true;
  }

  // Remove scripts directory if empty
  try {
    fs.rmdirSync(scriptsDir);
  } catch {
    // Not empty
  }

  return removed;
}

// Main function
async function main() {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  p.intro("Template Setup Wizard");

  // 1. Get project name
  let projectName = args.name;
  if (!projectName) {
    const nameResult = await p.text({
      message: "Project name (will replace @acme)",
      placeholder: "myapp",
      validate: (value) => {
        if (!value) return "Project name is required";
        if (!/^[a-z][a-z0-9-]*$/.test(value)) {
          return "Must be lowercase, start with a letter, contain only letters, numbers, and hyphens";
        }
      },
    });

    if (p.isCancel(nameResult)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    projectName = nameResult;
  }

  // 2. Get apps to keep
  let appsToKeep = args.apps;
  if (!appsToKeep) {
    const appsResult = await p.multiselect({
      message: "Which apps do you want to keep?",
      options: ALL_APPS.map((app) => ({
        value: app,
        label: app,
        hint: app === "web" ? "recommended" : undefined,
      })),
      initialValues: ["web"],
      required: true,
    });

    if (p.isCancel(appsResult)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    appsToKeep = appsResult as AppName[];
  }

  if (appsToKeep.length === 0) {
    p.cancel("You must keep at least one app");
    process.exit(1);
  }

  // 3. Get auth preference
  let keepAuth = args.auth;
  if (keepAuth === undefined) {
    const authResult = await p.confirm({
      message: "Include authentication (better-auth)?",
      initialValue: true,
    });

    if (p.isCancel(authResult)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    keepAuth = authResult;
  }

  // 4. Ask about git reinitialization (requires explicit "yes" confirmation)
  let reinitGit = args.reinitGit ?? false;
  if (args.reinitGit === undefined && args.name === undefined) {
    // Only ask in interactive mode
    const reinitResult = await p.text({
      message:
        'Reinitialize git repository? This will DELETE your .git folder. Type "yes" to confirm:',
      placeholder: "no",
      validate: (value) => {
        const lower = value.toLowerCase().trim();
        if (lower !== "yes" && lower !== "no" && lower !== "") {
          return 'Please type "yes" to confirm or "no" (or leave empty) to skip';
        }
      },
    });

    if (p.isCancel(reinitResult)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    reinitGit = reinitResult.toLowerCase().trim() === "yes";
  }

  // 5. Confirm removal of setup script
  let removeScript = !args.keepScript;
  if (!args.keepScript && args.name === undefined) {
    // Only ask in interactive mode
    const removeResult = await p.confirm({
      message: "Remove setup script after completion?",
      initialValue: true,
    });

    if (p.isCancel(removeResult)) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
    removeScript = removeResult;
  }

  // Summary
  p.note(
    [
      `Project name: @${projectName}`,
      `Apps to keep: ${appsToKeep.join(", ")}`,
      `Authentication: ${keepAuth ? "Yes" : "No"}`,
      `Reinitialize git: ${reinitGit ? "Yes" : "No"}`,
      `Remove setup script: ${removeScript ? "Yes" : "No"}`,
    ].join("\n"),
    "Summary",
  );

  // Confirm in interactive mode
  if (args.name === undefined) {
    const confirmResult = await p.confirm({
      message: "Proceed with setup?",
      initialValue: true,
    });

    if (p.isCancel(confirmResult) || !confirmResult) {
      p.cancel("Setup cancelled");
      process.exit(0);
    }
  }

  // Execute changes
  const spinner = p.spinner();

  spinner.start("Replacing @acme with @" + projectName);
  const replacedCount = replaceProjectName({
    oldName: "@acme",
    newName: `@${projectName}`,
  });
  updateRootPackageName(projectName);
  spinner.stop(`Replaced @acme in ${replacedCount} files`);

  spinner.start("Removing unused apps");
  const removedApps = removeApps({ appsToKeep });
  if (removedApps.length > 0) {
    spinner.stop(`Removed apps: ${removedApps.join(", ")}`);
  } else {
    spinner.stop("Keeping all apps");
  }

  // Update clients package if pyapp was removed
  spinner.start("Updating clients package");
  const clientsChanges = updateClientsPackage({ appsToKeep });
  if (clientsChanges.length > 0) {
    spinner.stop(`Updated clients package (${clientsChanges.length} changes)`);
  } else {
    spinner.stop("Clients package unchanged");
  }

  if (!keepAuth) {
    spinner.start("Stubbing authentication");
    const authChanges = stubAuth();
    spinner.stop(`Auth stubbed (${authChanges.length} changes)`);
  }

  if (reinitGit) {
    spinner.start("Reinitializing git repository");
    const success = reinitializeGit();
    if (success) {
      spinner.stop("Git repository reinitialized");
    } else {
      spinner.stop("Failed to reinitialize git repository");
    }
  }

  if (removeScript) {
    spinner.start("Removing setup script");
    removeSetupScript();
    spinner.stop("Setup script removed");
  }

  // Always remove template-specific cursor rules
  spinner.start("Cleaning up template files");
  removeTemplateRules();
  spinner.stop("Template files cleaned up");

  p.outro(
    `Setup complete! Run 'bun install' to update dependencies, then 'bun dev' to start.`,
  );
}

main().catch((error) => {
  p.cancel(`Setup failed: ${error.message}`);
  process.exit(1);
});
