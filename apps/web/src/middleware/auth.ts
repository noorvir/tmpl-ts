/**
 * Auth middleware for protecting routes
 *
 * === AUTH MIDDLEWARE ===
 * To disable auth: delete this file
 * === END AUTH MIDDLEWARE ===
 *
 * Usage in route files:
 *
 * import { authMiddleware } from "@/middleware/auth";
 *
 * export const Route = createFileRoute("/dashboard")({
 *   component: DashboardComponent,
 *   server: {
 *     middleware: [authMiddleware],
 *   },
 * });
 */

import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "@acme/auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session) {
    // Redirect to home page when not authenticated
    // Change this to your login page when you create one
    throw redirect({ to: "/" });
  }

  return next();
});

