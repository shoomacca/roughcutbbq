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
//   5. RC-13.3: the sample plan card and the featured-cook tiles are computed here from
//      calculateCook() (never hand-typed) and injected as {{SAMPLE_*}} keys and the
//      `<!-- @block featured -->` marker; photos come from the app's public/images via sharp.
//
// tests/site-tokens.test.ts and tests/site-home.test.ts import the functions below.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { calculateCook, formatCookTime } from '../lib/calculator.ts';
import { addHours } from '../lib/timeUtils.ts';
import { METHOD_INFO, cutToSlug, findCut } from '../lib/seo.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const PATHS = {
  appCss: join(ROOT, 'app', 'globals.css'),
  src: join(ROOT, 'site', 'src'),
  dist: join(ROOT, 'site', 'dist'),
  config: join(ROOT, 'site', 'site.config.json'),
  appImages: join(ROOT, 'public', 'images'),
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
    '/* END GENERATED: tokens + keyframes. Hand-written layer follows (site/src/site.css). */',
    handWritten.trimEnd(),
    '',
    '/* GENERATED: reduced-motion and print policy (app, verbatim). Do not edit. */',
    reduced.text,
    '',
    print.text,
    '',
  ].join('\n');
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
  return out;
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
      return `        <a class="reveal tile lift transition-ui" data-index="${i}" href="${esc(href)}">
          <img src="img/${esc(img.file)}" width="${img.width}" height="${img.height}" alt="${esc(c.cutName)}" loading="lazy" decoding="async">
          <span class="tile-body">
            <span class="tile-title">${esc(c.label)}</span>
            <span class="tile-meta"><strong>${esc(c.cookTime)}</strong> at ${c.pitTempC}&deg;C${c.pullTempC != null ? ` &middot; pull at ${c.pullTempC}&deg;C` : ''}</span>
            <span class="tile-note">${esc(c.weightNote)} in the smoker</span>
          </span>
        </a>`;
    })
    .join('\n');
}

/** Resize public/images/<name>.jpg -> <outDir>/img/<name>.webp and return its dimensions. */
export async function buildImages(names, outDir) {
  const imgDir = join(outDir, 'img');
  mkdirSync(imgDir, { recursive: true });
  const out = {};
  for (const name of new Set(names)) {
    const src = join(PATHS.appImages, `${name}.jpg`);
    if (!existsSync(src)) throw new Error(`Missing app image ${src}`);
    const file = `${name}.webp`;
    const info = await sharp(src)
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
  const config = { ...raw, YEAR: String(new Date().getFullYear()), ...sampleKeys(raw) };
  const cooks = featuredCooks(raw);

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
  const blocks = { featured: renderFeatured(cooks, config, images) };

  // 4. Pages
  const partialsDir = join(PATHS.src, 'partials');
  const partials = {};
  for (const f of readdirSync(partialsDir)) {
    if (f.endsWith('.html')) partials[f.replace(/\.html$/, '')] = readFileSync(join(partialsDir, f), 'utf8');
  }
  const pagesDir = join(PATHS.src, 'pages');
  for (const f of readdirSync(pagesDir)) {
    if (!f.endsWith('.html')) continue;
    const html = assemblePage(readFileSync(join(pagesDir, f), 'utf8'), partials, config, blocks);
    writeFileSync(join(outDir, f), html);
    written.push(f);
  }

  // 5. Everything else under src is copied as-is
  const skip = new Set([join(PATHS.src, 'site.css'), partialsDir, pagesDir]);
  for (const abs of walk(PATHS.src)) {
    if (skip.has(abs) || abs.startsWith(partialsDir + sep) || abs.startsWith(pagesDir + sep)) continue;
    const rel = relative(PATHS.src, abs);
    const dest = join(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(abs, dest);
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
