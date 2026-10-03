#!/usr/bin/env node
// Live link check for the explainer site (RC-13.3 acceptance: "every app link 200").
//
//   node scripts/check-site-links.mjs            # after `npm run site:build`
//
// Reads site/dist/index.html, collects every absolute link into the app (APP_URL in
// site/site.config.json) plus the sitemap, and requests each one (GET, redirects followed, query
// string kept so utm params are exercised). Exit 1 if any is not 200. Network-dependent on
// purpose: this is the check that the pages we link to actually exist in production.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(ROOT, 'site', 'site.config.json'), 'utf8'));
const html = readFileSync(join(ROOT, 'site', 'dist', 'index.html'), 'utf8');

/** Every href into the app, decoded from HTML (`&amp;` -> `&`), deduplicated, in page order. */
export function appLinks(pageHtml, appUrl) {
  const out = [];
  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(pageHtml))) {
    const href = m[1].replace(/&amp;/g, '&');
    if (href.startsWith(appUrl) && !out.includes(href)) out.push(href);
  }
  return out;
}

/** `/go/<slug>` is the app's affiliate redirect (RC-13.4): a 3xx to Amazon is the pass, not 200. */
export function isGoLink(url) {
  return /\/go\/[a-z0-9-]+(\?|$)/.test(url);
}

export function ok(r) {
  return isGoLink(r.url) ? r.status >= 300 && r.status < 400 : r.status === 200;
}

export async function check(urls) {
  const results = [];
  for (const url of urls) {
    let status = 0;
    let location = '';
    try {
      const go = isGoLink(url);
      const res = await fetch(url, { method: 'GET', redirect: go ? 'manual' : 'follow', headers: { 'user-agent': 'roughcut-site-link-check' } });
      status = res.status;
      if (go) location = res.headers.get('location') ?? '';
    } catch (e) {
      status = -1;
    }
    results.push({ url, status, location });
  }
  return results;
}

const isMain = process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href;
if (isMain) {
  const urls = appLinks(html, config.APP_URL);
  urls.push(`${config.APP_URL}/sitemap.xml`);
  const results = await check(urls);
  for (const r of results) console.log(`${String(r.status).padStart(4)}  ${r.url}${r.location ? `  -> ${r.location.split('&tag=')[0]}` : ''}`);
  const bad = results.filter((r) => !ok(r));
  console.log(bad.length ? `\n${bad.length} of ${results.length} links failed` : `\nall ${results.length} app links passed (200, or 3xx for /go/)`);
  process.exit(bad.length ? 1 : 0);
}
