import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { getOpenApiDocument } from "@acme/api/openapi";
import { router } from "@acme/api/router";
// @module auth
import type { Auth } from "@acme/auth";
// @end-module

export function createApp(args: {
  publicUrl: string;
  trustedOrigins: string[];
  // @module auth
  auth: Auth;
  // @end-module
}) {
  const { publicUrl, trustedOrigins } = args;
  // @module auth
  const { auth } = args;
  // @end-module
  const handler = new OpenAPIHandler(router);
  const app = new Hono();

  app.use("*", cors({ origin: trustedOrigins, credentials: true }));

  app.get("/openapi.json", async (c) => {
    const document = await getOpenApiDocument({ serverUrl: publicUrl });
    return c.json(document);
  });

  // @module auth
  app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  // @end-module
  app.all("*", async (c) => {
    const { headers } = c.req.raw;
    const result = await handler.handle(c.req.raw, {
      context: {
        headers,
        // @module auth
        getSession: () => auth.api.getSession({ headers }),
        // @end-module
      },
    });

    if (!result.matched) {
      return c.notFound();
    }

    return result.response;
  });

  return app;
}
