// Static-site assembler for roughcut.com.au (RC-13.1; plan: .planning/HOME-AND-SITE-PLAN.md §4-5).
// (No shebang: run via `npm run site:build` = tsx; vitest inlines this file and would choke on `#!`.)
//
// Runs under `tsx` (devDependency) so it can import the app's REAL calculator engine
// (lib/calculator.ts) for the home page's sample plan and featured cooks; `sharp` (dependency)
// resizes the app's public/images into site/dist/img. No other dependencies, no framework.
//
//   npm run site:build   ->  site/dist/   (plain HTML/CSS/JS, uploaded by hand to Hostinger)
//
// What it does:
//   1. Reads app/globals.css and extracts VERBATIM: the @theme block (emitted as :root custom
//      properties), every @keyframes, the prefers-reduced-motion block and the print block.
//      The site never types a token value, so it cannot drift from the app.
//   2. Prepends those to the hand-written site/src/site.css  ->  site/dist/site.css
//   3. Inlines site/src/partials/<name>.html into pages where `<!-- @include name -->` appears,
//      substitutes {{KEY}} from site/site.config.json, and writes site/src/pages/*.html -> site/dist/
//   4. Copies every other file under site/src (reveal.js, .htaccess, og/ ...) to site/dist/
//      (.js files have comment lines and indentation stripped; HTML comments are removed from
//      pages; the hand-written CSS layer is minified. Plan §6 budgets: site.css <= 20 KB, reveal.js <= 2 KB.)
//   5. RC-13.3: the sample plan card and the featured-cook tiles are computed here from
//      calculateCook() (never hand-typed) and injected as {{SAMPLE_*}} keys and the
//      `<!-- @block featured -->` marker; photos come from the app's public/images via sharp.
//   6. RC-13.4: guides (titles/slugs read from app/guides/*/page.mdx), recipe count
//      (data/recipes.ts), gear picks (data/gear.ts, linked via the app's /go/<slug> so the
//      Amazon tag is applied centrally), FAQ (one array renders both the accordion and the
//      FAQPage JSON-LD), Organization + WebSite JSON-LD, sitemap.xml, robots.txt, 404.html,
//      and the Play section only when PLAY_URL is set.
//
// tests/site-tokens.test.ts, tests/site-home.test.ts and tests/site-seo.test.ts import the
// functions below.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { calculateCook, formatCookTime } from '../lib/calculator.ts';
import { addHours } from '../lib/timeUtils.ts';
import { METHOD_INFO, cutToSlug, findCut, allCategories } from '../lib/seo.ts';
import { GEAR } from '../data/gear.ts';
import { RECIPES } from '../data/recipes.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PATHS = {
  appCss: join(ROOT, 'app', 'globals.css'),
  src: join(ROOT, 'site', 'src'),
  dist: join(ROOT, 'site', 'dist'),
  config: join(ROOT, 'site', 'site.config.json'),
  appImages: join(ROOT, 'public', 'images'),
  appGuides: join(ROOT, 'app', 'guides'),
};

/** Home-page photos: resized to this width (webp) so the page stays fast. */
export const IMG_WIDTH = 640;

// ── CSS block extraction ──────────────────────────────────────────────────────

/** Index of the `{` that opens the block whose prelude starts at `start`, or -1. */
function openBraceAfter(css, start) {
  const i = css.indexOf('{', start);
  return i;
}

/** Index just past the `}` that closes the block opened at `open` (brace-balanced). */
function closeBraceFrom(css, open) {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error(`Unbalanced braces in CSS after index ${open}`);
}

/**
 * Every top-level block whose prelude matches `preludeRe` (anchored at a line start),
 * returned verbatim: `{ prelude, body, text }` where text = prelude + body incl. braces.
 */
export function extractBlocks(css, preludeRe) {
  const out = [];
  const re = new RegExp(`^${preludeRe.source}\\s*(?=\\{)`, 'gm');
  let m;
  while ((m = re.exec(css))) {
    const open = openBraceAfter(css, m.index + m[0].length - 1);
    const end = closeBraceFrom(css, open);
    out.push({ prelude: m[0].trimEnd(), body: css.slice(open, end), text: css.slice(m.index, end) });
    re.lastIndex = end;
  }
  return out;
}

export function extractTheme(css) {
  const blocks = extractBlocks(css, /@theme/);
  if (blocks.length !== 1) throw new Error(`Expected exactly one @theme block in app/globals.css, found ${blocks.length}`);
  return blocks[0];
}

export function extractKeyframes(css) {
  return extractBlocks(css, /@keyframes\s+[\w-]+/);
}

export function extractReducedMotion(css) {
  const blocks = extractBlocks(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  if (blocks.length !== 1) throw new Error(`Expected one prefers-reduced-motion block, found ${blocks.length}`);
  return blocks[0];
}

export function extractPrint(css) {
  const blocks = extractBlocks(css, /@media\s+print/);
  if (blocks.length !== 1) throw new Error(`Expected one @media print block, found ${blocks.length}`);
  return blocks[0];
}

/** `--name: value;` declarations inside a block body (comments stripped), as a Map. */
export function parseCustomProps(body) {
  const noComments = body.replace(/\/\*[\s\S]*?\*\//g, '');
  const map = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(noComments))) map.set(m[1], m[2].trim());
  return map;
}

/**
 * Minify the HAND-WRITTEN layer only (comments, newlines, indentation, space around
 * punctuation). The generated blocks (tokens, keyframes, reduced-motion, print) are left
 * verbatim so tests/site-tokens.test.ts can still find them byte for byte. Plan §6 budget:
 * site.css <= 20 KB. No string values with significant whitespace exist in site/src/site.css
 * (no `content:`, no url()), so whitespace collapse is safe; font-family lists keep one space
 * after each comma.
 */
export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:>,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/,(?=[A-Za-z'"])/g, ', ') // font-family lists: `'Abril Fatface', Georgia, serif`
    .trim();
}

/** The generated top of site.css: tokens as :root, keyframes, then the hand-written layer, then media blocks. */
export function buildSiteCss(appCss, handWritten) {
  const theme = extractTheme(appCss);
  const keyframes = extractKeyframes(appCss);
  const reduced = extractReducedMotion(appCss);
  const print = extractPrint(appCss);

  const root = ':root ' + theme.body; // `@theme {` -> `:root {`, body verbatim

  return [
    '/* GENERATED by scripts/build-site.mjs from app/globals.css. Do not edit. */',
    '/* ── Design tokens (app @theme, verbatim) ── */',
    root,
    '',
    '/* ── Keyframes (app, verbatim) ── */',
    ...keyframes.map((k) => k.text),
    '',
    '/* END GENERATED: tokens + keyframes. Hand-written layer follows (site/src/site.css, minified). */',
    minifyCss(handWritten),
    '',
    '/* GENERATED: reduced-motion and print policy (app, verbatim). Do not edit. */',
    reduced.text,
    '',
    print.text,
    '',
  ].join('\n');
}

/**
 * Strip comment-only lines, block comments and indentation from the site's plain JS
 * (reveal.js, nav.js, faq.js). Not a real minifier: statements are untouched, so no string or
 * regex literal can be damaged (none of the three files has `//` inside a string; checked).
 */
export function stripJs(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'))
    .join('\n') + '\n';
}

/**
 * Remove HTML comments from a built page. Build/dev notes (`<!-- 1. Hero (plan §3.3.1) ... -->`)
 * are for the template, not the wire. Conditional comments (`<!--[if ...]>`) are kept; JSON-LD
 * lives in a <script>, not a comment, so it is untouched. Lines left empty are dropped.
 */
export function stripHtmlComments(html) {
  return html.replace(/<!--(?!\[)[\s\S]*?-->/g, '').replace(/^[ \t]+\n/gm, '').replace(/\n{2,}/g, '\n');
}

// ── HTML assembly ─────────────────────────────────────────────────────────────

export function assemblePage(html, partials, config, blocks = {}) {
  let out = html.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Unknown partial "${name}"`);
    return partials[name].trimEnd();
  });
  out = out.replace(/<!--\s*@block\s+([\w-]+)\s*-->/g, (_, name) => {
    if (!(name in blocks)) throw new Error(`Unknown block "${name}"`);
    return blocks[name].trimEnd();
  });
  out = out.replace(/\{\{\s*([A-Z_]+)\s*\}\}/g, (_, key) => {
    if (!(key in config)) throw new Error(`Unknown config key {{${key}}}`);
    return String(config[key]);
  });
  return stripHtmlComments(out);
}

// ── Engine-driven content (RC-13.3) ───────────────────────────────────────────

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** "3:15 PM" (lib/timeUtils) -> "3:15 pm" for the site's plain Australian style. */
function clock(s) {
  return s.replace(/\b(AM|PM)\b/, (m) => m.toLowerCase());
}

/**
 * The sample plan card, computed by the app's calculateCook() for site.config.json's
 * sampleCut / sampleMethod / sampleKg. The "start" time is an example: eat at `sampleEatAt`,
 * so light the fire cookTime + rest earlier (same arithmetic as the results page, via addHours).
 */
export function samplePlan(config) {
  const entry = findCut(config.sampleCut);
  if (!entry) throw new Error(`sampleCut not found: ${config.sampleCut}`);
  const input = {
    method: config.sampleMethod,
    categoryId: entry.category.id,
    cutId: entry.cut.id,
    weightKg: Number(config.sampleKg),
  };
  const r = calculateCook(input);
  const totalHours = r.cookTimeHours + r.restMinutes / 60;
  const startAt = clock(addHours(config.sampleEatAt, -totalHours));
  const eatAt = clock(addHours(config.sampleEatAt, 0));
  return {
    input,
    result: r,
    cutName: r.cutName,
    methodLabel: METHOD_INFO[r.method].label,
    cookTime: formatCookTime(r.cookTimeHours),
    pitTempC: r.applianceTempC,
    pullTempC: r.internalTempC,
    restMinutes: r.restMinutes,
    isFlat: r.isFlat,
    weightKg: r.weightKg,
    startAt,
    eatAt,
    resultsPath: `/results?method=${r.method}&cat=${entry.category.id}&cut=${entry.cut.id}&kg=${r.weightKg}`,
    cookPath: `/cook/${METHOD_INFO[r.method].slug}/${cutToSlug(entry.cut.id)}`,
  };
}

/** {{SAMPLE_*}} keys for the page template. */
export function sampleKeys(config) {
  const s = samplePlan(config);
  return {
    SAMPLE_CUT: s.cutName,
    SAMPLE_METHOD: s.methodLabel,
    SAMPLE_KG: String(s.weightKg),
    SAMPLE_COOK_TIME: s.cookTime,
    SAMPLE_PIT_C: String(s.pitTempC),
    SAMPLE_PULL_C: String(s.pullTempC),
    SAMPLE_REST_MIN: String(s.restMinutes),
    SAMPLE_START_AT: s.startAt,
    SAMPLE_EAT_AT: s.eatAt,
    SAMPLE_WEIGHT_NOTE: s.isFlat ? 'any weight' : `${s.weightKg} kg`,
    SAMPLE_RESULTS_PATH: s.resultsPath,
    SAMPLE_COOK_PATH: s.cookPath,
  };
}

/**
 * Featured cooks: each tile's time comes from calculateCook() at the reference weight in
 * site.config.json, and links to the app's static /cook/<method>/<cut-slug> page.
 */
export function featuredCooks(config, method = 'smoker') {
  return config.featured.map((f) => {
    const entry = findCut(f.cutId);
    if (!entry) throw new Error(`featured cutId not found: ${f.cutId}`);
    if (!entry.cut.methods.includes(method)) throw new Error(`${f.cutId} has no ${method} method`);
    const r = calculateCook({ method, categoryId: entry.category.id, cutId: entry.cut.id, weightKg: Number(f.kg) });
    return {
      ...f,
      cutName: r.cutName,
      cookTime: formatCookTime(r.cookTimeHours),
      pitTempC: r.applianceTempC,
      pullTempC: r.internalTempC,
      isFlat: r.isFlat,
      weightNote: r.isFlat ? 'any weight' : `${f.kg} kg`,
      path: `/cook/${METHOD_INFO[method].slug}/${cutToSlug(entry.cut.id)}`,
    };
  });
}

/** The featured-cook tiles as HTML. `images` maps image name -> { file, width, height }. */
export function renderFeatured(cooks, config, images) {
  return cooks
    .map((c, i) => {
      const img = images[c.image];
      if (!img) throw new Error(`No image "${c.image}" for ${c.cutId}`);
      const href = `${config.APP_URL}${c.path}?utm_source=site&utm_medium=featured`;
      // alt describes the PHOTO (lamb has none; its tile shows coals), not the cut name.
      const alt = c.imageAlt || c.cutName;
      return `        <a class="reveal tile lift transition-ui" data-index="${i}" href="${esc(href)}">
          <img src="img/${esc(img.file)}" width="${img.width}" height="${img.height}" alt="${esc(alt)}" loading="lazy" decoding="async">
          <span class="tile-body">
            <span class="tile-title">${esc(c.label)}</span>
            <span class="tile-meta"><strong>${esc(c.cookTime)}</strong> at ${c.pitTempC}&deg;C${c.pullTempC != null ? ` &middot; pull at ${c.pullTempC}&deg;C` : ''}</span>
            <span class="tile-note">${esc(c.weightNote)} in the smoker</span>
          </span>
        </a>`;
    })
    .join('\n');
}

// ── RC-13.4: guides, recipes, gear, FAQ, JSON-LD, sitemap ─────────────────────

/**
 * The app's guides, read from app/guides/<slug>/page.mdx `export const metadata = {...}`
 * (the same title/description the app renders). Order = site.config.json `guides` if given,
 * else directory order. Nothing is typed here, so a renamed guide propagates.
 */
export function appGuides(config, guidesDir = PATHS.appGuides) {
  const slugs = readdirSync(guidesDir).filter((d) => existsSync(join(guidesDir, d, 'page.mdx')));
  const order = Array.isArray(config.guides) && config.guides.length ? config.guides : slugs;
  return order.map((slug) => {
    if (!slugs.includes(slug)) throw new Error(`guide not in app/guides: ${slug}`);
    const mdx = readFileSync(join(guidesDir, slug, 'page.mdx'), 'utf8');
    const title = mdx.match(/^\s*title:\s*(['"])(.*?)\1\s*,?\s*$/m)?.[2];
    const description = mdx.match(/^\s*description:\s*(['"])(.*?)\1\s*,?\s*$/m)?.[2];
    if (!title) throw new Error(`no metadata.title in app/guides/${slug}/page.mdx`);
    return { slug, title, description: description ?? '', path: `/guides/${slug}` };
  });
}

export function renderGuides(guides, config) {
  return guides
    .map((g, i) => {
      const href = `${config.APP_URL}${g.path}?utm_source=site&utm_medium=guides`;
      return `          <li class="reveal" data-index="${i}">
            <a class="guide-link lift transition-ui" href="${esc(href)}">
              <span class="guide-title">${esc(g.title)}</span>
              <span class="guide-desc">${esc(g.description)}</span>
            </a>
          </li>`;
    })
    .join('\n');
}

/** The number of recipes in data/recipes.ts, rounded down to a round figure for copy ("60+"). */
export function recipeCount() {
  return RECIPES.length;
}

/**
 * Gear picks: `gearPicks` slugs from site.config.json, resolved against data/gear.ts (name,
 * description, category). Links go through the app's /go/<slug> redirect so the Amazon
 * Associates tag is applied in ONE place (the app/DB), never typed here.
 */
export function gearPicks(config) {
  const slugs = config.gearPicks ?? [];
  if (slugs.length < 1 || slugs.length > 4) throw new Error('gearPicks must list 1-4 slugs');
  return slugs.map((slug) => {
    const g = GEAR.find((x) => x.slug === slug);
    if (!g) throw new Error(`gearPicks slug not in data/gear.ts: ${slug}`);
    return { slug: g.slug, name: g.name, category: g.category, description: g.description, path: `/go/${g.slug}` };
  });
}

/** Amazon Associates AU operating-agreement wording (RC-1.10) plus the per-link "(paid link)". */
export const DISCLOSURE = 'As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.';

export function renderGear(picks, config) {
  return picks
    .map((g, i) => {
      const href = `${config.APP_URL}${g.path}?utm_source=site&utm_medium=gear`;
      return `          <li class="reveal gear-item card lift transition-ui" data-index="${i}">
            <span class="gear-cat">${esc(g.category)}</span>
            <a class="gear-name" href="${esc(href)}" rel="sponsored noopener" target="_blank">${esc(g.name)} <small class="paid">(paid link)</small></a>
            <p class="gear-desc">${esc(g.description)}</p>
          </li>`;
    })
    .join('\n');
}

/**
 * FAQ: one array renders the accordion AND the FAQPage JSON-LD, so the two cannot disagree.
 * The cooker list is read from the engine's METHOD_INFO (lib/seo.ts), not typed.
 * "Can I plan backwards?" is deliberately absent until RC-3.5 ships it.
 */
export function faqItems() {
  const cookers = Object.values(METHOD_INFO).map((m) => m.label.toLowerCase());
  const cookerList = cookers.slice(0, -1).join(', ') + ' and ' + cookers[cookers.length - 1];
  const cutCount = allCategories().reduce((n, c) => n + c.cuts.length, 0);
  return [
    {
      q: 'Is it free?',
      a: 'Yes. No account is needed to plan a cook. An account only saves your cooks so you can find them again.',
    },
    {
      q: 'Is it metric?',
      a: 'Yes. Kilograms and degrees Celsius only. Made in Australia for Australian cooks.',
    },
    {
      q: 'How accurate is it?',
      a: 'It is a planning estimate built from published cook ranges for each cut and cooker. Always cook to internal temperature, not the clock; the plan gives you both, plus when to wrap and how long to rest.',
    },
    {
      q: 'Which cookers does it cover?',
      a: `${cookerList[0].toUpperCase()}${cookerList.slice(1)}. Pick the one you have and the plan adjusts the pit temperature and time.`,
    },
    {
      q: 'Which cuts?',
      a: `${cutCount} cuts across pork, beef, chicken, lamb, fish, vegetables, game and jerky, from a full packer brisket to a tray of prawns.`,
    },
  ];
}

export function renderFaq(items) {
  return items
    .map((f, i) => {
      const id = `faq-${i + 1}`;
      return `          <li class="reveal faq-item" data-index="${i}">
            <h3 class="faq-q">
              <button class="faq-toggle transition-ui" type="button" data-faq-toggle aria-expanded="false" aria-controls="${id}">
                <span>${esc(f.q)}</span>
                <svg class="faq-chev" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
            </h3>
            <div id="${id}" class="faq-a collapse-box"><div><p>${esc(f.a)}</p></div></div>
          </li>`;
    })
    .join('\n');
}

/** Organization + WebSite + FAQPage, one @graph (plan §6). sameAs carries the Play URL only when set. */
export function jsonLd(config, faq) {
  const site = config.SITE_URL.replace(/\/$/, '');
  const orgId = `${site}/#organization`;
  const org = {
    '@type': 'Organization',
    '@id': orgId,
    name: 'RoughCut BBQ',
    url: `${site}/`,
    logo: `${site}/og/home.png`,
  };
  if (config.PLAY_URL) org.sameAs = [config.PLAY_URL];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      org,
      {
        '@type': 'WebSite',
        '@id': `${site}/#website`,
        url: `${site}/`,
        name: 'RoughCut BBQ',
        inLanguage: 'en-AU',
        publisher: { '@id': orgId },
      },
      {
        '@type': 'FAQPage',
        '@id': `${site}/#faq`,
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

/** The Play section (plan §3.3.8), or nothing at all while PLAY_URL is empty. Never an APK link. */
export function renderPlay(config) {
  if (!config.PLAY_URL) return '';
  return `    <section id="app" class="play" aria-labelledby="play-heading">
      <div class="wrap play-grid">
        <div>
          <h2 id="play-heading">Take it to the pit.</h2>
          <p class="section-lede">RoughCut BBQ on Android. Same calculator, in your pocket.</p>
        </div>
        <a class="btn btn-lg lift transition-ui" href="${esc(config.PLAY_URL)}" rel="noopener">Get it on Google Play</a>
      </div>
    </section>`;
}

/** sitemap.xml: the home only (404 excluded; guides/rubs/wood are 301s to the app from RC-13.5). */
export function sitemapXml(config, pages, lastmod) {
  const site = config.SITE_URL.replace(/\/$/, '');
  const urls = pages
    .filter((p) => p !== '404.html')
    .map((p) => (p === 'index.html' ? `${site}/` : `${site}/${p}`))
    .map((loc) => `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(config) {
  const site = config.SITE_URL.replace(/\/$/, '');
  return `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`;
}

/**
 * Columns trimmed from each side of every source photo. pulled-pork, ribs and chicken carry a
 * 2-3px near-white edge (measured 2026-10-03: mean column brightness 250+ at x=0, 127-251 at
 * x=1-2) that showed as a white sliver in the tiles. The dark-edged photos lose nothing visible.
 */
export const IMG_EDGE_TRIM = 3;

/** Resize public/images/<name>.jpg -> <outDir>/img/<name>.webp (edges trimmed) and return its dimensions. */
export async function buildImages(names, outDir) {
  const imgDir = join(outDir, 'img');
  mkdirSync(imgDir, { recursive: true });
  const out = {};
  for (const name of new Set(names)) {
    const src = join(PATHS.appImages, `${name}.jpg`);
    if (!existsSync(src)) throw new Error(`Missing app image ${src}`);
    const file = `${name}.webp`;
    const meta = await sharp(src).metadata();
    const info = await sharp(src)
      .extract({ left: IMG_EDGE_TRIM, top: 0, width: meta.width - 2 * IMG_EDGE_TRIM, height: meta.height })
      .resize({ width: IMG_WIDTH, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(join(imgDir, file));
    out[name] = { file, width: info.width, height: info.height };
  }
  return out;
}

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

// ── Build ─────────────────────────────────────────────────────────────────────

export async function build({ outDir = PATHS.dist } = {}) {
  const appCss = readFileSync(PATHS.appCss, 'utf8');
  const handWritten = readFileSync(join(PATHS.src, 'site.css'), 'utf8');
  // {{YEAR}} (footer copyright) is computed at build time, like the app's `new Date().getFullYear()`.
  const raw = JSON.parse(readFileSync(PATHS.config, 'utf8'));
  const now = new Date();
  const config = { ...raw, YEAR: String(now.getFullYear()), ...sampleKeys(raw) };
  const cooks = featuredCooks(raw);

  // RC-13.4 content, all derived from the app's own data (nothing typed in the template).
  const guides = appGuides(raw);
  const picks = gearPicks(raw);
  const faq = faqItems();
  config.RECIPE_COUNT = String(recipeCount());
  config.GUIDE_COUNT = String(guides.length);
  config.DISCLOSURE = DISCLOSURE;
  config.JSON_LD = JSON.stringify(jsonLd(config, faq), null, 2).replace(/</g, '\\u003c');

  // og/home.png is a hand-made asset (1200x630, plan §6); the build refuses to ship without it.
  const ogSrc = join(PATHS.src, 'og', 'home.png');
  if (!existsSync(ogSrc)) throw new Error(`Missing ${ogSrc} (run node scripts/site-og.mjs)`);
  const og = await sharp(ogSrc).metadata();
  if (og.width !== 1200 || og.height !== 630) throw new Error(`og/home.png must be 1200x630, got ${og.width}x${og.height}`);
  config.OG_IMAGE = `${config.SITE_URL}/og/home.png`;
  config.OG_W = String(og.width);
  config.OG_H = String(og.height);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const written = [];

  // 1-2. CSS
  const siteCss = buildSiteCss(appCss, handWritten);
  writeFileSync(join(outDir, 'site.css'), siteCss);
  written.push('site.css');

  // 3. Images (hero photo + featured tiles), from the app's public/images
  const images = await buildImages(['brisket', ...cooks.map((c) => c.image)], outDir);
  for (const i of Object.values(images)) written.push(`img/${i.file}`);
  const hero = images.brisket;
  config.HERO_IMG = `img/${hero.file}`;
  config.HERO_W = String(hero.width);
  config.HERO_H = String(hero.height);
  const blocks = {
    featured: renderFeatured(cooks, config, images),
    guides: renderGuides(guides, config),
    gear: renderGear(picks, config),
    faq: renderFaq(faq),
    play: renderPlay(config),
  };

  // 4. Pages
  const partialsDir = join(PATHS.src, 'partials');
  const partials = {};
  for (const f of readdirSync(partialsDir)) {
    if (f.endsWith('.html')) partials[f.replace(/\.html$/, '')] = readFileSync(join(partialsDir, f), 'utf8');
  }
  const pagesDir = join(PATHS.src, 'pages');
  const pages = [];
  for (const f of readdirSync(pagesDir)) {
    if (!f.endsWith('.html')) continue;
    const html = assemblePage(readFileSync(join(pagesDir, f), 'utf8'), partials, config, blocks);
    writeFileSync(join(outDir, f), html);
    written.push(f);
    pages.push(f);
  }

  // 4b. sitemap.xml + robots.txt (RC-13.4)
  writeFileSync(join(outDir, 'sitemap.xml'), sitemapXml(config, pages, now.toISOString().slice(0, 10)));
  written.push('sitemap.xml');
  writeFileSync(join(outDir, 'robots.txt'), robotsTxt(config));
  written.push('robots.txt');

  // 5. Everything else under src is copied as-is
  const skip = new Set([join(PATHS.src, 'site.css'), partialsDir, pagesDir]);
  for (const abs of walk(PATHS.src)) {
    if (skip.has(abs) || abs.startsWith(partialsDir + sep) || abs.startsWith(pagesDir + sep)) continue;
    const rel = relative(PATHS.src, abs);
    const dest = join(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    if (abs.endsWith('.js')) writeFileSync(dest, stripJs(readFileSync(abs, 'utf8')));
    else copyFileSync(abs, dest);
    written.push(rel.split(sep).join('/'));
  }

  return { outDir, written, siteCss };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { outDir, written } = await build();
  if (!existsSync(join(outDir, 'index.html'))) throw new Error('index.html was not produced');
  console.log(`site:build -> ${relative(ROOT, outDir)}/  (${written.length} files)`);
  for (const f of written) console.log('  ' + f);
}
