import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname) },
  },
  // scripts/build-site.mjs imports lib/*.ts (the real calculator engine). vite-node externalizes
  // .mjs files by default, which would hand the TS imports to plain Node; inline it instead.
  test: {
    server: { deps: { inline: [/build-site\.mjs$/] } },
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
