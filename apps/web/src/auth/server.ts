import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@acme/auth";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export { auth };
