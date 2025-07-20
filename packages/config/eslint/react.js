import * as reactHooks from "eslint-plugin-react-hooks";
import * as react from "eslint-plugin-react";

export default [
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: ["**/*.tsx"],
    plugins: {
      react,
    },
    rules: {
      "react-hooks/react-compiler": "error",
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
