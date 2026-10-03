// RC-13.1 parity gate: the explainer site's CSS must carry the app's design tokens byte for byte.
//
// Three layers, so drift is caught wherever it happens:
//   1. Extractor correctness: a fresh in-memory build is compared against an INDEPENDENT
//      regex read of app/globals.css (not the extractor's own parser).
//   2. Stale or hand-edited output: if site/dist/site.css exists it must equal a fresh build.
//      Changing a token in app/globals.css without `npm run site:build`, or editing dist by
//      hand, fails here.
//   3. Hygiene: no framer-motion anywhere under site/, no raw hex in the hand-written CSS.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildSiteCss, parseCustomProps, PATHS } from '../scripts/build-site.mjs';

const ROOT = join(__dirname, '..');
const appCss = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');
const handWritten = readFileSync(join(ROOT, 'site', 'src', 'site.css'), 'utf8');
const siteCss = buildSiteCss(appCss, handWritten);

/** Independent read of the @theme vars: regex on the raw file, not the extractor. */
function themeVarsIndependent(css: string): Map<string, string> {
  const start = css.indexOf('@theme');
  const open = css.indexOf('{', start);
  // The @theme block in globals.css has no nested braces; the first `}` after it closes it.
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close).replace(/\/\*[\s\S]*?\*\//g, '');
  const m = new Map<string, string>();
  for (const line of body.split('\n')) {
    const d = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?);\s*$/);
    if (d) m.set(d[1], d[2].trim());
  }
  return m;
}

function rootVarsFromSite(css: string): Map<string, string> {
  const start = css.indexOf(':root');
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return parseCustomProps(css.slice(open, close + 1));
}

const TRACKED = /^--(color|motion|ease|font|radius|animate)-/;

describe('site.css carries the app tokens verbatim', () => {
  const appVars = themeVarsIndependent(appCss);
  const siteVars = rootVarsFromSite(siteCss);

  it('reads a sane number of tokens from the app', () => {
    expect(appVars.size).toBeGreaterThanOrEqual(20);
    const prefixes = new Set([...appVars.keys()].map((k) => k.match(TRACKED)?.[1]));
    expect(prefixes).toContain('color');
    expect(prefixes).toContain('motion');
    expect(prefixes).toContain('ease');
    expect(prefixes).toContain('font');
  });

  it('has the same set of custom properties (nothing missing, nothing extra)', () => {
    expect([...siteVars.keys()].sort()).toEqual([...appVars.keys()].sort());
  });

  it.each([...themeVarsIndependent(appCss).entries()].filter(([k]) => TRACKED.test(k)))(
    '%s is identical in the site CSS',
    (name, appValue) => {
      expect(siteVars.get(name)).toBe(appValue);
    },
  );

  it('every @keyframes block from the app appears byte-identical in the site CSS', () => {
    const names = [...appCss.matchAll(/^@keyframes\s+([\w-]+)/gm)].map((m) => m[1]);
    expect(names.length).toBeGreaterThanOrEqual(5);
    for (const name of names) {
      const re = new RegExp(`^@keyframes\\s+${name}\\s*\\{[\\s\\S]*?\\n\\}`, 'm');
      const fromApp = appCss.match(re)?.[0];
      const fromSite = siteCss.match(re)?.[0];
      expect(fromApp, `app keyframes ${name}`).toBeTruthy();
      expect(fromSite, `site keyframes ${name}`).toBe(fromApp);
    }
  });

  it('carries the reduced-motion and print blocks verbatim', () => {
    for (const prelude of ['@media (prefers-reduced-motion: reduce)', '@media print']) {
      const start = appCss.indexOf(prelude);
      expect(start, prelude).toBeGreaterThan(-1);
      // Grab the whole block from the app by brace balance and look for it verbatim in the site CSS.
      let depth = 0;
      let end = -1;
      for (let i = appCss.indexOf('{', start); i < appCss.length; i++) {
        if (appCss[i] === '{') depth++;
        else if (appCss[i] === '}' && --depth === 0) {
          end = i + 1;
          break;
        }
      }
      expect(siteCss.includes(appCss.slice(start, end)), `${prelude} verbatim`).toBe(true);
    }
  });
});

describe('site/dist/site.css is not stale or hand-edited', () => {
  const distCss = join(PATHS.dist, 'site.css');
  it.skipIf(!existsSync(distCss))('equals a fresh build from the current app/globals.css', () => {
    const dist = readFileSync(distCss, 'utf8');
    // Compare per token first so a drift names the token in the failure.
    const distVars = rootVarsFromSite(dist);
    for (const [k, v] of themeVarsIndependent(appCss)) {
      expect(distVars.get(k), `${k} (run npm run site:build)`).toBe(v);
    }
    expect(dist).toBe(siteCss);
  });
});

describe('site hygiene', () => {
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) out.push(...walk(p));
      else out.push(p);
    }
    return out;
  }

  it('no framer-motion under site/ (the site gets none)', () => {
    const hits = walk(join(ROOT, 'site')).filter((f) => /framer/i.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('hand-written site.css has no raw hex colours (tokens only)', () => {
    const noComments = handWritten.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(noComments.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
  });

  it('hand-written site.css has no literal durations (motion vars only)', () => {
    const noComments = handWritten.replace(/\/\*[\s\S]*?\*\//g, '');
    // Zero (`0s` visibility hand-off, `0ms` reveal-delay fallback) is copied from the app; any other
    // duration must be a var(--motion-*).
    const literals = (noComments.match(/\b\d+(\.\d+)?m?s\b/g) ?? []).filter((d) => !/^0m?s$/.test(d));
    expect(literals).toEqual([]);
  });
});
