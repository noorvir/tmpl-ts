# Noorvir's Typescript Monorepo Template

A monorepo template with web, mobile, desktop, and Chrome extension apps.

## Quick Start

```bash
bun install
bun run setup
```

The setup wizard will:
- Set your project name (replaces `@acme`)
- Choose which apps to keep
- Optionally remove authentication

Or run non-interactively:
```bash
bun run setup --name myapp --apps web --no-auth
```

## Apps

- `apps/web` - TanStack Start web app
- `apps/mobile` - Expo React Native app
- `apps/desktop` - Electron desktop app
- `apps/chrome` - Chrome extension

## Packages

- `packages/api` - tRPC API router
- `packages/auth` - better-auth authentication
- `packages/db` - Prisma database client
- `packages/ui` - Shared UI components

## Development

```bash
bun dev          # Start all apps
bun run build    # Build all packages
bun run typecheck
```

