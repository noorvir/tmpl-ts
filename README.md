# Monorepo Template

A monorepo template with web, mobile, desktop, Chrome extension, and Python apps.

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
bun run setup --name myapp --apps web,pyapp --no-auth
```

## Apps

- `apps/web` - TanStack Start web app
- `apps/mobile` - Expo React Native app
- `apps/desktop` - Electron desktop app
- `apps/chrome` - Chrome extension
- `apps/pyapp` - Python app with FastAPI and Marimo notebooks (managed by UV)

## Packages

- `packages/api` - tRPC API router
- `packages/auth` - better-auth authentication
- `packages/clients` - Generated OpenAPI clients (TypeScript + React Query)
- `packages/db` - Prisma database client
- `packages/ui` - Shared UI components

## Development

```bash
bun dev          # Start all apps
bun run build    # Build all packages
bun run typecheck
```

### Python App

The Python app uses [UV](https://docs.astral.sh/uv/) for dependency management:

```bash
cd apps/pyapp
uv sync                                    # Install dependencies
uv run python server.py                    # Start FastAPI server
uv run marimo edit notebooks/example.py   # Open Marimo notebook
```

### API Clients

Generate TypeScript clients from OpenAPI specs:

```bash
bun run clients:codegen   # Regenerate all clients
bun run clients:add       # Add a new client (interactive)
```

Usage:

```typescript
import { pyapp, pyappQueries } from "@acme/clients";

// SDK
await pyapp.healthCheck();

// React Query
const { data } = useQuery(pyappQueries.healthCheckOptions());
```

