import { expo } from "@better-auth/expo";
import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { oAuthProxy } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { env } from "@acme/config/env";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: env.NEXT_PUBLIC_APP_URL,
  secret: env.AUTH_SECRET,
  plugins: [
    oAuthProxy({
      /**
       * Auto-inference blocked by https://github.com/better-auth/better-auth/pull/2891
       */
      currentURL: env.NEXT_PUBLIC_APP_URL,
      productionURL: env.NEXT_PUBLIC_APP_URL,
    }),
    expo(),
    tanstackStartCookies(), // Must be last plugin for TanStack Start cookie handling
  ],
  socialProviders: {
    github: {
      clientId: "",
      clientSecret: "",
      clientKey: "",
    },
  },
  trustedOrigins: ["expo://"],
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];
