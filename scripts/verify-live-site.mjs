// Post-upload verification of the LIVE roughcut.com.au (RC-13.6 deliverable, run in RC-13.8).
//
//   npm run site:verify-live          (= tsx scripts/verify-live-site.mjs; needs site/dist built)
//
// Read-only GETs against the live apex. Everything expected is derived from the build in
// site/dist and from scripts/build-site.mjs (the same redirect table that generated .htaccess),
// so this cannot drift from what the owner uploaded. Exit 1 when any row fails. Against the OLD
// site it fails on purpose (wrong H1/title, no 301s for the retired pages, www not redirected,
// /site.css missing): that is how we know it detects the pre-upload state.
//
// Checks (plan RC-13.8 acceptance):
//   home 200, text/html, exactly one <h1> equal to the built one, built <title>, no "apk"
//   https://www -> 301 -> apex; http -> 301 -> https apex; http+www -> one 301 to https apex
//   every retired URL (index.html, guides*.html, rubs.html, wood-chart.html, style.css, ported
//   images) -> 301 to the exact target the table says, and that target -> 200
//   /.htaccess -> 403; a missing page -> 404 served with the built 404.html title
//   /.well-known/acme-challenge/<probe> -> 404 (not redirected)
//   site.css / reveal.js / nav.js / faq.js / robots.txt / sitemap.xml / og/home.png / img/*.webp
//   -> 200 with the right Content-Type; site.css carries the app token --motion-base: 220ms

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import http from 'node:http';
import https from 'node:https';
import { redirectTable, RETIRED_APP_PAGES } from './build-site.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'site', 'dist');
const config = JSON.parse(readFileSync(join(ROOT, 'site', 'site.config.json'), 'utf8'));
const SITE = config.SITE_URL.replace(/\/$/, '');
const APP = config.APP_URL.replace(/\/$/, '');
const HOST = new URL(SITE).host;
const TIMEOUT_MS = 20_000;

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('site/dist/index.html missing: run `npm run site:build` first');
  process.exit(2);
}
const builtHome = readFileSync(join(DIST, 'index.html'), 'utf8');
const built404 = readFileSync(join(DIST, '404.html'), 'utf8');
/** Text content of the first <tag>, child tags stripped, whitespace collapsed. */
const textOf = (html, tag) => {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : undefined;
};
const EXPECT_H1 = textOf(builtHome, 'h1');
const EXPECT_TITLE = textOf(builtHome, 'title');
const EXPECT_404_TITLE = textOf(built404, 'title');
const builtImages = Object.fromEntries(
  readdirSync(join(DIST, 'img'))
    .filter((f) => f.endsWith('.webp'))
    .map((f) => [f.replace(/\.webp$/, ''), { file: f }]),
);

/**
 * Rehearsal mode: VERIFY_ORIGIN_HTTPS=https://localhost:18443 VERIFY_ORIGIN_HTTP=http://localhost:18080
 * sends every roughcut.com.au / www request to a local Apache (docker httpd serving site/dist) with the
 * real Host header, so the whole table can be shown PASSING before the upload. App URLs stay live.
 * Self-signed cert: NODE_TLS_REJECT_UNAUTHORIZED=0. Unset (the default) = the real live site.
 */
function route(url) {
  const u = new URL(url);
  const origin = u.protocol === 'https:' ? process.env.VERIFY_ORIGIN_HTTPS : process.env.VERIFY_ORIGIN_HTTP;
  if (!origin || (u.host !== HOST && u.host !== `www.${HOST}`)) return { url, headers: {} };
  return { url: `${origin}${u.pathname}${u.search}`, headers: { host: u.host } };
}

/**
 * GET without following redirects. Returns { status, location, type, body }. node:http(s) rather
 * than fetch: undici silently drops a caller-set Host header, which the rehearsal mode needs.
 */
function get(target, headers = {}) {
  const r = route(target);
  const u = new URL(r.url);
  const mod = u.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      u,
      { method: 'GET', headers: { 'user-agent': 'roughcut-verify-live/1.0', ...r.headers, ...headers }, timeout: TIMEOUT_MS, rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0' },
      (res) => {
        const type = res.headers['content-type'] ?? '';
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = type.startsWith('text/') || type.includes('xml') || type.includes('javascript') ? Buffer.concat(chunks).toString('utf8') : '';
          resolve({ status: res.statusCode, location: res.headers.location ?? '', type, body: text });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error(`timeout after ${TIMEOUT_MS} ms`)));
    req.on('error', reject);
    req.end();
  });
}

const rows = [];
async function check(label, url, fn) {
  try {
    const r = await get(url);
    const problem = fn(r);
    rows.push({ ok: !problem, label, url, got: `${r.status} ${r.location || r.type.split(';')[0]}`.trim(), problem });
  } catch (e) {
    rows.push({ ok: false, label, url, got: 'ERR', problem: e.message });
  }
}
const expectRedirect = (to) => (r) => (r.status !== 301 ? `expected 301, got ${r.status}` : r.location !== to ? `expected Location ${to}, got ${r.location || '(none)'}` : '');
const expectType = (status, type) => (r) => (r.status !== status ? `expected ${status}, got ${r.status}` : !r.type.startsWith(type) ? `expected Content-Type ${type}, got ${r.type || '(none)'}` : '');

/** One representative old URL per redirect-table row (the .html form; the bare/slash forms are covered offline by the vitest). */
function sampleOldPath(reSource) {
  if (reSource === 'index\\.html') return '/index.html';
  if (reSource === 'style\\.css') return '/style.css';
  const esc = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const page = Object.keys(RETIRED_APP_PAGES).find((p) => reSource === `${esc(p)}(?:\\.html|/)?`);
  if (page) return `/${page}.html`;
  if (reSource.startsWith('images')) return '/' + reSource.replace(/\\/g, ''); // images/<name>.jpg
  throw new Error(`no sample URL for redirect-table row ${reSource}`);
}

export async function verifyLive() {
  // Home
  await check('home 200 + built <h1>/<title>, no apk', `${SITE}/`, (r) => {
    if (r.status !== 200) return `expected 200, got ${r.status}`;
    if (!r.type.startsWith('text/html')) return `expected text/html, got ${r.type}`;
    const h1Count = (r.body.match(/<h1[\s>]/gi) ?? []).length;
    if (h1Count !== 1) return `expected exactly one <h1>, found ${h1Count}`;
    const h1 = textOf(r.body, 'h1');
    if (h1 !== EXPECT_H1) return `h1 is "${h1}", expected "${EXPECT_H1}"`;
    if (textOf(r.body, 'title') !== EXPECT_TITLE) return `title is "${textOf(r.body, 'title')}", expected "${EXPECT_TITLE}"`;
    if (/apk/i.test(r.body)) return 'HTML mentions apk';
    return '';
  });

  // Canonical host / scheme
  await check('https www -> apex', `https://www.${HOST}/`, expectRedirect(`${SITE}/`));
  await check('http -> https apex', `http://${HOST}/`, expectRedirect(`${SITE}/`));
  await check('http www -> https apex in one hop (path kept)', `http://www.${HOST}/site.css`, expectRedirect(`${SITE}/site.css`));
  await check('https www keeps path', `https://www.${HOST}/robots.txt`, expectRedirect(`${SITE}/robots.txt`));

  // Retired URLs -> exact target, and target -> 200
  for (const [re, to] of redirectTable(config, builtImages)) {
    const path = sampleOldPath(re);
    await check(`old ${path} -> 301 ${to}`, `${SITE}${path}`, expectRedirect(to));
  }
  const targets = [...new Set(redirectTable(config, builtImages).map(([, to]) => to))];
  for (const to of targets) {
    await check(`target 200 ${to.startsWith(APP) ? '(app)' : '(site)'} ${to}`, to, (r) => (r.status === 200 ? '' : `expected 200, got ${r.status}`));
  }

  // Protected / missing
  await check('/.htaccess 403', `${SITE}/.htaccess`, (r) => (r.status === 403 ? '' : `expected 403, got ${r.status}`));
  await check('missing page -> 404 with built 404.html', `${SITE}/this-page-does-not-exist-${Date.now()}`, (r) =>
    r.status !== 404 ? `expected 404, got ${r.status}` : textOf(r.body, 'title') !== EXPECT_404_TITLE ? `404 body title is "${textOf(r.body, 'title')}", expected "${EXPECT_404_TITLE}"` : '',
  );
  await check('.well-known passthrough (404, not 301)', `${SITE}/.well-known/acme-challenge/verify-probe`, (r) => (r.status === 404 ? '' : `expected 404, got ${r.status}`));

  // Assets with content types
  await check('site.css text/css + --motion-base: 220ms', `${SITE}/site.css`, (r) => expectType(200, 'text/css')(r) || (r.body.includes('--motion-base: 220ms') ? '' : 'site.css lacks --motion-base: 220ms'));
  for (const js of ['reveal.js', 'nav.js', 'faq.js']) {
    if (existsSync(join(DIST, js))) await check(`${js} javascript`, `${SITE}/${js}`, (r) => (r.status !== 200 ? `expected 200, got ${r.status}` : /javascript/.test(r.type) ? '' : `expected a javascript type, got ${r.type}`));
  }
  await check('robots.txt text/plain', `${SITE}/robots.txt`, expectType(200, 'text/plain'));
  await check('sitemap.xml xml', `${SITE}/sitemap.xml`, (r) => (r.status !== 200 ? `expected 200, got ${r.status}` : /xml/.test(r.type) ? '' : `expected an xml type, got ${r.type}`));
  await check('og/home.png image/png', `${SITE}/og/home.png`, expectType(200, 'image/png'));
  for (const i of Object.values(builtImages)) await check(`img/${i.file} image/webp`, `${SITE}/img/${i.file}`, expectType(200, 'image/webp'));
  await check('404.html itself 200', `${SITE}/404.html`, expectType(200, 'text/html'));

  return rows;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const out = await verifyLive();
  const w = Math.max(...out.map((r) => r.label.length));
  for (const r of out) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label.padEnd(w)}  ${r.got}${r.problem ? `  <- ${r.problem}` : ''}`);
  const fails = out.filter((r) => !r.ok).length;
  console.log(`\n${out.length} checks, ${fails} failed  (${SITE}, ${new Date().toISOString()})`);
  process.exit(fails ? 1 : 0);
}
