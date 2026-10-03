#!/usr/bin/env node
// One-off generator for the explainer site's Open Graph image, site/src/og/home.png (1200x630).
//
//   node scripts/site-og.mjs        (needs `npm run site:build` first for site/dist/site.css)
//
// Renders a small HTML card with the SITE'S OWN generated CSS (so the tokens and fonts are the
// app's) over the brisket photo, screenshots it with Playwright's bundled Chromium, and writes
// the PNG. The PNG is a committed, hand-made asset (plan §4.4 / §6): rerun this only when the
// tokens (D8) or the headline change. Not part of `site:build`, which must stay offline and fast.

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ROOT, 'site', 'src', 'og', 'home.png');
const css = readFileSync(join(ROOT, 'site', 'dist', 'site.css'), 'utf8');
const photo = await sharp(join(ROOT, 'public', 'images', 'brisket.jpg')).resize({ width: 1200 }).jpeg({ quality: 82 }).toBuffer();

const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Abril+Fatface&display=block">
<style>${css}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
.og{position:relative;width:1200px;height:630px;background:var(--color-brand-dark);color:var(--color-brand-text);font-family:var(--font-sans)}
.og img{position:absolute;inset:0;width:1200px;height:630px;object-fit:cover}
.og .shade{position:absolute;inset:0;background:linear-gradient(90deg,color-mix(in srgb,var(--color-brand-dark) 96%,transparent) 0%,color-mix(in srgb,var(--color-brand-dark) 88%,transparent) 48%,color-mix(in srgb,var(--color-brand-dark) 20%,transparent) 100%)}
.og .copy{position:absolute;left:72px;top:0;bottom:0;width:680px;display:flex;flex-direction:column;justify-content:center;gap:20px}
.og .brand{font-weight:700;font-size:28px;letter-spacing:-0.02em}
.og h1{font-family:var(--font-display);font-weight:400;font-size:76px;line-height:1.02;margin:0;letter-spacing:-0.01em}
.og p{margin:0;font-size:26px;line-height:1.35;color:var(--color-brand-muted);max-width:620px}
.og .pill{display:inline-block;align-self:flex-start;margin-top:6px;padding:10px 18px;border-radius:999px;background:var(--color-brand-primary);font-weight:700;font-size:22px}
</style></head><body><div class="og">
<img src="data:image/jpeg;base64,${photo.toString('base64')}" alt="">
<div class="shade"></div>
<div class="copy">
  <div class="brand">&#x1F525; RoughCut BBQ</div>
  <h1>Know when your BBQ will be done.</h1>
  <p>Cook time, pit temp, pull temp, rest and when to light the fire. Free, metric, made in Australia.</p>
  <span class="pill">app.roughcut.com.au</span>
</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();

mkdirSync(dirname(out), { recursive: true });
// Palette-quantised PNG keeps the file small (OG scrapers fetch it on every share).
const small = await sharp(png).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
writeFileSync(out, small);
const meta = await sharp(small).metadata();
console.log(`site-og -> ${out} ${meta.width}x${meta.height} ${small.length} bytes`);
