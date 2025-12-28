import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000, // AI calls can take time
    include: ["src/**/*.test.ts"],
  },
});
