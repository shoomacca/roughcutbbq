// RC-13.3 acceptance: the home page's sample-plan card and featured-cook tiles carry the REAL
// engine's numbers (lib/calculator.ts calculateCook) for the inputs in site/site.config.json.
//
//   1. samplePlan()/featuredCooks() (what the build injects) equal calculateCook() called here,
//      independently, on the same inputs. Nothing in the card may be hand-typed.
//   2. If site/dist/index.html exists, the rendered HTML contains exactly those values (a stale
//      dist after a meats.json or config change fails here: run `npm run site:build`).
//   3. Every featured target exists in the app's own route table (allCookPages) and sitemap data.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { calculateCook, formatCookTime } from '../lib/calculator';
import { addHours } from '../lib/timeUtils';
import { allCookPages, findCut, METHOD_INFO, cutToSlug } from '../lib/seo';
import type { CookingMethod } from '../types/calculator';
import { samplePlan, sampleKeys, featuredCooks, PATHS } from '../scripts/build-site.mjs';

const ROOT = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(ROOT, 'site', 'site.config.json'), 'utf8'));

function engineFor(cutId: string, method: CookingMethod, weightKg: number) {
  const entry = findCut(cutId);
  if (!entry) throw new Error(`no cut ${cutId}`);
  return calculateCook({ method, categoryId: entry.category.id, cutId, weightKg });
}

describe('sample plan card = calculateCook(sampleCut)', () => {
  const expected = engineFor(config.sampleCut, config.sampleMethod, Number(config.sampleKg));
  const s = samplePlan(config);
  const keys = sampleKeys(config);

  it('is the configured cut (spatchcock chicken until RC-3.4, per the owner decision)', () => {
    expect(config.sampleCut).toBe('spatchcock_chicken');
    expect(s.cutName).toBe(expected.cutName);
  });

  it('cook time, pit temp, pull temp and rest equal the engine output', () => {
    expect(s.cookTime).toBe(formatCookTime(expected.cookTimeHours));
    expect(s.pitTempC).toBe(expected.applianceTempC);
    expect(s.pullTempC).toBe(expected.internalTempC);
    expect(s.restMinutes).toBe(expected.restMinutes);
    expect(s.isFlat).toBe(expected.isFlat);
    expect(keys.SAMPLE_COOK_TIME).toBe(formatCookTime(expected.cookTimeHours));
    expect(keys.SAMPLE_PIT_C).toBe(String(expected.applianceTempC));
    expect(keys.SAMPLE_PULL_C).toBe(String(expected.internalTempC));
    expect(keys.SAMPLE_REST_MIN).toBe(String(expected.restMinutes));
  });

  it('the example start time is eat-at minus (cook time + rest), via the app\'s addHours', () => {
    const total = expected.cookTimeHours + expected.restMinutes / 60;
    expect(s.startAt).toBe(addHours(config.sampleEatAt, -total).replace(/\b(AM|PM)\b/, (m) => m.toLowerCase()));
    expect(s.eatAt).toBe(addHours(config.sampleEatAt, 0).replace(/\b(AM|PM)\b/, (m) => m.toLowerCase()));
  });

  it('links to the app results page with the same input', () => {
    const entry = findCut(config.sampleCut)!;
    expect(keys.SAMPLE_RESULTS_PATH).toBe(
      `/results?method=${config.sampleMethod}&cat=${entry.category.id}&cut=${config.sampleCut}&kg=${Number(config.sampleKg)}`,
    );
  });
});

describe('featured cooks = calculateCook(cut, smoker, reference kg)', () => {
  const cooks = featuredCooks(config);

  it('has 3 to 6 tiles', () => {
    expect(cooks.length).toBeGreaterThanOrEqual(3);
    expect(cooks.length).toBeLessThanOrEqual(6);
  });

  const featuredCases: [string, number][] = config.featured.map((f: { cutId: string; kg: number }) => [f.cutId, f.kg]);
  it.each(featuredCases)(
    '%s at %s kg carries the engine time and temps',
    (cutId, kg) => {
      const e = engineFor(cutId, 'smoker', Number(kg));
      const c = cooks.find((x: { cutId: string }) => x.cutId === cutId)!;
      expect(c.cookTime).toBe(formatCookTime(e.cookTimeHours));
      expect(c.pitTempC).toBe(e.applianceTempC);
      expect(c.pullTempC).toBe(e.internalTempC);
      expect(c.isFlat).toBe(e.isFlat);
    },
  );

  it('every tile links to a real app cook route (generateStaticParams / sitemap source)', () => {
    const routes = new Set(allCookPages().map((p) => `/cook/${p.method}/${p.cut}`));
    for (const c of cooks) {
      expect(c.path).toBe(`/cook/${METHOD_INFO.smoker.slug}/${cutToSlug(c.cutId)}`);
      expect(routes.has(c.path), c.path).toBe(true);
    }
  });

  it('every tile photo exists in the app public/images', () => {
    for (const c of cooks) expect(existsSync(join(PATHS.appImages, `${c.image}.jpg`)), c.image).toBe(true);
  });
});

describe('site/dist/index.html carries those numbers (not stale)', () => {
  const dist = join(PATHS.dist, 'index.html');
  it.skipIf(!existsSync(dist))('sample card and tiles match a fresh engine run', () => {
    const html = readFileSync(dist, 'utf8');
    const k = sampleKeys(config);
    expect(html).toContain(`data-stat="cook-time">~${k.SAMPLE_COOK_TIME}<`);
    expect(html).toContain(`data-stat="pit-temp">${k.SAMPLE_PIT_C}&deg;C<`);
    expect(html).toContain(`data-stat="pull-temp">${k.SAMPLE_PULL_C}&deg;C<`);
    expect(html).toContain(`data-stat="rest">${k.SAMPLE_REST_MIN} min<`);
    expect(html).toContain(`<strong>${k.SAMPLE_START_AT}</strong> to eat at <strong>${k.SAMPLE_EAT_AT}</strong>`);
    for (const c of featuredCooks(config)) {
      expect(html).toContain(`href="${config.APP_URL}${c.path}?utm_source=site&amp;utm_medium=featured"`);
      expect(html).toContain(`<strong>${c.cookTime}</strong> at ${c.pitTempC}&deg;C`);
    }
    // Images carry intrinsic dimensions (no layout shift) and alt text.
    const imgs = html.match(/<img [^>]+>/g) ?? [];
    expect(imgs.length).toBeGreaterThanOrEqual(7); // hero + 6 tiles
    for (const tag of imgs) {
      expect(tag, tag).toMatch(/ width="\d+"/);
      expect(tag, tag).toMatch(/ height="\d+"/);
      expect(tag, tag).toMatch(/ alt="[^"]+"/);
    }
    // No JS beyond reveal.js and nav.js.
    expect(html.match(/<script[^>]*>/g)).toEqual(['<script src="reveal.js">', '<script src="nav.js" defer>']);
  });
});
