import type { Config } from "tailwindcss";

import baseConfig from "@acme/ui/tailwind/web";

export default {
  content: ["./src/**/*.{ts,tsx}", "../ui/src/**/*.{ts,tsx}"],
  presets: [baseConfig],
} satisfies Config;