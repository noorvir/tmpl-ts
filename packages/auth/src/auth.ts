import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import type { PrismaClient } from "@acme/db";

/** Returns the auth instance. The server mounts its handler at `/api/auth`. */
export function createAuth(args: {
  prisma: PrismaClient;
  secret: string;
  baseURL: string;
  trustedOrigins: string[];
}) {
  const { prisma, secret, baseURL, trustedOrigins } = args;

  return betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    secret,
    baseURL,
    trustedOrigins,
    emailAndPassword: { enabled: true },
  });
}

export type Auth = ReturnType<typeof createAuth>;
