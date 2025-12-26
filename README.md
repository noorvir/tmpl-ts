# Noorvir's Typescript Monorepo Template

A monorepo template with web, mobile, desktop, and Chrome extension apps.

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

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the web app
pnpm dev --filter=web
```

