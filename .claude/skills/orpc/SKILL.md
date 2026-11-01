---
name: orpc
description: oRPC usage patterns for the API. Auto-apply when adding or changing API routes, or when a client calls the API.
user-invocable: false
---

# oRPC Usage Guide

The API uses oRPC with Zod, and it publishes OpenAPI.

## Add a route

1. Add the route to the contract in `packages/api/src/contract.ts`. Give it an HTTP method and a path.
2. Implement it in `packages/api/src/router.ts`.
3. Add a test in `apps/server/src/server.test.ts` that calls the route with the typed client.

```typescript
// contract.ts
greeting: {
  create: oc
    .route({ method: "POST", path: "/greeting", tags: ["example"] })
    .input(z.object({ name: z.string().min(1) }))
    .output(z.object({ message: z.string() })),
},

// router.ts
greeting: {
  create: os.greeting.create.handler(({ input }) => ({
    message: `Hello, ${input.name}`,
  })),
},
```

## Call the API

```typescript
import { createApiClient } from '@acme/api/client';

const api = createApiClient({ url });
const { message } = await api.greeting.create({ name: 'Ada' });
```

## Rules

- Clients import only `@acme/api/contract` and `@acme/api/client`.
- The router gets request values from `ApiContext`. The server supplies them. The API package does not import `auth` or `db` directly.
