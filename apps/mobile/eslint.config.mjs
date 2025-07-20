import baseConfig from "@acme/config/eslint/base";
import reactConfig from "@acme/config/eslint/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  ...baseConfig,
  ...reactConfig,
];
