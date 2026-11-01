import { QueryClient } from "@tanstack/react-query";

import { createApiClient } from "@acme/api/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

// A physical device needs the IP address of your computer in this variable.
const url = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

export const api = createApiClient({ url });
