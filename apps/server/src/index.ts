import { serve } from "@hono/node-server";

// @module auth
import { createAuth } from "@acme/auth";
// @end-module
// @module db
import { createPrisma } from "@acme/db";
// @end-module

import { createApp } from "./app.ts";
import { getEnv } from "./env.ts";

const env = getEnv(process.env);

// @module db
const prisma = createPrisma({ url: env.DATABASE_URL });
// @end-module

const app = createApp({
  publicUrl: env.PUBLIC_URL,
  trustedOrigins: env.TRUSTED_ORIGINS,
  // @module auth
  auth: createAuth({
    prisma,
    secret: env.AUTH_SECRET,
    baseURL: env.PUBLIC_URL,
    trustedOrigins: env.TRUSTED_ORIGINS,
  }),
  // @end-module
});

serve({ fetch: app.fetch, hostname: env.HOST, port: env.PORT }, (info) => {
  console.log("API server started", { host: info.address, port: info.port });
});
