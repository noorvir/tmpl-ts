import { initTRPC } from "@trpc/server";

import { createApiClient } from "@acme/api/client";

import { getEnv } from "~/env";

/** Each procedure calls the API as the signed-in browser user. */
export function createContext(args: { headers: Headers }) {
  const { headers } = args;
  const { API_URL } = getEnv();
  const cookie = headers.get("cookie");

  let forwarded: Record<string, string> = {};
  if (cookie) {
    forwarded = { cookie };
  }

  return { api: createApiClient({ url: API_URL, headers: forwarded }) };
}

const t = initTRPC.context<ReturnType<typeof createContext>>().create();

export const createRouter = t.router;
export const publicProcedure = t.procedure;
