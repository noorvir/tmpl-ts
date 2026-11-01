# Monorepo Template

A TypeScript monorepo. It uses pnpm 12 and TypeScript 7.

<!-- @module template -->
## Make a repository from this template

Setup needs only Node 24 or newer. It runs before `pnpm install`.

```bash
node scripts/setup.ts --name ray --modules api
node scripts/setup.ts --name app --modules api,auth
node scripts/setup.ts --name app --modules api,auth,web
node scripts/setup.ts          # Interactive
node scripts/setup.ts --help   # All options
pnpm install
```

A selection brings what it needs, and the script says so. For example, `auth` brings `db` and `api`. The repository then contains no code, dependency, env var, script or docs for a module that is not selected.

| Module | Contents | Needs |
| --- | --- | --- |
| `api` | oRPC contract and router, and the Hono API server | |
| `db` | Prisma database client | |
| `auth` | better-auth email sign-in, served by the API server | `api`, `db` |
| `ui` | Shared React components | |
| `web` | TanStack Start app, with tRPC as its backend for frontend | `api`, `ui` |
| `mobile` | Native SwiftUI iOS app. It calls the API if `api` is selected. | |
| `desktop` | Electron app. It calls the API if `api` is selected. | `ui` |
| `chrome` | Chrome extension. It does not call the API. | `ui` |
| `pyapp` | FastAPI and Marimo app, managed by uv | |
| `clients` | TypeScript clients generated from OpenAPI | `pyapp` |

Test every selection, from a clean copy to a running server:

```bash
scripts/test-setup.sh
```

<!-- @end-module -->
## Apps

<!-- @module api -->
- `apps/server` - Standalone Hono server for the API. It serves `/health` and `/openapi.json`.
<!-- @end-module -->
<!-- @module web -->
- `apps/web` - TanStack Start web app. Its tRPC procedures are its backend for frontend, and they call the API through the oRPC client.
<!-- @end-module -->
<!-- @module mobile -->
- `apps/mobile` - Native SwiftUI iOS app. See its README.
<!-- @end-module -->
<!-- @module desktop -->
- `apps/desktop` - Electron desktop app
<!-- @end-module -->
<!-- @module chrome -->
- `apps/chrome` - Chrome extension
<!-- @end-module -->
<!-- @module pyapp -->
- `apps/pyapp` - Python app with FastAPI and Marimo notebooks (managed by uv)
<!-- @end-module -->

## Packages

- `packages/config` - Shared TypeScript and Prettier config
- `packages/utils` - The `tc` and `wrapError` helpers
<!-- @module api -->
- `packages/api` - oRPC contract (`/contract`), typed client (`/client`), router (`/router`) and OpenAPI document (`/openapi`). Clients import `/contract` and `/client`, which contain no server code.
<!-- @end-module -->
<!-- @module auth -->
- `packages/auth` - better-auth configuration
<!-- @end-module -->
<!-- @module clients -->
- `packages/clients` - Generated OpenAPI clients (TypeScript + React Query)
<!-- @end-module -->
<!-- @module db -->
- `packages/db` - Prisma database client
<!-- @end-module -->
<!-- @module ui -->
- `packages/ui` - Shared UI components
<!-- @end-module -->

## Development

```bash
cp .env.example .env
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
<!-- @module db -->

### Database

Set `DATABASE_URL` in `.env`, then push the schema:

```bash
pnpm db:push
```
<!-- @end-module -->
<!-- @module api -->

### API

Add a route to the contract in `packages/api/src/contract.ts`, then implement it in `packages/api/src/router.ts`. The server publishes the route in `/openapi.json`.

```typescript
import { createApiClient } from "@acme/api/client";

const api = createApiClient({ url: "http://127.0.0.1:3001" });
const health = await api.health.check();
```
<!-- @end-module -->
<!-- @module pyapp -->

### Python App

The Python app uses [uv](https://docs.astral.sh/uv/) for dependency management:

```bash
cd apps/pyapp
uv sync                                    # Install dependencies
uv run python server.py                    # Start FastAPI server
uv run marimo edit notebooks/example.py    # Open Marimo notebook
```
<!-- @end-module -->
<!-- @module clients -->

### Generated Clients

Generate TypeScript clients from OpenAPI specs:

```bash
pnpm clients:codegen                                        # Regenerate all clients
pnpm clients:add --spec path/to/openapi.json --name my-api  # Add a client
```

```typescript
import { pyapp, pyappQueries } from "@acme/clients";

await pyapp.healthCheck();

const { data } = useQuery(pyappQueries.healthCheckOptions());
```
<!-- @end-module -->
