import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node.js automation scripts — CommonJS, not app source
    "scripts/**",
    "tmp/**",
    "split_images.js",
    // CommonJS Vercel install hook; RC-0.3 deletes it
    "setup-source.js",
    "android/**",
    // Planning docs + one-off audit scripts, not app source
    ".planning/**",
  ]),
]);

export default eslintConfig;
