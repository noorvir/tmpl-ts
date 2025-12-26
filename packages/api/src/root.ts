import { authRouter } from "./router/auth";
import { healthRouter } from "./router/health";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
