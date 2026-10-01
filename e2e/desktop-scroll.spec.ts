import { expect, test, type Page } from '@playwright/test';

// Desktop parity for the horizontal strips (owner report: "on desktop it's just instant").
// Each check samples scrollLeft every animation frame and asserts the motion is spread over
// several frames rather than landing in one jump.

const STRIP = 'div.overflow-x-auto.cursor-grab';

test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });

async function record(page: Page, action: () => Promise<void>, settleMs = 1300) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    const w = window as unknown as { __rec: number[]; __raf: number };
    w.__rec = [];
    const f = () => { w.__rec.push(Math.round(el.scrollLeft)); w.__raf = requestAnimationFrame(f); };
    w.__raf = requestAnimationFrame(f);
  }, STRIP);
  await action();
  await page.waitForTimeout(settleMs);
  const rec = await page.evaluate(() => {
    const w = window as unknown as { __rec: number[]; __raf: number };
    cancelAnimationFrame(w.__raf);
    return w.__rec;
  });
  const distinct = rec.filter((v, i) => i === 0 || v !== rec[i - 1]);
  const jumps = rec.slice(1).map((v, i) => Math.abs(v - rec[i]));
  return { start: rec[0], end: rec[rec.length - 1], frames: distinct.length - 1, maxJump: Math.max(0, ...jumps) };
}

async function openHome(page: Page) {
  await page.goto('/');
  await page.locator(STRIP).waitFor();
  await page.waitForTimeout(1200); // entrance glide
  const box = (await page.locator(STRIP).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test('mouse drag follows the pointer, glides on release, and does not click a card', async ({ page }) => {
  const { x, y } = await openHome(page);
  const r = await record(page, async () => {
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) { await page.mouse.move(x - i * 30, y); await page.waitForTimeout(16); }
    await page.mouse.up();
  });
  expect(r.end).toBeGreaterThan(r.start);
  expect(r.frames).toBeGreaterThanOrEqual(10); // not one snap-jump
  expect(r.maxJump).toBeLessThan((r.end - r.start) / 2); // the old behaviour moved the whole way in one frame
  await expect(page).toHaveURL(/\/$/); // the drag's click was swallowed (a double-click would navigate)
});

test('dot navigation animates over several frames', async ({ page }) => {
  await openHome(page);
  const dots = page.locator(STRIP).locator('xpath=preceding-sibling::div[1]//button');
  const r = await record(page, () => dots.nth(3).click());
  expect(r.end).toBeGreaterThan(r.start);
  expect(r.frames).toBeGreaterThanOrEqual(8);
  expect(r.maxJump).toBeLessThan((r.end - r.start) / 2); // the old behaviour moved the whole way in one frame
});

test('a vertical mouse wheel over the strip scrolls it sideways, smoothly', async ({ page }) => {
  const { x, y } = await openHome(page);
  await page.mouse.move(x, y);
  const scrollY0 = await page.evaluate(() => window.scrollY);
  const r = await record(page, () => page.mouse.wheel(0, 120), 800);
  expect(r.end).toBeGreaterThan(r.start);
  expect(r.frames).toBeGreaterThanOrEqual(8);
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY0); // the page itself did not scroll
});

test('a plain click on a side card still centres it', async ({ page }) => {
  await openHome(page);
  const card = page.locator(STRIP).locator(':scope > div').nth(1);
  const r = await record(page, () => card.click());
  expect(r.end).toBeGreaterThan(r.start);
  expect(r.frames).toBeGreaterThanOrEqual(5);
});

test.describe('touch (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('a touch swipe still scrolls the strip natively', async ({ page, context }) => {
    await page.goto('/');
    await page.locator(STRIP).waitFor();
    await page.waitForTimeout(1200);
    const box = (await page.locator(STRIP).boundingBox())!;
    const y = box.y + box.height / 2;
    const x0 = box.x + box.width * 0.75;
    const cdp = await context.newCDPSession(page);
    const r = await record(page, async () => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
      for (let i = 1; i <= 8; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - i * 20, y }] });
        await page.waitForTimeout(16);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    });
    expect(r.end).toBeGreaterThan(r.start);
    expect(r.frames).toBeGreaterThanOrEqual(5);
  });
});
