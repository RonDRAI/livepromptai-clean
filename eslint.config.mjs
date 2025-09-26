import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Allow unused variables (warnings instead of errors)
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow any type usage
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "warn",
      // Allow missing dependencies in useEffect
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
