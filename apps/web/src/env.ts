import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url().optional(),
    AUTH_SECRET: z.string().min(1).optional(),
  },

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `VITE_`.
   */
  client: {
    // VITE_PUBLIC_CLIENTVAR: z.string(),
  },
  clientPrefix: "VITE_",
  /**
   * Use import.meta.env for Vite apps (process.env doesn't exist in browser)
   */
  runtimeEnv: {
    NODE_ENV: import.meta.env.MODE,
    DATABASE_URL: import.meta.env.DATABASE_URL,
    AUTH_SECRET: import.meta.env.AUTH_SECRET,
  },
  skipValidation: !!import.meta.env.CI,
});
