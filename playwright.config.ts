import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
/** Static explainer site (site/dist), built by scripts/build-site.mjs and served by scripts/serve-site.mjs. */
const SITE_PORT = 3101;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /site\.spec\.ts/ },
    {
      name: 'site',
      testMatch: /site\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${SITE_PORT}` },
    },
  ],
  webServer: [
    {
      // Build first, then serve the production build. No Supabase env vars are set on purpose.
      command: `npm run build && npm run start -- -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
    {
      command: `npm run site:build && node scripts/serve-site.mjs ${SITE_PORT}`,
      url: `http://localhost:${SITE_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
