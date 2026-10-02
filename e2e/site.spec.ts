import { expect, test, type Page } from '@playwright/test';

// Explainer site (site/dist, served by scripts/serve-site.mjs; Playwright project `site`).
// Acceptance for RC-13.2 (.planning/ISSUES.md §M13): reveal contract, header/footer, mobile nav.

const REVEAL = '.reveal';

/** Every `.reveal` with its computed opacity, data flags and viewport position. */
async function revealState(page: Page) {
  return page.evaluate((sel) => {
    const vh = window.innerHeight;
    return [...document.querySelectorAll<HTMLElement>(sel)].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        opacity: Number(getComputedStyle(el).opacity),
        inview: 'inview' in el.dataset,
        instant: 'instant' in el.dataset,
        top: r.top,
        bottom: r.bottom,
        onScreen: r.bottom > 0 && r.top < vh,
      };
    });
  }, REVEAL);
}

test.describe('reveal', () => {
  // Phone viewport: the fixture cards stack, so several sit below the fold (at 1440x900 the
  // placeholder page fits in one screen; RC-13.3's real sections will not).
  test.use({ viewport: { width: 390, height: 844 } });

  test('page has below-the-fold reveal items to exercise', async ({ page }) => {
    await page.goto('/');
    const state = await revealState(page);
    expect(state.length).toBeGreaterThanOrEqual(6);
    expect(state.some((s) => !s.onScreen)).toBe(true); // the fixtures sit below 844px
  });

  test.describe('JavaScript disabled', () => {
    test.use({ javaScriptEnabled: false });
    test('everything is visible and nothing is hidden', async ({ page }) => {
      await page.goto('/');
      expect(await page.evaluate(() => 'js' in document.documentElement.dataset)).toBe(false);
      const state = await revealState(page);
      for (const s of state) expect(s.opacity).toBe(1);
      // The mobile menu is not a trap with JS off: shown open, no useless button.
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator('[data-menu-toggle]')).toBeHidden();
      await expect(page.locator('#mobile-menu a').first()).toBeVisible();
    });
  });

  test('below-the-fold items hide, then fade in once when scrolled to', async ({ page }) => {
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => 'js' in document.documentElement.dataset)).toBe(true);
    // Web fonts (display=swap) reflow the hero after reveal.js ran, which can move a card across
    // the fold; wait for them so the snapshot below is stable.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const before = await revealState(page);
    const below = before.filter((s) => !s.onScreen);
    expect(below.length).toBeGreaterThan(0);
    for (const s of below) {
      expect(s.inview).toBe(false);
      expect(s.opacity).toBe(0);
    }
    // Items on screen at init were shown at once, with no fade.
    expect(before.some((x) => x.onScreen && x.inview && x.instant)).toBe(true);
    for (const s of before.filter((x) => x.onScreen)) expect(s.inview).toBe(true);

    // Bring exactly one item in (its top 20px above the fold): it is flagged once, animates
    // (no data-instant) and ends visible. scrollIntoViewIfNeeded would pull 3 stacked cards in
    // at once, which the fast-batch rule correctly shows instantly.
    const i = before.findIndex((s) => !s.onScreen);
    const firstBelow = page.locator(REVEAL).nth(i);
    await page.evaluate((top) => window.scrollBy(0, top - window.innerHeight + 20), before[i].top);
    await expect(firstBelow).toHaveAttribute('data-inview', '');
    await expect(firstBelow).not.toHaveAttribute('data-instant', '');
    await expect.poll(() => firstBelow.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });

  test('End then wheel up leaves no blank band', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await page.waitForTimeout(400);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(500); // let any fade finish
    const state = await revealState(page);
    const blank = state.filter((s) => s.onScreen && (s.opacity < 1 || !s.inview));
    expect(blank).toEqual([]);
    // Everything that is now above the viewport was swept too.
    expect(state.filter((s) => s.bottom < 0 && !s.inview)).toEqual([]);
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('reveal is opacity only and nothing keeps animating', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('End');
      await page.waitForTimeout(1000);
      const anims = await page.evaluate(() =>
        document.getAnimations().map((a) => ({
          state: a.playState,
          // KeyframeEffect: every keyframe may only touch opacity.
          props: ((a.effect as KeyframeEffect | null)?.getKeyframes() ?? []).flatMap((k) =>
            Object.keys(k).filter((p) => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)),
          ),
        })),
      );
      expect(anims.filter((a) => a.state === 'running')).toEqual([]);
      for (const a of anims) expect(a.props.every((p) => p === 'opacity')).toBe(true);
    });
  });

  test('print media shows everything', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print' });
    // Cards carry .transition-ui (opacity transitions over --motion-base), so the computed
    // value needs that long to settle; a real print snapshot has no such window.
    await page.waitForTimeout(600);
    const state = await revealState(page);
    expect(state.length).toBeGreaterThan(0);
    for (const s of state) expect(s.opacity).toBe(1);
    const dim = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('main *')].filter((el) => Number(getComputedStyle(el).opacity) < 1).length,
    );
    expect(dim).toBe(0);
  });
});

test.describe('header and footer', () => {
  test('desktop: brand, nav, active underline, CTA to the app', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const header = page.locator('header.site-header');
    await expect(header.getByRole('link', { name: /RoughCut BBQ/ })).toBeVisible();
    const home = header.locator('.site-nav a[data-tab]').first();
    await expect(home).toHaveAttribute('aria-current', 'page');
    const cta = header.getByRole('link', { name: 'Open the app' });
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute('href')).toMatch(/^https:\/\/app\.roughcut\.com\.au\/calculator\?utm_source=site/);
    await expect(header.locator('[data-menu-toggle]')).toBeHidden();

    const footer = page.locator('footer.site-footer');
    await expect(footer.getByText('As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.')).toBeVisible();
    await expect(footer.getByText(new RegExp(`© ${new Date().getFullYear()} RoughCut BBQ`))).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', 'https://app.roughcut.com.au/privacy');
  });

  test.describe('390px', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('no horizontal scroll', async ({ page }) => {
      await page.goto('/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });

    test('mobile menu opens and closes by keyboard with aria-expanded and inert', async ({ page }) => {
      await page.goto('/');
      const toggle = page.locator('[data-menu-toggle]');
      const inner = page.locator('#mobile-menu > div');
      const firstLink = page.locator('#mobile-menu a').first();

      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toHaveAttribute('aria-controls', 'mobile-menu');
      await expect(inner).toHaveAttribute('inert', '');
      await expect(firstLink).toBeHidden();

      await toggle.focus();
      await page.keyboard.press('Enter');
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(inner).not.toHaveAttribute('inert', '');
      await expect(page.locator('#mobile-menu')).toHaveAttribute('data-open', '');
      await expect(firstLink).toBeVisible();
      await page.keyboard.press('Tab');
      await expect(firstLink).toBeFocused(); // reachable once open
      expect(await firstLink.getAttribute('href')).toBeTruthy();

      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(inner).toHaveAttribute('inert', '');
      await expect(toggle).toBeFocused();
      await expect(firstLink).toBeHidden();
      // Closed: Tab from the toggle skips the whole menu.
      await page.keyboard.press('Tab');
      await expect(firstLink).not.toBeFocused();
    });
  });
});
