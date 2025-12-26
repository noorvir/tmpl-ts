/**
 * Single entry point for all server-side API exports
 * This prevents circular dependencies in serverless environments
 *
 * Import from "@acme/api" which re-exports from this file
 */

export { appRouter } from "./root";
export type { AppRouter } from "./root";

export { createTRPCContext } from "./context";
export type { TRPCContext } from "./context";

export {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "./trpc";

