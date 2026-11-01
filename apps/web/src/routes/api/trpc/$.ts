import { createFileRoute } from "@tanstack/react-router";

import "@tanstack/react-start";

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { createContext } from "~/trpc/init";
import { appRouter } from "~/trpc/router";

function handleRequest(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createContext({ headers: request.headers }),
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleRequest(request),
      POST: ({ request }) => handleRequest(request),
    },
  },
});
