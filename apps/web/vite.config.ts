import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 3000 },
  plugins: [
    tanstackStart({ srcDirectory: "src" }),
    tsConfigPaths(),
    tailwindcss(),
    viteReact(),
  ],
});
