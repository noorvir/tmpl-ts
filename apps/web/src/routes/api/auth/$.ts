import { createFileRoute } from "@tanstack/react-router";

import "@tanstack/react-start";

import { getEnv } from "~/env";

/** Keeps auth cookies on the web origin. The API server owns auth. */
async function forwardToApi(request: Request) {
  const { API_URL } = getEnv();
  const { pathname, search } = new URL(request.url);

  const headers = new Headers(request.headers);
  headers.delete("host");

  const body = await request.arrayBuffer();
  const response = await fetch(`${API_URL}${pathname}${search}`, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => forwardToApi(request),
      POST: ({ request }) => forwardToApi(request),
    },
  },
});
