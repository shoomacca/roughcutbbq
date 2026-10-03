// RC-13.5 acceptance (plan §3.2): the generated site/dist/.htaccess retires every URL of the old
// static site. The old site is the 25-file backup fetched 2026-10-03 (md5-identical to live);
// its file list is pinned here (OLD_SITE) so the test does not depend on the backup folder.
//
// This is an OFFLINE test: a small mod_rewrite interpreter runs the real .htaccess text against
// every old URL variant (with/without .html, trailing slash, http, www) and asserts the outcome.
// The same file was also run through a real Apache 2.4 (docker httpd:2.4-alpine, AllowOverride
// All) on 2026-10-03 with identical results. The live-200 check of every target is network and
// lives in scripts/check-site-links.mjs (`node scripts/check-site-links.mjs`).
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { htaccess, redirectTable, retiredImageMap, RETIRED_APP_PAGES, PATHS } from '../scripts/build-site.mjs';

const ROOT = join(__dirname, '..');
const config = JSON.parse(readFileSync(join(ROOT, 'site', 'site.config.json'), 'utf8'));
const SITE = config.SITE_URL.replace(/\/$/, '') as string;
const APP = config.APP_URL.replace(/\/$/, '') as string;
const HOST = new URL(SITE).host;

/** Every file the old site served (backup roughcut.com.au-live-2026-10-03, 25 files). */
export const OLD_SITE = [
  'index.html',
  'guides.html',
  'guides/how-long-to-smoke-ribs.html',
  'guides/how-to-smoke-a-brisket.html',
  'guides/how-to-use-a-meat-thermometer.html',
  'guides/pork-shoulder-the-stall-explained.html',
  'guides/spatchcock-chicken-on-the-smoker.html',
  'rubs.html',
  'wood-chart.html',
  'style.css',
  'images/asparagus.jpg',
  'images/brisket.jpg',
  'images/chicken.jpg',
  'images/coals.jpg',
  'images/corn.jpg',
  'images/fish.jpg',
  'images/grid.jpg',
  'images/mushrooms.jpg',
  'images/peppers.jpg',
  'images/pulled-pork.jpg',
  'images/ribs.jpg',
  'images/rough_cut_bbq_forum.png',
  'images/rough_cut_bbq_hero.png',
  'images/rumptip.jpg',
  'images/sausage.jpg',
];

// Images the current build ships (mirrors build(): hero brisket + featured tiles).
const builtImages = Object.fromEntries(
  ['brisket', ...config.featured.map((f: { image: string }) => f.image)].map((n) => [n, { file: `${n}.webp`, width: 1, height: 1 }]),
);
const distHtaccess = join(PATHS.dist, '.htaccess');
const text = existsSync(distHtaccess) ? readFileSync(distHtaccess, 'utf8') : htaccess(config, builtImages);

// ── A minimal mod_rewrite interpreter (per-directory context, RewriteBase /) ─────────────────

type Cond = { test: string; pattern: string; flags: string[] };
type Rule = { conds: Cond[]; pattern: string; target: string; flags: string[] };

function parseRewrite(src: string): Rule[] {
  const rules: Rule[] = [];
  let conds: Cond[] = [];
  const flagsOf = (s: string | undefined) => (s ? s.replace(/^\[|\]$/g, '').split(',').map((f) => f.trim()) : []);
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^RewriteCond\s+(\S+)\s+(\S+)(?:\s+(\[.*\]))?$/))) {
      conds.push({ test: m[1], pattern: m[2], flags: flagsOf(m[3]) });
    } else if ((m = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+(\[.*\]))?$/))) {
      rules.push({ conds, pattern: m[1], target: m[2], flags: flagsOf(m[3]) });
      conds = [];
    }
  }
  return rules;
}

type Req = { scheme: 'http' | 'https'; host: string; path: string };
type Out = { status: number; location?: string };

function condTrue(c: Cond, req: Req): boolean {
  const vars: Record<string, string> = {
    '%{HTTPS}': req.scheme === 'https' ? 'on' : 'off',
    '%{HTTP_HOST}': req.host,
    '%{THE_REQUEST}': `GET ${req.path} HTTP/1.1`,
  };
  const value = vars[c.test];
  if (value === undefined) throw new Error(`unsupported RewriteCond variable ${c.test}`);
  let p = c.pattern;
  let negate = false;
  if (p.startsWith('!')) {
    negate = true;
    p = p.slice(1);
  }
  let result: boolean;
  if (p.startsWith('=')) result = value === p.slice(1);
  else result = new RegExp(p, c.flags.includes('NC') ? 'i' : '').test(value);
  return negate ? !result : result;
}

function condsTrue(conds: Cond[], req: Req): boolean {
  // [OR] joins a cond with the next one; otherwise AND.
  let i = 0;
  while (i < conds.length) {
    let group = condTrue(conds[i], req);
    while (conds[i].flags.includes('OR') && i + 1 < conds.length) {
      i++;
      group = group || condTrue(conds[i], req);
    }
    if (!group) return false;
    i++;
  }
  return true;
}

function fileExists(distRel: string): boolean {
  const p = join(PATHS.dist, distRel);
  return existsSync(p) && statSync(p).isFile();
}

/** One pass of the .htaccess for a request; mimics DirectoryIndex, ErrorDocument and 403 for .ht*. */
function serve(rules: Rule[], req: Req): Out {
  let rel = req.path.replace(/^\//, '').split('?')[0];
  if (/^\.ht/.test(rel)) return { status: 403 };
  for (const r of rules) {
    const re = new RegExp(r.pattern, r.flags.includes('NC') ? 'i' : '');
    const m = rel.match(re);
    if (!m) continue;
    if (!condsTrue(r.conds, req)) continue;
    if (r.target === '-') {
      if (r.flags.includes('L')) break;
      continue;
    }
    const target = r.target.replace(/\$(\d)/g, (_, d) => m[Number(d)] ?? '');
    const R = r.flags.find((f) => f.startsWith('R'));
    if (R) return { status: Number(R.split('=')[1] ?? 302), location: target };
    rel = target.replace(/^\//, '');
    if (r.flags.includes('L')) break;
  }
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  return fileExists(rel) ? { status: 200 } : { status: 404 };
}

/** Follow redirects that stay on this host; stop at the app or after `max` hops. */
function follow(rules: Rule[], req: Req, max = 4) {
  const hops: string[] = [];
  let cur = req;
  for (let i = 0; i <= max; i++) {
    const out = serve(rules, cur);
    if (!out.location) return { final: `${cur.scheme}://${cur.host}${cur.path}`, status: out.status, hops };
    hops.push(out.location);
    const u = new URL(out.location);
    if (u.host !== HOST && u.host !== `www.${HOST}`) return { final: out.location, status: out.status, hops, external: true };
    cur = { scheme: u.protocol.replace(':', '') as Req['scheme'], host: u.host, path: u.pathname };
  }
  throw new Error(`redirect loop for ${req.scheme}://${req.host}${req.path}: ${hops.join(' -> ')}`);
}

const rules = parseRewrite(text);

/** URL variants a visitor, a bookmark or a search index could still hold for an old file. */
function variants(file: string): string[] {
  if (file === 'index.html') return ['/index.html'];
  const out = [`/${file}`];
  if (file.endsWith('.html')) out.push(`/${file.slice(0, -5)}`, `/${file.slice(0, -5)}/`);
  return out;
}

/** Where each old file must end up. */
function expectedFor(file: string): { kind: 'app'; url: string } | { kind: 'site'; url: string } | { kind: 'gone' } {
  if (file === 'index.html') return { kind: 'site', url: `${SITE}/` };
  if (file === 'style.css') return { kind: 'site', url: `${SITE}/site.css` };
  const page = file.replace(/\.html$/, '');
  if (page in RETIRED_APP_PAGES) return { kind: 'app', url: `${APP}${RETIRED_APP_PAGES[page as keyof typeof RETIRED_APP_PAGES]}` };
  const img = (retiredImageMap(builtImages) as Record<string, string>)[file];
  if (img) return { kind: 'site', url: `${SITE}${img}` };
  return { kind: 'gone' };
}

describe('.htaccess structure', () => {
  it('is generated into site/dist (run npm run site:build) and has the fixed directives', () => {
    expect(existsSync(distHtaccess), 'site/dist/.htaccess missing: run npm run site:build').toBe(true);
    expect(text).toContain('ErrorDocument 404 /404.html');
    expect(text).toContain('AddType image/webp .webp');
    expect(text).toContain('RewriteEngine On');
    expect(text).toMatch(/RewriteRule \^\\\.well-known\/ - \[L\]/);
    expect(text).toContain('RewriteCond %{HTTPS} !=on [OR]');
    expect(text).toContain(`RewriteCond %{HTTP_HOST} !^${HOST.replace(/\./g, '\\.')}$ [NC]`);
    expect(text).toContain(`RewriteRule ^(.*)$ ${SITE}/$1 [R=301,L]`);
    expect(text).toMatch(/ExpiresByType image\/webp "access plus 1 year"/);
    expect(text).toMatch(/Cache-Control "no-cache"/);
    // One rule per retired page and per ported image, all 301, all absolute https.
    const table = redirectTable(config, builtImages);
    expect(table).toHaveLength(1 + Object.keys(RETIRED_APP_PAGES).length + 1 + Object.keys(builtImages).length);
    for (const [, to, code] of table) {
      expect(code).toBe(301);
      expect(to).toMatch(/^https:\/\//);
    }
    expect((text.match(/\[R=301,L\]/g) ?? []).length).toBe(table.length + 1); // + canonical rule
  });

  it('canonical host matches sitemap.xml and the home canonical (apex, https)', () => {
    expect(HOST.startsWith('www.')).toBe(false);
    const sitemap = readFileSync(join(PATHS.dist, 'sitemap.xml'), 'utf8');
    expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
    const home = readFileSync(join(PATHS.dist, 'index.html'), 'utf8');
    expect(home).toContain(`rel="canonical" href="${SITE}/"`);
  });

  it('every retired app page exists in the app route tree', () => {
    for (const to of Object.values(RETIRED_APP_PAGES)) {
      const dir = join(ROOT, 'app', ...to.split('/').filter(Boolean));
      const hasPage = ['page.tsx', 'page.mdx'].some((f) => existsSync(join(dir, f)));
      expect(hasPage, `app route ${to} has no page`).toBe(true);
    }
  });
});

describe('every old URL has a rule (simulated mod_rewrite over the 25-file backup list)', () => {
  for (const file of OLD_SITE) {
    const exp = expectedFor(file);
    for (const path of variants(file)) {
      it(`https ${HOST}${path} -> ${exp.kind === 'gone' ? '404' : `301 ${exp.url}`}`, () => {
        const out = serve(rules, { scheme: 'https', host: HOST, path });
        if (exp.kind === 'gone') {
          expect(out.status).toBe(404);
        } else {
          expect(out.status).toBe(301);
          expect(out.location).toBe(exp.url);
          // Single hop: a site target must be a real file in dist (or /), never another redirect.
          if (exp.kind === 'site') {
            const rel = new URL(exp.url).pathname.replace(/^\//, '') || 'index.html';
            expect(fileExists(rel), `${exp.url} is not a file in site/dist`).toBe(true);
            expect(serve(rules, { scheme: 'https', host: HOST, path: new URL(exp.url).pathname }).status).toBe(200);
          }
        }
      });

      for (const start of [
        { scheme: 'http', host: HOST },
        { scheme: 'http', host: `www.${HOST}` },
        { scheme: 'https', host: `www.${HOST}` },
      ] as const) {
        it(`${start.scheme} ${start.host}${path} reaches the same place with no chain for mapped URLs`, () => {
          const r = follow(rules, { ...start, path });
          if (exp.kind === 'gone') {
            // Canonicalised first, then 404 on the apex: the only acceptable 2-step case.
            expect(r.hops).toEqual([`${SITE}${path}`]);
            expect(r.status).toBe(404);
          } else {
            expect(r.hops).toEqual([exp.url]); // exactly one 301, straight to the final target
          }
        });
      }
    }
  }
});

describe('what must not redirect', () => {
  it('ACME .well-known passes through on every scheme/host', () => {
    for (const start of [
      { scheme: 'http', host: HOST },
      { scheme: 'http', host: `www.${HOST}` },
      { scheme: 'https', host: `www.${HOST}` },
    ] as const) {
      const out = serve(rules, { ...start, path: '/.well-known/acme-challenge/token' });
      expect(out.location).toBeUndefined();
    }
  });

  it('the new pages and assets serve 200 on the canonical host and are not in the redirect table', () => {
    for (const p of ['/', '/404.html', '/site.css', '/reveal.js', '/robots.txt', '/sitemap.xml', '/og/home.png', `/img/${builtImages.brisket.file}`]) {
      const out = serve(rules, { scheme: 'https', host: HOST, path: p });
      expect(out, p).toEqual({ status: 200 });
    }
    expect(serve(rules, { scheme: 'https', host: HOST, path: '/.htaccess' }).status).toBe(403);
  });

  it('plain http and www canonicalise to https apex in one hop, keeping the path', () => {
    expect(serve(rules, { scheme: 'http', host: HOST, path: '/' })).toEqual({ status: 301, location: `${SITE}/` });
    expect(serve(rules, { scheme: 'https', host: `www.${HOST}`, path: '/site.css' })).toEqual({ status: 301, location: `${SITE}/site.css` });
    expect(serve(rules, { scheme: 'http', host: `www.${HOST}`, path: '/anything' })).toEqual({ status: 301, location: `${SITE}/anything` });
  });
});
