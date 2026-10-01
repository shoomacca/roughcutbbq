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

test('/results with kg=1000 redirects to /calculator', async ({ page }) => {
  await page.goto('/results?method=smoker&cat=pork&cut=pork_shoulder&kg=1000');
  await expect(page).toHaveURL(/\/calculator$/);
});

test('/cook "Open in calculator" link beats a previously stored cook in sessionStorage', async ({ page }) => {
  // Store a different cook (whole chicken) the way the calculator does.
  await page.goto('/gear');
  await page.evaluate(() => {
    const input = { method: 'smoker', categoryId: 'chicken', cutId: 'whole_chicken', weightKg: 2 };
    sessionStorage.setItem('bbq_input', JSON.stringify(input));
    sessionStorage.setItem(
      'bbq_result',
      JSON.stringify({
        cutName: 'Whole Chicken', categoryName: 'Chicken', method: 'smoker', weightKg: 2,
        cookTimeHours: 3, applianceTempC: 120, internalTempC: 74, safeMinTempC: 74, restMinutes: 10,
        isFlat: false, cutCategory: 'bbq', milestones: [], rubs: [], woods: [], tips: [],
      })
    );
  });
  await page.goto('/cook/smoker/pork-shoulder');
  await page.getByRole('link', { name: /Plan a 2 kg cook/ }).click();
  await expect(page).toHaveURL(/\/results\?/);
  await expect(page.getByText(/Pork Shoulder/).filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/Whole Chicken/)).toHaveCount(0);
});
