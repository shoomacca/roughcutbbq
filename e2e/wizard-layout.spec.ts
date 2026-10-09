import { expect, test } from '@playwright/test';

// The wizard must not jump between steps: step indicator and carousel row top stay put (±2px).
test.use({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });

test('wizard step indicator and first tile row keep the same y across steps', async ({ page }) => {
  const y = async () =>
    page.evaluate(() => {
      const top = (sel: string) => document.querySelector(sel)?.getBoundingClientRect().top ?? NaN;
      return {
        indicator: top('main .rounded-full.w-7'),
        tile: top('main [style*="scroll-snap-type"]'),
      };
    });
  const next = async () => {
    await page.locator('main button:has-text("→")').last().click();
    await page.waitForTimeout(1500);
  };

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const category = await y();
  await next();
  await expect(page).toHaveURL(/\/calculator/);
  const method = await y();
  await next();
  const cut = await y();

  for (const step of [method, cut]) {
    expect(Math.abs(step.indicator - category.indicator)).toBeLessThanOrEqual(2);
    expect(Math.abs(step.tile - category.tile)).toBeLessThanOrEqual(2);
  }
});
