import { createFileRoute } from "@tanstack/react-router";

import "@tanstack/react-start";

import { auth } from "@acme/auth";

// === AUTH HANDLER ===
// To disable auth: delete this file
// === END AUTH HANDLER ===

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
});

