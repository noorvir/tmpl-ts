import type { TRPCRouterRecord } from "@trpc/server";

import { publicProcedure } from "../trpc";

export const healthRouter = {
  check: publicProcedure.query(() => {
    return {
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    };
  }),
} satisfies TRPCRouterRecord;


