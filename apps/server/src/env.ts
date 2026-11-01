import { z } from "zod";

const envSchema = z.object({
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().default(3001),
  PUBLIC_URL: z.url().default("http://127.0.0.1:3001"),
  TRUSTED_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((value) => value.split(",")),
  // @module auth
  AUTH_SECRET: z.string().min(32),
  // @end-module
  // @module db
  DATABASE_URL: z.url(),
  // @end-module
});

export function getEnv(source: NodeJS.ProcessEnv) {
  return envSchema.parse(source);
}
