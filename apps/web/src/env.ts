import { z } from "zod";

const envSchema = z.object({
  API_URL: z.url().default("http://127.0.0.1:3001"),
});

/** Server-side environment of the web app. */
export function getEnv() {
  return envSchema.parse(process.env);
}
