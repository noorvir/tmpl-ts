import "server-only";

import { cache } from "react";

import { auth } from "@acme/auth";

export const getSession = cache(async () => {
  // TODO: Get headers from request context in TanStack Start
  // For now, return null session until we implement server functions properly
  return null;
});

export { auth };
