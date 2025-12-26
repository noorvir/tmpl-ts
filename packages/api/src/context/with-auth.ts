/**
 * Auth middleware for context enhancement
 * To disable auth: remove this import from context/index.ts
 */

import type { Auth, Session } from "@acme/auth";

export type AuthContext = {
  session: Session | null;
  authApi: Auth["api"];
};

export const withAuth = async <T extends { headers: Headers }>(
  ctx: T,
  auth: Auth,
): Promise<T & AuthContext> => {
  const session = await auth.api.getSession({ headers: ctx.headers });
  return {
    ...ctx,
    session: session as Session | null,
    authApi: auth.api,
  };
};
