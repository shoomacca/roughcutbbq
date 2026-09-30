import { expect, test, type Page } from '@playwright/test';

// Console errors known to occur with no Supabase/PostHog env. Anything else fails the test.
const KNOWN_CONSOLE_ERRORS: RegExp[] = [];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return () => errors.filter((e) => !KNOWN_CONSOLE_ERRORS.some((re) => re.test(e)));
}

test('home loads with no unexpected console errors', async ({ page }) => {
  const unexpected = collectErrors(page);
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await page.waitForLoadState('networkidle');
  expect(unexpected()).toEqual([]);
});

test('calculator flow reaches /results for a real cut', async ({ page }) => {
  // URL-param path (the shared-link route the app supports), not the carousel UI.
  await page.goto('/results?method=smoker&cat=pork&cut=pork_shoulder&kg=3');
  await expect(page).toHaveURL(/\/results\?/);
  await expect(page.getByText(/Pork Shoulder/).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/~\d+ hrs?/).filter({ visible: true }).first()).toBeVisible();
});

// The route slug is hyphenated (cutToSlug). The underscore form /cook/smoker/pork_shoulder
// (as written in ISSUES.md) returns 404 today; reported in RC-0.5, not asserted here.
test('/cook/smoker/pork-shoulder returns 200 and shows a cook time', async ({ page }) => {
  const res = await page.goto('/cook/smoker/pork-shoulder');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/\d+ hrs?|\d+ min/).first()).toBeVisible();
});

test('/gear returns 200', async ({ page }) => {
  const res = await page.goto('/gear');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'BBQ Gear' })).toBeVisible();
});
