import { QueryClient } from "@tanstack/react-query";

import { createApiClient } from "@acme/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1000,
      retry: 1,
    },
  },
});

const url = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const api = createApiClient({ url });
