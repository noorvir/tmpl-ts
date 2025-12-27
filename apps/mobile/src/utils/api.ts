import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

import type { AppRouter } from "@acme/api";

// Get the API base URL
const getBaseUrl = () => {
  // For physical device, use your computer's IP
  // For simulator, localhost works
  return "http://localhost:3000";
};

// Create a query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
});

// Create tRPC client
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === "development" ||
        (opts.direction === "down" && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});

// Create tRPC React Query options proxy
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});

