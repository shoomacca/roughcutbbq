// RC-13.4 acceptance (plan §3.3.5-9, §6): guides/recipes/gear/FAQ are derived from the app's
// data, the FAQPage JSON-LD equals the rendered accordion, the Play section and any `.apk`
// string are absent while PLAY_URL is empty, the gear links go through the app's /go/<slug>
// redirect with rel="sponsored", the disclosure sentence is in the gear section, og:image is a
// real 1200x630 PNG, the title is <= 60 chars with the brand once, and sitemap/robots/404 exist.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { GEAR } from '../data/gear';
import { RECIPES } from '../data/recipes';
import { METHOD_INFO } from '../lib/seo';
import {
  appGuides,
  gearPicks,
  faqItems,
  jsonLd,
  renderPlay,
  sitemapXml,
  robotsTxt,
  DISCLOSURE,
  PATHS,
} from '../scripts/build-site.mjs';

const ROOT = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(ROOT, 'site', 'site.config.json'), 'utf8'));
const dist = join(PATHS.dist, 'index.html');
const html = existsSync(dist) ? readFileSync(dist, 'utf8') : '';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

describe('guides and recipes come from the app', () => {
  it('every guide slug is a real app/guides/<slug>/page.mdx with its own title', () => {
    const guides = appGuides(config);
    expect(guides.length).toBe(5);
    for (const g of guides) {
      const mdx = readFileSync(join(PATHS.appGuides, g.slug, 'page.mdx'), 'utf8');
      expect(mdx).toContain(`title: '${g.title}'`);
      expect(g.path).toBe(`/guides/${g.slug}`);
    }
  });

  it('throws on a slug the app does not have', () => {
    expect(() => appGuides({ guides: ['not-a-guide'] })).toThrow(/not in app\/guides/);
  });

  it('the recipe count is data/recipes.ts', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(50);
    if (html) expect(html).toContain(`${RECIPES.length} cooks, from Texas pulled pork to hot-smoked salmon`);
    // The two named recipes exist in data/recipes.ts (the earlier "smoked cauliflower" did not).
    expect(RECIPES.some((r) => /Texas Pulled Pork/i.test(r.name))).toBe(true);
    expect(RECIPES.some((r) => /Hot-Smoked Salmon/i.test(r.name))).toBe(true);
  });
});

describe('gear picks go through the app /go redirect with disclosure', () => {
  const picks = gearPicks(config);

  it('3 picks, each a real data/gear.ts slug, a thermometer first', () => {
    expect(picks.length).toBe(3);
    for (const p of picks) {
      const g = GEAR.find((x) => x.slug === p.slug)!;
      expect(g, p.slug).toBeTruthy();
      expect(p.name).toBe(g.name);
      expect(p.path).toBe(`/go/${g.slug}`);
    }
    expect(picks[0].category).toBe('Thermometers');
  });

  it('rejects an unknown slug', () => {
    expect(() => gearPicks({ gearPicks: ['nope'] })).toThrow(/not in data\/gear/);
  });

  it.skipIf(!html)('rendered: /go links with rel="sponsored noopener", "(paid link)", no raw Amazon URL, disclosure in the section', () => {
    for (const p of picks) {
      const re = new RegExp(`<a class="gear-name" href="${config.APP_URL}${p.path}\\?utm_source=site&amp;utm_medium=gear" rel="sponsored noopener" target="_blank">[^<]+ <small class="paid">\\(paid link\\)</small></a>`);
      expect(html, p.slug).toMatch(re);
    }
    expect(html).not.toMatch(/amazon\.com/i);
    expect(html).not.toMatch(/tag=/);
    const gear = html.slice(html.indexOf('<section id="gear"'), html.indexOf('</section>', html.indexOf('<section id="gear"')));
    expect(gear).toContain(`<p class="disclosure" data-testid="gear-disclosure">${DISCLOSURE}</p>`);
    expect(DISCLOSURE).toBe('As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.');
  });
});

describe('FAQ: one array renders the accordion and the FAQPage JSON-LD', () => {
  const faq = faqItems();

  it('has 4-6 questions, the cooker list from METHOD_INFO, and no "plan backwards" until RC-3.5', () => {
    expect(faq.length).toBeGreaterThanOrEqual(4);
    expect(faq.length).toBeLessThanOrEqual(6);
    const cookers = faq.find((f) => /cookers/i.test(f.q))!.a.toLowerCase();
    for (const m of Object.values(METHOD_INFO)) expect(cookers).toContain(m.label.toLowerCase());
    expect(faq.some((f) => /backwards/i.test(f.q))).toBe(false);
  });

  it('JSON-LD is Organization + WebSite + FAQPage with the same questions and answers', () => {
    const ld = jsonLd(config, faq);
    expect(ld['@context']).toBe('https://schema.org');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const graph = ld['@graph'] as any[];
    const types = graph.map((n) => n['@type']);
    expect(types).toEqual(['Organization', 'WebSite', 'FAQPage']);
    const org = graph[0];
    expect(org.url).toBe(`${config.SITE_URL}/`);
    expect(org.sameAs).toBeUndefined(); // PLAY_URL empty
    expect(graph[1].publisher['@id']).toBe(org['@id']);
    const q = graph[2].mainEntity;
    expect(q.map((x: { name: string }) => x.name)).toEqual(faq.map((f) => f.q));
    expect(q.map((x: { acceptedAnswer: { text: string } }) => x.acceptedAnswer.text)).toEqual(faq.map((f) => f.a));
  });

  it.skipIf(!html)('rendered: the <head> JSON-LD parses and equals a fresh jsonLd(); every question is a button with aria-controls', () => {
    const m = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
    expect(m).toBeTruthy();
    const parsed = JSON.parse(m![1]);
    expect(parsed).toEqual(jsonLd(config, faq));
    for (let i = 0; i < faq.length; i++) {
      expect(html).toContain(`aria-controls="faq-${i + 1}"`);
      expect(html).toContain(`id="faq-${i + 1}" class="faq-a collapse-box"`);
    }
  });
});

describe('Play flag, APK, metadata', () => {
  it('PLAY_URL empty -> no Play section; set -> a Play link and Organization.sameAs', () => {
    expect(config.PLAY_URL).toBe('');
    expect(renderPlay(config)).toBe('');
    const withPlay = { ...config, PLAY_URL: 'https://play.google.com/store/apps/details?id=au.com.roughcut' };
    expect(renderPlay(withPlay)).toContain('Get it on Google Play');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((jsonLd(withPlay, faqItems())['@graph'] as any[])[0].sameAs).toEqual([withPlay.PLAY_URL]);
  });

  it.skipIf(!html)('rendered: "Google Play" and ".apk" appear nowhere in site/dist', () => {
    for (const f of walk(PATHS.dist)) {
      if (!/\.(html|css|js|txt|xml)$/.test(f)) continue;
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/Google Play/);
      expect(text, f).not.toMatch(/\.apk/i);
    }
  });

  it.skipIf(!html)('rendered: title <= 60 chars with the brand once, description without "no ads", canonical, OG + twitter', () => {
    const title = html.match(/<title>(.*?)<\/title>/)![1];
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title.match(/RoughCut/g)).toHaveLength(1);
    expect(html).not.toMatch(/no ads/i);
    expect(html).toContain(`<link rel="canonical" href="${config.SITE_URL}/">`);
    expect(html).toContain(`<meta property="og:image" content="${config.SITE_URL}/og/home.png">`);
    expect(html).toContain('<meta property="og:image:width" content="1200">');
    expect(html).toContain('<meta property="og:image:height" content="630">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
  });

  it('og/home.png is a real 1200x630 PNG under 300 KB, and the build copies it', async () => {
    const src = join(PATHS.src, 'og', 'home.png');
    expect(existsSync(src)).toBe(true);
    const meta = await sharp(src).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([1200, 630, 'png']);
    expect(statSync(src).size).toBeLessThan(300 * 1024);
    if (html) expect(existsSync(join(PATHS.dist, 'og', 'home.png'))).toBe(true);
  });
});

describe('sitemap, robots, 404', () => {
  it('sitemap lists the home only (404 excluded) and robots points at it', () => {
    const xml = sitemapXml(config, ['index.html', '404.html'], '2026-10-03');
    expect(xml.match(/<loc>/g)).toHaveLength(1);
    expect(xml).toContain(`<loc>${config.SITE_URL}/</loc>`);
    expect(xml).not.toContain('404');
    expect(robotsTxt(config)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${config.SITE_URL}/sitemap.xml\n`);
  });

  it.skipIf(!html)('rendered: sitemap.xml, robots.txt, 404.html (noindex) are in dist', () => {
    expect(existsSync(join(PATHS.dist, 'sitemap.xml'))).toBe(true);
    expect(existsSync(join(PATHS.dist, 'robots.txt'))).toBe(true);
    const nf = readFileSync(join(PATHS.dist, '404.html'), 'utf8');
    expect(nf).toContain('<meta name="robots" content="noindex">');
    expect(nf).toContain('<h1>');
    expect(nf).toContain('href="/site.css"');
  });
});
