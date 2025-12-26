import type { Config } from "tailwindcss";

// Note: NativeWind requires Tailwind v3, so this config is for v3 compatibility
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;

