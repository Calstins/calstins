import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/qa/**", "coverage/**"]),
  {
    rules: {
      // Legacy admin CRUD screens use loosely-typed records; new code is typed.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
