import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { calculateCook, formatCookTime } from '../lib/calculator';
import { findCut } from '../lib/seo';
import type { CookingMethod } from '../types/calculator';

// Explainer site (site/dist, served by scripts/serve-site.mjs; Playwright project `site`).
// Acceptance for RC-13.2 (.planning/ISSUES.md §M13): reveal contract, header/footer, mobile nav.
// RC-13.3: hero without JS, CTA href, engine-driven sample card, featured links resolve live.

const SITE_CONFIG = JSON.parse(readFileSync(join(__dirname, '..', 'site', 'site.config.json'), 'utf8'));
const APP = SITE_CONFIG.APP_URL as string;

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
  // Phone viewport: the step cards, plan card and tiles stack, so most sit below the fold.
  test.use({ viewport: { width: 390, height: 844 } });

  test('page has below-the-fold reveal items to exercise', async ({ page }) => {
    await page.goto('/');
    const state = await revealState(page);
    expect(state.length).toBeGreaterThanOrEqual(6);
    expect(state.some((s) => !s.onScreen)).toBe(true); // 3 steps + plan card + 6 tiles sit below 844px
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
    // Items on screen at init were shown at once, with no fade. (At 390x844 the hero fills the
    // first screen and carries no .reveal, so this may be vacuous here; the desktop test below
    // asserts the rule with items present.)
    for (const s of before.filter((x) => x.onScreen)) {
      expect(s.inview).toBe(true);
      expect(s.instant).toBe(true);
    }

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

  test('desktop: items on screen at init are shown at once, with no fade', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => 'js' in document.documentElement.dataset)).toBe(true);
    const state = await revealState(page);
    const onScreen = state.filter((s) => s.onScreen);
    expect(onScreen.length).toBeGreaterThan(0); // the "how it works" cards sit under the hero at 1440x900
    for (const s of onScreen) {
      expect(s.inview).toBe(true);
      expect(s.instant).toBe(true);
      expect(s.opacity).toBe(1);
    }
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

test.describe('home (RC-13.3)', () => {
  test.describe('JavaScript disabled', () => {
    test.use({ javaScriptEnabled: false });
    test('the hero H1, subhead and CTA are visible with no JS', async ({ page }) => {
      await page.goto('/');
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();
      await expect(h1).toHaveText('Know when your BBQ will be done.');
      await expect(page.locator('.hero .lede')).toBeVisible();
      await expect(page.locator('.hero').getByRole('link', { name: 'Start a cook →' })).toBeVisible();
    });
  });

  test('hero CTA goes to the app calculator with utm_source=site', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('.hero').getByRole('link', { name: 'Start a cook →' });
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute('href')).toBe(`${APP}/calculator?utm_source=site&utm_medium=hero`);
    // The secondary link scrolls to the sample plan on this page.
    await expect(page.locator('.hero').getByRole('link', { name: 'See a sample plan' })).toHaveAttribute('href', '#sample-plan');
  });

  test('the sample card shows calculateCook() for site.config.json sampleCut, labelled as an example', async ({ page }) => {
    const entry = findCut(SITE_CONFIG.sampleCut);
    if (!entry) throw new Error(`sampleCut ${SITE_CONFIG.sampleCut} not in meats.json`);
    const r = calculateCook({
      method: SITE_CONFIG.sampleMethod as CookingMethod,
      categoryId: entry.category.id,
      cutId: entry.cut.id,
      weightKg: Number(SITE_CONFIG.sampleKg),
    });
    await page.goto('/');
    const card = page.getByTestId('sample-plan');
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    await expect(card.getByText('Example plan')).toBeVisible();
    await expect(card.locator('.plan-title')).toHaveText(r.cutName);
    await expect(card.locator('[data-stat="cook-time"]')).toHaveText(`~${formatCookTime(r.cookTimeHours)}`);
    await expect(card.locator('[data-stat="pit-temp"]')).toHaveText(`${r.applianceTempC}°C`);
    await expect(card.locator('[data-stat="pull-temp"]')).toHaveText(`${r.internalTempC}°C`);
    await expect(card.locator('[data-stat="rest"]')).toHaveText(`${r.restMinutes} min`);
    await expect(card.locator('[data-stat="timeline"]')).toContainText(/Light the fire at \d{1,2}:\d{2} [ap]m to eat at \d{1,2}:\d{2} [ap]m\./);
    await expect(card.getByText('Example only', { exact: false })).toBeVisible();
    // "Plan this cook" carries the same input to the app's results page.
    const plan = page.locator('.sample').getByRole('link', { name: 'Plan this cook →' });
    expect(await plan.getAttribute('href')).toBe(
      `${APP}/results?method=${SITE_CONFIG.sampleMethod}&cat=${entry.category.id}&cut=${entry.cut.id}&kg=${Number(SITE_CONFIG.sampleKg)}&utm_source=site&utm_medium=sample`,
    );
  });

  test('featured tiles: 3 to 6, each with a sized photo, an engine time and an app cook link', async ({ page }) => {
    await page.goto('/');
    const tiles = page.locator('.tile-grid .tile');
    const n = await tiles.count();
    expect(n).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(6);
    const appRe = new RegExp(`^${APP.replace(/\./g, '\\.')}/cook/smoker/[a-z0-9-]+\\?utm_source=site`);
    for (let i = 0; i < n; i++) {
      const t = tiles.nth(i);
      expect(await t.getAttribute('href')).toMatch(appRe);
      const img = t.locator('img');
      expect(Number(await img.getAttribute('width'))).toBeGreaterThan(0);
      expect(Number(await img.getAttribute('height'))).toBeGreaterThan(0);
      expect((await img.getAttribute('alt')) ?? '').not.toBe('');
      await expect(t.locator('.tile-meta strong')).toHaveText(/\d+ (hrs?|min)/);
    }
  });

  test('hero and tile photos load from the site (no broken images)', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('End');
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLImageElement>('.tile img, .hero-img')].map((i) => i.complete && i.naturalWidth > 0),
        ),
      )
      .not.toContain(false);
  });

  // Network check against production: the pages the site links to must exist in the app.
  test('every featured link and the sample link resolve on the live app (200)', async ({ page, request }) => {
    test.slow();
    await page.goto('/');
    const hrefs = await page
      .locator('.tile-grid .tile, .sample a.btn')
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const href of hrefs) {
      const res = await request.get(href, { maxRedirects: 3, timeout: 30_000 });
      expect(res.status(), href).toBe(200);
    }
    // And each featured target is listed in the app's sitemap.
    const sitemap = await (await request.get(`${APP}/sitemap.xml`)).text();
    for (const href of hrefs.filter((h) => h.includes('/cook/'))) {
      const bare = href.split('?')[0];
      expect(sitemap, bare).toContain(`<loc>${bare}</loc>`);
    }
  });
});

test.describe('home (RC-13.4)', () => {
  test('guides: 5 links to the app guides, recipes count and link', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('.guide-list .guide-link');
    await expect(links).toHaveCount(5);
    const re = new RegExp(`^${APP.replace(/\./g, '\\.')}/guides/[a-z0-9-]+\\?utm_source=site`);
    for (let i = 0; i < 5; i++) {
      expect(await links.nth(i).getAttribute('href')).toMatch(re);
      await expect(links.nth(i).locator('.guide-title')).not.toBeEmpty();
    }
    await expect(page.locator('.recipes-card p')).toHaveText(/^\d{2,} tested cooks/);
    expect(await page.locator('.recipes-card a').getAttribute('href')).toBe(`${APP}/recipes?utm_source=site&utm_medium=recipes`);
  });

  test('gear: /go links, sponsored, paid-link tag, disclosure in the section; no Play section, no apk', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('.gear-grid .gear-name');
    await expect(items).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const a = items.nth(i);
      expect(await a.getAttribute('href')).toMatch(new RegExp(`^${APP.replace(/\./g, '\\.')}/go/[a-z0-9-]+\\?utm_source=site`));
      expect(await a.getAttribute('rel')).toBe('sponsored noopener');
      await expect(a.locator('.paid')).toHaveText('(paid link)');
    }
    await page.getByTestId('gear-disclosure').scrollIntoViewIfNeeded();
    await expect(page.getByTestId('gear-disclosure')).toHaveText('As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.');
    await expect(page.locator('#app')).toHaveCount(0);
    await expect(page.getByText('Google Play')).toHaveCount(0);
    expect(await page.content()).not.toMatch(/\.apk/i);
  });

  test('FAQ accordion: closed with aria-expanded=false and inert, opens and closes by keyboard; JSON-LD matches', async ({ page }) => {
    await page.goto('/');
    const toggles = page.locator('[data-faq-toggle]');
    const n = await toggles.count();
    expect(n).toBeGreaterThanOrEqual(4);
    const first = toggles.first();
    const answer = page.locator('#faq-1');
    await first.scrollIntoViewIfNeeded();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(answer.locator('> div')).toHaveAttribute('inert', '');
    await expect(answer.locator('p')).toBeHidden();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await expect(answer).toHaveAttribute('data-open', '');
    await expect(answer.locator('p')).toBeVisible();
    await page.keyboard.press('Space');
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(answer.locator('p')).toBeHidden();

    // The FAQPage JSON-LD carries exactly the rendered questions.
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    const faq = ld['@graph'].find((x: { '@type': string }) => x['@type'] === 'FAQPage');
    const rendered = await toggles.locator('span').allTextContents();
    expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(rendered);
    expect(ld['@graph'].map((x: { '@type': string }) => x['@type'])).toEqual(['Organization', 'WebSite', 'FAQPage']);
  });

  test.describe('JavaScript disabled', () => {
    test.use({ javaScriptEnabled: false });
    test('every FAQ answer is open and readable', async ({ page }) => {
      await page.goto('/');
      const answers = page.locator('.faq-a p');
      expect(await answers.count()).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < (await answers.count()); i++) await expect(answers.nth(i)).toBeVisible();
    });
  });

  test('sitemap.xml, robots.txt, og image and 404 page are served', async ({ page, request }) => {
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain(`<loc>${SITE_CONFIG.SITE_URL}/</loc>`);
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain(`Sitemap: ${SITE_CONFIG.SITE_URL}/sitemap.xml`);
    const og = await request.get('/og/home.png');
    expect(og.status()).toBe(200);
    expect(og.headers()['content-type']).toBe('image/png');
    await page.goto('/404.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('That page has gone cold.');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)'); // /site.css loaded
  });

  test('head: title <= 60 with brand once, canonical, og:image 1200x630, twitter card', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.match(/RoughCut/g)).toHaveLength(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE_CONFIG.SITE_URL}/`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${SITE_CONFIG.SITE_URL}/og/home.png`);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });

  test.describe('390px', () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test('still no horizontal scroll with the new sections', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('End');
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });
  });

  // Network: gear links are the app's affiliate redirect, so a 3xx is the pass (not 200).
  test('every guide/gear/gallery link resolves on the live app (200, or 3xx for /go)', async ({ page, request }) => {
    test.slow();
    await page.goto('/');
    const hrefs = await page
      .locator('.guide-list a, .recipes-card a, .guides-copy a, .gallery a, .gear-grid a, .gear-foot a')
      .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThanOrEqual(11);
    for (const href of hrefs) {
      if (/\/go\//.test(href)) {
        const res = await request.get(href, { maxRedirects: 0, timeout: 30_000 });
        expect(res.status(), href).toBeGreaterThanOrEqual(300);
        expect(res.status(), href).toBeLessThan(400);
        expect(res.headers()['location'], href).toMatch(/^https:\/\//);
      } else {
        const res = await request.get(href, { maxRedirects: 3, timeout: 30_000 });
        expect(res.status(), href).toBe(200);
      }
    }
  });
});
