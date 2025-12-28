import baseConfig, { restrictEnvAccess } from "@acme/config/eslint/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["src/**/"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
