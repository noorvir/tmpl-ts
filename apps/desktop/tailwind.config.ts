import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/renderer/src/**/*.{ts,tsx,html}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;