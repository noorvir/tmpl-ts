import baseConfig, { restrictEnvAccess } from "@acme/config/eslint/base";
import nextjsConfig from "@acme/config/eslint/nextjs";
import reactConfig from "@acme/config/eslint/react";

export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
