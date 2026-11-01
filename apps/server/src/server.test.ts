import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { ServerType } from "@hono/node-server";
import { serve } from "@hono/node-server";
import { z } from "zod";

import { createApiClient } from "@acme/api/client";
// @module auth
import { createAuth } from "@acme/auth";
// @end-module
// @module db
import { createPrisma } from "@acme/db";
// @end-module

import { createApp } from "./app.ts";

let url = process.env.API_URL ?? "";
let server: ServerType | undefined;

before(async () => {
  if (url) {
    return;
  }

  const app = createApp({
    publicUrl: "http://127.0.0.1",
    trustedOrigins: [],
    // @module auth
    // A session read with no cookie does not connect to this database.
    auth: createAuth({
      prisma: createPrisma({ url: "postgresql://localhost:1/unused" }),
      secret: "test-secret-with-at-least-32-characters",
      baseURL: "http://127.0.0.1",
      trustedOrigins: [],
    }),
    // @end-module
  });

  const port = await new Promise<number>((resolve) => {
    server = serve(
      { fetch: app.fetch, hostname: "127.0.0.1", port: 0 },
      (info) => resolve(info.port),
    );
  });

  url = `http://127.0.0.1:${port}`;
});

after(() => {
  server?.close();
});

test("/health answers", async () => {
  const response = await fetch(`${url}/health`);
  const body = z
    .object({ status: z.string() })
    .parse(await response.json());

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
});

test("/openapi.json lists the routes", async () => {
  const response = await fetch(`${url}/openapi.json`);
  const document = z
    .object({
      openapi: z.string(),
      paths: z.record(z.string(), z.record(z.string(), z.unknown())),
    })
    .parse(await response.json());

  assert.equal(response.status, 200);
  assert.match(document.openapi, /^3\./);
  assert.ok(document.paths["/health"]?.get);
  assert.ok(document.paths["/greeting"]?.post);
  // @module auth
  assert.ok(document.paths["/auth/session"]?.get);
  // @end-module
});

test("the typed client calls the server", async () => {
  const api = createApiClient({ url });

  const health = await api.health.check();
  const greeting = await api.greeting.create({ name: "Ada" });

  assert.equal(health.status, "ok");
  assert.equal(greeting.message, "Hello, Ada");
});

test("the server rejects invalid input", async () => {
  const api = createApiClient({ url });

  await assert.rejects(() => api.greeting.create({ name: "" }));
});

// @module auth
test("a request with no cookie has no session", async () => {
  const api = createApiClient({ url });

  const session = await api.auth.getSession();

  assert.equal(session, null);
});

// @end-module
test("an unknown path answers 404", async () => {
  const response = await fetch(`${url}/unknown`);

  assert.equal(response.status, 404);
});
