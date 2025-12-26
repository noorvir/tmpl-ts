import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "./root";

// Re-export from server.ts (single entry point)
export {
  appRouter,
  createTRPCContext,
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "./server";

export type { AppRouter, TRPCContext } from "./server";

// Convenience exports
import { appRouter } from "./root";
import { createCallerFactory } from "./trpc";

const createCaller = createCallerFactory(appRouter);

type RouterInputs = inferRouterInputs<AppRouter>;
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { createCaller };
export type { RouterInputs, RouterOutputs };
