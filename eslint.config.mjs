import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // Allow `any` for legacy migration — target: remove after full migration
    "@typescript-eslint/no-explicit-any": "warn",
    // Catch unused vars but allow underscore-prefixed args
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

    // React hooks deps must be exhaustive to prevent stale closures
    "react-hooks/exhaustive-deps": "warn",

    // Warn on console.log — use a proper logger in production
    "no-console": "warn",
    // Prefer const over let when variable is never reassigned
    "prefer-const": "warn",

    // Next.js is OK with <img> when we use it intentionally
    "@next/next/no-img-element": "off",

    // Allow unescaped entities in JSX (common in streaming metadata)
    "react/no-unescaped-entities": "off",

    // Intentionally sync server data to form state in effects
    "react-hooks/set-state-in-effect": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills"]
}];

export default eslintConfig;
