import baseConfig from "@acme/config/eslint/base.js";
import reactConfig from "@acme/config/eslint/react.js";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
