import { implement } from "@orpc/server";

// @module auth
import type { Session } from "./contract.ts";
// @end-module
import { contract } from "./contract.ts";

/** Values that the server supplies for each request. */
export type ApiContext = {
  headers: Headers;
  // @module auth
  getSession: () => Promise<Session | null>;
  // @end-module
};

const os = implement(contract).$context<ApiContext>();

export const router = os.router({
  health: {
    check: os.health.check.handler(() => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    })),
  },
  greeting: {
    create: os.greeting.create.handler(({ input }) => ({
      message: `Hello, ${input.name}`,
    })),
  },
  // @module auth
  auth: {
    getSession: os.auth.getSession.handler(({ context }) =>
      context.getSession(),
    ),
  },
  // @end-module
});
