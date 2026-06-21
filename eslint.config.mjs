import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // TypeScript rules — enable useful ones
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "warn",
    "@typescript-eslint/prefer-as-const": "warn",
    
    // React rules
    "react-hooks/exhaustive-deps": "warn",
    "react-hooks/purity": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    
    // Next.js rules
    "@next/next/no-img-element": "off",
    "@next/next/no-html-link-for-pages": "off",
    
    // General JavaScript rules — enable useful ones
    "prefer-const": "warn",
    "no-unused-vars": "off",
    "no-console": "warn",
    "@next/next/no-assign-module-variable": "off",
    "no-debugger": "warn",
    "no-empty": "warn",
    "no-irregular-whitespace": "warn",
    "no-case-declarations": "warn",
    "no-fallthrough": "warn",
    "no-mixed-spaces-and-tabs": "warn",
    "no-redeclare": "warn",
    "no-undef": "off", // Handled by TypeScript strict
    "no-unreachable": "warn",
    "no-useless-escape": "warn",
  },
}, {
  rules: {
    // In test files, allow `any` for mock implementations and `beforeEach` unused
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "no-unused-vars": "off",
  },
  files: ["**/__tests__/**", "**/*.test.*", "**/*.spec.*", "test/**"],
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;
