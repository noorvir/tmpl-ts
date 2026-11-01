// @module ui
import { fileURLToPath } from "node:url";

// @end-module
/** @typedef {import("prettier").Config} PrettierConfig */
// @module ui
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
// @end-module
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig } */
const config = {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    // @module ui
    "prettier-plugin-tailwindcss",
    // @end-module
  ],
  // @module ui
  tailwindConfig: fileURLToPath(
    new URL("../../ui/tailwind/web.ts", import.meta.url),
  ),
  tailwindFunctions: ["cn", "cva"],
  // @end-module
  importOrder: [
    "<TYPES>",
    "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
    // @module mobile
    "^(expo(.*)$)|^(expo$)",
    // @end-module
    "<THIRD_PARTY_MODULES>",
    "",
    "<TYPES>^@acme",
    "^@acme/(.*)$",
    "",
    "<TYPES>^[.|..|~]",
    "^~/",
    "^[../]",
    "^[./]",
  ],
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  importOrderTypeScriptVersion: "5.0.0",
};

export default config;
