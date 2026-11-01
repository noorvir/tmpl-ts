import { createRouter, publicProcedure } from "./init";

/** The backend for this frontend. Other apps call the API directly. */
export const appRouter = createRouter({
  health: {
    check: publicProcedure.query(({ ctx }) => ctx.api.health.check()),
  },
  // @module auth
  auth: {
    getSession: publicProcedure.query(({ ctx }) => ctx.api.auth.getSession()),
  },
  // @end-module
});

export type AppRouter = typeof appRouter;
