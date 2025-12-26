/**
 * Context composition - combines base context with optional middleware
 *
 * === AUTH INTEGRATION ===
 * To disable auth:
 * 1. Remove the withAuth import below
 * 2. Remove the auth import below
 * 3. Change createTRPCContext to just return createBaseContext(opts.headers)
 * === END AUTH INTEGRATION ===
 */

import { auth } from "@acme/auth";

import { createBaseContext } from "./base";
import { withAuth } from "./with-auth";

export type { BaseContext } from "./base";
export type { AuthContext } from "./with-auth";

export const createTRPCContext = async (args: { headers: Headers }) => {
  const ctx = createBaseContext(args.headers);
  return withAuth(ctx, auth);
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

