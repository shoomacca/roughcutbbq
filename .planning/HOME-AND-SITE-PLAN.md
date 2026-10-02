# RoughCut BBQ — Explainer website and app home: build plan (rev 2)

**Written:** 2026-10-02 · **Revised:** 2026-10-02 (owner decision below) · **Status:** plan only, nothing built · **Owner's ask:** "maybe we should have a home page that explains what its for, make it easy etc? I think we need to re-evaluate the actual website that explains this as well, so I want a build plan."

**Owner decisions (2026-10-02, override D1 in BLUEPRINT §5):**
- Keep the separate explainer website on Hostinger at `roughcut.com.au` (+ `www`), static HTML/CSS (PHP only where it genuinely helps), with the **same UI, style and motion as the app**. All CTAs go to `app.roughcut.com.au`. No apex redirect. The app stays at `app.roughcut.com.au`.
- **Deploy: no pipeline, no Hostinger credentials.** `npm run site:build` produces a self-contained `site/dist/` folder that the owner copies into `public_html` himself via hPanel File Manager (§5).
- **Defaults confirmed:** build now on the current tokens (before D8); the sample card uses **spatchcock chicken** until RC-3.4 lands; **analytics deferred**: RC-13.10 stays blocked and no tracking code is added to either domain.
- Recorded in BLUEPRINT §5 (D1), ISSUES (RC-10.3, RC-13.x) and HANDOVER by RC-13.0.

Tags: **[M]** measured (command run / line read / page fetched on 2026-10-02) · **[G]** judgement.

---

## 1. What exists today (discovery)

### 1.1 The explainer website, live [M]

- `https://roughcut.com.au` and `https://www.roughcut.com.au` return **200** from **Hostinger/LiteSpeed** (`platform: hostinger`, `panel: hpanel`), `Last-Modified: 29 Jun 2026 13:40:36`, 10,210 bytes. DNS `109.106.254.151`; `www` is an alias. `http://` 301s to `https://` [M: `curl -sI`, `nslookup`].
- Six pages, all static: `index.html`, `guides.html`, `rubs.html`, `wood-chart.html`, `guides/<5 slugs>.html`, one `style.css`, **no images** [M: fetched HTML; audit-ui §4]. Title "Rough Cut BBQ — Technical Pitmaster Journal". Fonts: Playfair Display, Space Mono, Inter via Google Fonts. Palette: `#09090b` bg, gold `#f59e0b`, red `#dc2626` [M: `style.css:2-16`].
- CTAs: "LAUNCH APP" → `https://app.roughcut.com.au` (now the **new** app, since RC-0.7; audit's "old build" note is stale) and "DOWNLOAD FOR ANDROID (APK)" → `app.roughcut.com.au/rough-cut-bbq-debug.apk` → **404** [M: `curl -sI` today].
- Mobile: horizontal overflow at 390 px (document 462 px), no mobile nav [M: audit-ui §4, measured 2026-09-30; not re-measured today].
- Source of the live site: `../roughcutbbq-main/roughcutbbq-main/marketing-website/` (`index.html`, `guides.html`, `rubs.html`, `wood-chart.html`, `guides/*.html`, `style.css`, `images/` with the 13 food photos + `rough_cut_bbq_hero.png`, `rough_cut_bbq_forum.png`, `example5.png`) [M: `ls -R`]. Read-only; nothing there is modified by this plan. Audit-ui §4 found the live site equals git commit `7b96dbd`; a later never-deployed pass (`3acec80`) exists in the old repo [M: audit; not re-diffed today].
- Brand split today: site "Rough Cut BBQ." (two words, Playfair, gold on near-black) vs app "🔥 RoughCut BBQ" (one word, Inter + Abril Fatface, forest green, red/orange) [M: audit-ui §4]. D5 chose "RoughCut BBQ"; D8 chose charcoal + ember for the app (RC-4.1/4.2, not yet built).

**Could not verify from here:** Hostinger hPanel login, whether DNS is managed at Hostinger or the registrar, whether hPanel's Git deploy or FTP is enabled, Search Console data for either domain. Owner items, §9.

### 1.2 The app home `/` [M]

- `app/page.tsx` = `ProgressBar current={1}` + `HeroCarousel`. Seven emoji category cards; the headline is an `<h2>`; CTA "Cook Pork →" writes `sessionStorage.bbq_initial_cat` and pushes `/calculator` [M: `HeroCarousel.tsx:257-260, 364`]. Desktop needs a double-click to proceed [M: `:379`].
- **Zero `<h1>` on the live home** [M: `curl https://app.roughcut.com.au/ | grep -c "<h1"` → 0]. Footer hidden on `/`, `/calculator*`, `/results*` [M: `Footer.tsx:10`]. Dead components `HomeCarousel.tsx` and `SeoSection.tsx` are unused [M: grep]; RC-4.4 deletes them.
- Routes: `/calculator`, `/results`, `/cook` + 257 `/cook/[method]/[cut]`, `/ideas`, `/recipes` (61), `/guides` (5 MDX), `/rubs` (31), `/wood-chart`, `/techniques`, `/gear` (28) + `/go/[slug]`, `/gallery`, `/saves`, `/login`, `/signup`, `/account/delete`, `/unsubscribe`, `/privacy`, `/admin/*` [M: `find app -name page.tsx`; data counts from `data/*`].
- SEO: `metadataBase` = `NEXT_PUBLIC_SITE_URL` or `https://app.roughcut.com.au`, title template `%s | RoughCut BBQ`, OG `siteName/type/locale en_AU`, **no OG image**, Twitter `summary` [M: `app/layout.tsx`, live head]. `public/robots.txt` static, sitemap URL hard-coded. Sitemap live = **333 `<loc>`** [M]. JSON-LD: HowTo + FAQPage + BreadcrumbList on cook pages, Recipe on recipe pages, HowTo on `/results` (client-only) [M: `lib/jsonld.ts`]. No WebSite/Organization on `/`. Home description still claims "no ads" (RC-1.10 removes it) [M: `app/page.tsx:8`].
- Analytics: `lib/posthog.ts` forwards to `window.posthog`, which is never loaded; no `posthog-js` dependency [M]. RC-0.8 blocked on the owner's choice [M: HANDOVER].
- Android: `capacitor.config.json` `server.url = https://roughcut-bbq.vercel.app`, `allowNavigation` includes `app.roughcut.com.au`; `CapacitorBootstrap` not mounted anywhere; `public/offline.html` (the `errorPath`) missing [M].

### 1.3 Design and motion system to reuse [M: `app/globals.css`, `lib/motion.ts`, commits `e3c6836`…`7b9c07c`]

- Colour tokens (Tailwind `@theme`): `--color-brand-primary #C0392B`, `-secondary #E67E22`, `-dark #1b2d1d`, `-surface #1E3524`, `-text #F5F5F5`, `-muted #7A9E7A`, `-card #F2EDD7`. Fonts: Inter + Abril Fatface (`--font-display`). D8 will replace these in RC-4.1/4.2.
- Motion tokens: `--motion-fast 150ms / base 220ms / slow 320ms / hero 650ms`, `--motion-dist 16px / -sm 8px`, `--ease-out-soft`, `--ease-in-soft`, `--ease-spring`; keyframes `fade-in`, `fade-up`, `shimmer`, `ember-pulse`, `smoke-rise`; utilities `transition-ui`, `lift`, `collapse-box`, `skeleton`; `button:active { scale: .97 }` press; one `@media (prefers-reduced-motion: reduce)` block (movement → fade, position changes instant); `@media print` block (nothing hidden or mid-animation on paper).
- Reveal rules (`components/Reveal.tsx` + CSS): server HTML fully visible; only once `html[data-hydrated]` is set do unseen below-fold `.reveal` items hide; each animates once on entry; items already on screen at hydration get `data-instant` and never fade; a jump/Back reveals everything above the viewport; fast scroll batches skip the stagger; no JS = nothing hidden.
- `lib/motion.ts` mirrors the numbers for framer-motion. framer-motion stays app-only; **the site gets none.**

---

## 2. Division of labour between the two domains

| | `roughcut.com.au` (Hostinger, static) | `app.roughcut.com.au` (Vercel, Next) |
|---|---|---|
| Job | Explain the product in 5 seconds, build trust, send people to the app | Be the product: calculator, plans, cook pages, recipes, guides, gear, gallery, accounts |
| Audience | First-timers from a brand search, a share, the Play listing | Everyone with a lump of meat; returning users land here directly |
| Content it owns | Hero, how it works, what you get, featured cooks, FAQ, app download, about/contact | All reference content (guides, rubs, wood chart, recipes, cook pages) |
| CTAs | Every one → `app.roughcut.com.au/...` with `?utm_source=site` | Header/footer link "What is RoughCut?" → `roughcut.com.au` |

Rule to prevent duplicate content: **reference content lives once, on the app.** The site links to it; it does not copy it (§3.2).

---

## 3. The website

### 3.1 Audience and the 5-second job

An Australian backyard cook with a kettle, offset, kamado, pellet smoker or the oven, who has a cut and a time to eat. Metric. Not a competition pitmaster. In 5 seconds: "RoughCut BBQ tells me when my meat will be done and when to light the fire", and one tap starts a cook on the app.

### 3.2 What the six existing pages become

| Live page | Decision | Why (SEO) |
|---|---|---|
| `index.html` | **Rewrite** as the explainer home (§3.3) | The only page the site needs to rank for: brand queries and "bbq cook time calculator" |
| `guides.html` | **Rewrite as a short index** that links each guide to `app.roughcut.com.au/guides/<slug>`; **or** 301 to the app's `/guides` | The app already has the same 5 guides at the same slugs [M]. Two copies = duplicate content; the app copy has the 257 cook pages linking into it. A thin index with outbound links is fine; a copy is not. Recommend: **301 `/guides.html` → app `/guides`** (simplest, one canonical) [G] |
| `guides/<slug>.html` (5) | **301** to `app.roughcut.com.au/guides/<slug>` | Same slugs exist on the app [M: `ls app/guides`]. Keeps any inbound links alive; one canonical per guide |
| `rubs.html` | **301** to app `/rubs`; first port the 3 "parts" recipes into the app if `/rubs` lacks them (RC-13.6) | App has 31 rubs [M]; the site's 3 are a subset |
| `wood-chart.html` | **301** to app `/wood-chart`; port the strength badges/copy if better (RC-13.6) | Same |
| `style.css` | Replaced by the generated `site.css` (§4) | — |
| `/rough-cut-bbq-debug.apk` link | **Removed**; Play button behind a flag (§3.3.8) | Dead 404 today [M] |

301s on Hostinger: `.htaccess` `Redirect 301` rules (LiteSpeed honours Apache `.htaccess` [G: standard for Hostinger shared hosting; confirm in hPanel]). Where a page is kept on both domains for any reason, the site page carries `<link rel="canonical" href="https://app.roughcut.com.au/...">`; but the plan above avoids that case entirely except the guides index if the owner prefers to keep it.

### 3.3 Page structure and draft copy (home, `index.html`)

Australian English, plain, no hype. Section order on a phone is the order below. Every section is a `.reveal` except the hero.

**1. Hero**
```
H1:  Know when your BBQ will be done.
P:   Pick the cut, the cooker and the weight. RoughCut BBQ gives you cook time,
     pit temp, pull temp, rest, and the time to light the fire. Free, metric,
     made in Australia.
Primary CTA (full width on phone):  Start a cook →   (app.roughcut.com.au/calculator?utm_source=site&utm_medium=hero)
Secondary link:                     See a sample plan  (app.roughcut.com.au/cook/smoker/pork-shoulder?utm_source=site)
```
Visual: a static phone-framed screenshot of the app's results page (real plan, exported as AVIF/WebP ≤ 100 KB), not a carousel. Reason: the carousel is a product control; on the explainer it would be a fake one [G].

**2. How it works**
```
H2: Three taps, one plan.
1. Pick the cut.        Pork, beef, chicken, lamb, fish, veg, jerky: 80 cuts.
2. Pick the cooker.     Smoker, kettle, kamado, oven, slow cooker and more.
3. Enter the weight.    Get the full plan: times, temps and when to start.
```
Three app-UI screenshots (steps 1–3), staggered reveal.

**3. What you get (a real plan, rendered static)**
```
H2: Your plan, not a guess.
Cook time ~ 15 h 24   ·   Pit 110 °C   ·   Pull at 95 °C   ·   Rest 60 min
Start at 1:30 am to eat at 5:00 pm.
Plus: when to wrap, when the stall hits, which rub and wood suit it, and the
gear worth owning. Save it, email it, or print it for the shed wall.
Plan this cook →  (app …/results?method=smoker&cat=pork&cut=pork_shoulder&kg=4&utm_source=site)
```
Those are today's real engine numbers [M: `calculateCook({smoker, pork, pork_shoulder, 4 kg})` → 15.4 h, 110 °C, 95 °C, 60 min]. 15.4 h is the known linear-model over-estimate (BLUEPRINT §3; RC-3.4 fixes it). The build script (§4) writes this card from the engine at build time (`import { calculateCook } from '../lib/calculator'`), so it is never hand-typed and tracks RC-3.4. **Decided:** the card uses spatchcock chicken (`sampleCut` in `site.config.json`) until RC-3.4 lands, then switches to pork shoulder.

**4. Featured cooks (6 tiles)**
```
H2: Start with a classic.
Brisket · Pulled pork · Pork ribs · Spatchcock chicken · Lamb shoulder · Hot-smoked salmon
```
Photo tile (from `public/images`; lamb has no photo, list for RC-6.3), cook time at a reference weight from the engine at build time, link to the app's `/cook/smoker/<cut>`. This is the site's main internal-link gift to the app's 257-page cluster.

**5. Guides and recipes**
```
H2: Learn the bits that matter.
Brisket from trim to rest · The stall, explained · How long to smoke ribs ·
Spatchcock chicken · Using a meat thermometer                      All guides →
Recipes: 60 tested cooks, from Texas pulled pork to smoked cauliflower.  All recipes →
```
Links only, to the app. Titles/slugs pulled from the app's guide list at build time.

**6. Community gallery**
```
H2: Before and after.
Post your cook, see what other backyards are turning out.    See the gallery →
```
Static: three photos exported at build time only if the gallery has ≥ 3 public posts; otherwise the section is one line + link. No live fetch from Hostinger (no server code needed) [G].

**7. Gear (with disclosure)**
```
H2: Gear we'd actually buy.
A thermometer first, then everything else.                      See all gear →
(paid links) As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.
```
Three items, links to the app's `/go/<slug>` so clicks are logged on the app side [M: `/go` logs to `gear_clicks`]; `rel="sponsored noopener"`. Wording per RC-1.10.

**8. App download**
```
H2: Take it to the pit.
RoughCut BBQ on Android. Same calculator, in your pocket.   [Get it on Google Play]
```
Rendered only when `PLAY_URL` is set in `site/site.config.json`; until RC-12.5 publishes a listing the section is omitted entirely. No APK links, ever. Also: "On iPhone? Open app.roughcut.com.au and Add to Home Screen" once RC-9.5 ships the PWA manifest.

**9. FAQ (FAQPage JSON-LD)**
```
Is it free?            Yes. No account needed. An account only saves your cooks.
Is it metric?          Yes. Kilograms and degrees Celsius only.
How accurate is it?    It is a planning estimate from published cook ranges. Always cook
                       to internal temperature, not the clock; the plan gives you both.
Which cookers?         Smoker, charcoal kettle, kamado, oven, slow cooker, pressure cooker,
                       wood fire, rotisserie, dehydrator.
Can I plan backwards?  Yes: set "eat at" and it tells you when to start. (only after RC-3.5)
```
`collapse-box` accordion, `<button aria-expanded>`, CSS-only animation.

**10. Footer** (shared partial): © RoughCut BBQ · Open the app · Guides · Gear · Gallery · Privacy · Terms · Disclosure (app URLs) · Amazon sentence.

**Header** (shared partial): logo "RoughCut BBQ" (D5 spelling) · Guides · Recipes · Gear (app links) · "Open the app" button. Collapses to a hamburger below 768 px using `collapse-box` (fixes the measured overflow).

**Cut, deliberately:** testimonials (none real), "trusted by", newsletter (email capture lives on the app's results page), pricing (free), founder story (one footer line later).

---

## 4. Same look as the app: token sharing without a build step on Hostinger

### 4.1 Options

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Token extractor + static assembler, one script in this repo** (recommended) | `scripts/build-site.mjs` reads `app/globals.css`, extracts the `@theme` block (as `:root` vars), every `@keyframes`, the reduced-motion block and the print block **verbatim**, prepends them to a hand-written `site/src/site.css` (layout + the CSS equivalents of `transition-ui`, `lift`, `collapse-box`, `.reveal`), inlines `site/src/partials/*.html` into each page, writes the engine-driven cards, and emits plain files to `site/dist/` | No framework; ~150 lines; the site literally cannot have different numbers from the app because it never types them; a vitest asserts every `--motion-*`, `--ease-*`, `--color-*` var in `site/dist/site.css` equals the app's; runs in the existing CI | Hand-written layout CSS still has to mirror the app's utility classes (a short list) |
| B. Eleventy | Same but with a templating layer | Nicer templating, collections | A second dependency and config for 6 pages; overkill |
| C. Hand-copied `style.css` | Copy values by hand | Nothing to build | Drifts within a month (it already has: two palettes today [M]) |
| D. PHP includes for header/footer, CSS linked cross-origin from `app.roughcut.com.au/site.css` | Hostinger runs PHP | No build at all | Site styling depends on the app's uptime and CSP; header/footer still hand-typed in PHP; two places to edit |

**Recommend A.** PHP is not needed: the one thing PHP would buy (header/footer includes) the assembler does at build time, with zero runtime dependency. If the owner wants to edit copy on Hostinger directly without the repo, that is the only reason to add PHP includes, and it reintroduces drift; not recommended [G].

### 4.2 What `site.css` contains, exactly

1. `:root { … }` = the `@theme` custom properties from `app/globals.css` (colours, fonts, `--motion-*`, `--ease-*`, `--animate-*`), mechanically converted (`@theme {` → `:root {`). Tailwind's `--color-brand-*` names are kept as-is so a class in the site can say `color: var(--color-brand-muted)`.
2. The keyframes `fade-in`, `fade-up`, `shimmer`, `ember-pulse`, `smoke-rise`, copied verbatim.
3. Plain-CSS equivalents of the app utilities, written once in `site/src/site.css` and **covered by the parity test**: `.transition-ui` (same property list, `var(--motion-base)`, `var(--ease-out-soft)`), `.lift:hover { translate: 0 -2px }`, `button:not(:disabled):active { scale: .97 }` with the `--motion-fast` transition, `.collapse-box` (grid-rows 0fr→1fr, `data-open`, `visibility` hand-off), `.skeleton`.
4. The reveal CSS, same contract as the app, with `html[data-js]` in place of `html[data-hydrated]`:
   ```css
   html[data-js] .reveal:not([data-inview]) { opacity: 0; }
   .reveal[data-inview]:not([data-instant]) { animation: fade-up var(--motion-slow) var(--ease-out-soft) both; animation-delay: var(--reveal-delay, 0ms); }
   ```
5. The `@media (prefers-reduced-motion: reduce)` block and the `@media print` block, copied verbatim (they reference the same class names, which is why the names are kept identical).
6. Fonts: Inter + Abril Fatface via `<link>` to Google Fonts with `display=swap` (the app uses `next/font` for the same faces [M]; the family names are read from `app/layout.tsx` by the script so RC-4.2's font change propagates). Self-hosting is a later step if LCP needs it.

### 4.3 `site/src/reveal.js` (≈40 lines, no dependencies)

Mirrors `components/Reveal.tsx` rule for rule: (1) first statement sets `document.documentElement.dataset.js = ''` (so before it runs, and with JS off, everything is visible); (2) `IntersectionObserver` reveals each `.reveal` once; (3) items intersecting at the first observer callback get `data-instant` (no fade); (4) a batch ≥ 3 in one callback gets no stagger; (5) `--reveal-delay` = `min(index, 8) * 60ms` from a `data-index` attribute; (6) on `pageshow`/`scroll` anything unrevealed above the viewport is shown instantly; (7) nothing else animates on its own. `beforeprint` is unnecessary because the print block already forces `opacity:1`.

### 4.4 Parity enforcement

`tests/site-tokens.test.ts` (vitest, runs in the existing CI): parse `app/globals.css` `@theme` vars and `site/dist/site.css` `:root` vars, assert equal sets and values; assert each keyframe name from the app exists byte-identical in `site.css`; assert `grep framer` = 0 in `site/`; assert no raw hex in `site/src/*.css` except inside the generated block. Playwright (`e2e/site.spec.ts`, served via `npx serve site/dist`): 390 px `scrollWidth === 390`; reduced-motion → `document.getAnimations().length === 0` after 1 s; JS disabled → every `.reveal` has `opacity: 1`; axe 0 serious.

D8 note: when RC-4.1/4.2 change the app's tokens and fonts, `npm run site:build` regenerates `site.css`; the only hand-made assets to redo are the OG image and the app screenshots.

---

## 5. Where the source lives and how it deploys

**Source:** `site/` in this repo (versioned beside the app; shares `lib/calculator`, `data/*`, `public/images`):
```
site/
  site.config.json        # APP_URL, PLAY_URL (empty = hide), SITE_URL, GA/PostHog key (empty = none)
  src/
    pages/index.html, guides.html (if kept), 404.html
    partials/head.html, header.html, footer.html
    site.css, reveal.js
    .htaccess               # 301 map (§3.2), caching headers, HTTPS
    og/home.png, img/*
  dist/                     # build output, gitignored; what gets uploaded
scripts/build-site.mjs      # npm run site:build
```
Build output is **plain HTML/CSS/JS/images**. Nothing runs on Hostinger. No CI step, no FTP, no Git deploy, no credentials (owner decision).

**Deploy = upload package (RC-13.6), uploaded by the owner (RC-13.8).** `npm run site:build` writes `site/dist/` containing **every** file the site needs: `index.html`, `404.html`, `site.css`, `reveal.js`, `img/*`, `og/home.png`, `favicon.ico` + `favicon.svg`, `robots.txt`, `sitemap.xml`, and `.htaccess` with the §3.2 301 map and cache/HTTPS rules. It also writes:
- `site/dist/README-UPLOAD.txt`: plain steps for hPanel File Manager: (1) open File Manager → `public_html`; (2) **back up first**: select all → Compress → download the zip (or just download the folder); (3) delete the old files; (4) upload everything from `site/dist/`, **including `.htaccess`, which is a hidden file** (turn on "show hidden files" in File Manager and in Windows Explorer, or use the zip below so it can't be missed); (5) check five URLs in a browser: `https://roughcut.com.au/`, `https://www.roughcut.com.au/`, `https://roughcut.com.au/guides.html` (should land on the app's `/guides`), `https://roughcut.com.au/rubs.html` (→ app `/rubs`), `https://roughcut.com.au/site.css` (loads, contains `--motion-base: 220ms`).
- `site/roughcut-site.zip` (optional, same contents, hidden file included): upload the one zip and use File Manager's **Extract**, then delete the zip.

**Rollback:** before the first upload, RC-13.6 saves the current live site with `curl` into `site/backup-2026-10-02/` (`index.html`, `guides.html`, `rubs.html`, `wood-chart.html`, `guides/*.html` ×5, `style.css`; the site has no images [M]) and commits it. Rollback = upload that folder over `public_html`. The owner's own zip from step (2) is the second copy.

**Owner items (no credentials needed):** the upload itself (RC-13.8); optionally, later, Google Search Console verification for `roughcut.com.au` and `app.roughcut.com.au` (HTML-file method: the build can include the file once the owner supplies its name) and sitemap submission; the Play Store URL when RC-12.5 publishes (sets `PLAY_URL`).

---

## 6. SEO across two domains

- **Canonical rule:** every URL has exactly one canonical host. Explainer pages → `https://roughcut.com.au/...`; all reference/product content → `https://app.roughcut.com.au/...`. No page exists on both; the 301 map (§3.2) enforces it for the old site URLs. If the owner keeps `guides.html` as an index, it is its own page (not a copy) and needs no cross-domain canonical.
- **Sitemaps:** `site/dist/sitemap.xml` (home, guides index if kept, 404 excluded) generated by the build script; `robots.txt` with `Sitemap:` line. App sitemap unchanged (333 URLs) [M]. Two Search Console properties; no change-of-address.
- **Cross-linking:** site header/footer and every section link to the app (with UTM so the app's analytics attribute them). App: header link "What is RoughCut?" and footer "About" → `https://roughcut.com.au` (RC-13.7). App `Organization.url` points at the apex; app `WebApplication.url` at the app.
- **JSON-LD placement:** `roughcut.com.au/`: `Organization` (name "RoughCut BBQ", `url` apex, `logo`, `sameAs` Play listing when it exists) + `WebSite` (apex) + `FAQPage`. `app.roughcut.com.au/`: `WebApplication` (`applicationCategory: UtilitiesApplication`, `operatingSystem: Any`, `offers: 0 AUD`, `url` app, `publisher` → the Organization `@id` on the apex) + a minimal `Organization` reference by `@id`. No HowTo on either home (Google retired HowTo rich results; RC-10.2 removes it elsewhere) [G: policy, verify in the issue].
- **Metadata:** site home title `RoughCut BBQ: free BBQ and smoker cook time calculator (AU)` (≤ 60), description `Pick the cut, cooker and weight. Get cook time, pit and pull temps, rest, and the time to start. Free, metric, no account needed.` (no "no ads"). OG image 1200×630 (`site/src/og/home.png`), `twitter:card summary_large_image`. App home: title via the template `Free BBQ cook time calculator, metric | RoughCut BBQ`, same description, same OG image copied to `public/og/home.png`.
- **Speed budget (site):** one CSS file ≤ 20 KB, `reveal.js` ≤ 2 KB, hero image ≤ 100 KB AVIF with WebP fallback, fonts `display=swap`, LCP ≤ 1.5 s on mobile emulation (static files on LiteSpeed), CLS < 0.02 (explicit width/height on every image), Lighthouse mobile ≥ 95 all four.

---

## 7. The app's own `/` (small, one issue)

Keep the calculator start and the carousel exactly as they are. Cheap wins only (RC-13.7):
- One `<h1>` above the carousel: "Know when your BBQ will be done." + one line: "Pick a cut to start. Cook time, temps, rest and start time, free and metric." Carousel headline becomes a `<p>` (one H1, no stray H2).
- Metadata per §6 (title via template, description without "no ads", `openGraph.images` + `twitter summary_large_image`), `WebApplication` + `Organization @id` JSON-LD.
- Show the footer on `/` (remove `/` from `Footer.tsx:10`), add "What is RoughCut?" → `https://roughcut.com.au` to the header nav and footer.
- Drop the desktop "Double-click to start cooking" hint (the button is the way; RC-5.1 planned this anyway).
No new sections, no server fetches, `/` stays static, Playwright specs that start at `/` stay unchanged.

---

## 8. Android shell

`server.url` → `https://app.roughcut.com.au/calculator?src=app` (host already in `allowNavigation` [M]); commit `public/offline.html` in tokens (also wanted by RC-9.5 and RC-12.1); Back on step 1 exits the app (existing `canGoBack` listener handles it once the start URL is `/calculator`). The explainer site is never loaded in the shell. RC-13.9.

---

## 9. Measurement and open questions

**Measurement (deferred by owner decision).** No tracking code is added to either domain by this plan. The site is on Hostinger, so when the owner does decide, **Vercel Analytics would cover the app only**; a cross-domain picture needs PostHog (EU host, one project, `utm_source=site` on every link, which the site already carries) or GA4 on both. Until then the live signals are `cook_tally` (plans/day) and `gear_clicks` on the app [M], plus Search Console once verified. Success after 4 weeks vs the 4 weeks before: plans/day up; Search Console brand-query impressions on the apex and `/cook/*` impressions on the app both up; Lighthouse mobile ≥ 95 on both homes. RC-13.10 stays blocked on RC-0.8.

**Decided (2026-10-02):** build now on the current tokens (D8 re-skins via `site:build`; only OG image and screenshots redone); sample card = spatchcock chicken until RC-3.4 (`site.config.json` `sampleCut`); analytics deferred; deploy = manual upload of `site/dist/`, no credentials.

**Still open (none blocks RC-13.1–13.7):**
1. Search Console verification for the two domains (optional, later; owner supplies the HTML-file name and the build includes it).
2. Keep `guides.html` as a links-only index or 301 it to the app's `/guides` (plan recommends the 301; §3.2).

---

## 10. Issues (RC-13.x), in order, one subagent each

Conventions as `ISSUES.md`: size XS/S/M/L, risk tags, testable acceptance, branch `rc-13.y`, commit `type(RC-13.y): …`. Every code issue implicitly includes `tsc`, `lint`, `build`, vitest and Playwright green.

**RC-13.0 Record the owner's decisions** · docs · XS · **done in this commit**
- BLUEPRINT §5 D1 amended (separate Hostinger site, same UI as the app, manual upload, defaults); ISSUES RC-10.3 marked superseded and the RC-13.x list added (§M13); HANDOVER updated.
- **Accept:** BLUEPRINT D1 and ISSUES contain no live instruction to redirect the apex. **Verify:** reviewer reads the three diffs.

**RC-13.1 Site scaffold + token extractor + parity test** · risk-safe-fix · M
- `site/` tree per §5; `scripts/build-site.mjs` (`npm run site:build`): extracts `@theme`, keyframes, reduced-motion and print blocks from `app/globals.css`, converts `@theme`→`:root`, prepends to `site/src/site.css`, inlines partials, writes `site/dist/`. Hand-written utility equivalents per §4.2. `tests/site-tokens.test.ts` per §4.4. `site/dist` gitignored. `.htaccess` with the §3.2 301 map and cache headers.
- **Accept:** `npm run site:build` produces `site/dist/index.html` + `site.css`; the parity test passes and fails when a `--motion-base` value is changed in either file; `grep -c framer site/` = 0; `grep -E "#[0-9a-f]{6}" site/src/site.css` = 0 outside the generated block.
- **Verify:** reviewer edits `--motion-slow` in `app/globals.css` on a scratch branch and sees the test fail; diffs `:root` vars against the app by eye for one colour and one easing.

**RC-13.2 `reveal.js`, header/footer partials, mobile nav** · risk-safe-fix · S · blocked by 13.1
- `site/src/reveal.js` per §4.3; `partials/header.html` (logo, 3 app links, "Open the app", `collapse-box` hamburger), `footer.html` (§3.3.10); `e2e/site.spec.ts` serving `site/dist` on a spare port.
- **Accept (Playwright):** JS disabled → all `.reveal` at `opacity: 1`; JS on → an off-screen `.reveal` has `opacity: 0` until scrolled in, then `data-inview` set once; `reducedMotion: 'reduce'` → `document.getAnimations().length === 0` after 1 s; print emulation → no element with `opacity < 1`; 390 px `scrollWidth === 390`; hamburger toggles `aria-expanded` by keyboard; axe 0 serious.
- **Verify:** reviewer runs the spec and screenshots 390 px with the menu open.

**RC-13.3 Home page: hero, how it works, sample plan (engine-driven), featured cooks** · risk-safe-fix · M · blocked by 13.2
- `pages/index.html` sections 1–4 per §3.3; the build script imports `lib/calculator` and `data/meats.json` to write the sample card and the 6 tile times; sample cut from `site.config.json` (`sampleCut`); app screenshots exported at 390 px (Playwright script `scripts/site-shots.ts`) as AVIF+WebP ≤ 100 KB each; all CTAs carry `utm_source=site`.
- **Accept:** a vitest asserts the sample card numbers equal `calculateCook()` for the configured input (no literals in HTML source); every `a[href]` to the app returns 200 (Playwright crawl against live app); each image has width/height and non-empty alt; hero image ≤ 100 KB; Lighthouse mobile on `site/dist` ≥ 95 Performance.
- **Verify:** reviewer changes `sampleCut` to `spatchcock_chicken`, rebuilds, and sees the card change; Lighthouse JSON in the PR.

**RC-13.4 Home page: guides/recipes, gallery line, gear + disclosure, FAQ, Play flag, JSON-LD, sitemap, OG** · risk-safe-fix · M · blocked by 13.3
- Sections 5–9 per §3.3; Play section only when `PLAY_URL` non-empty; gear links via app `/go/<slug>` with `rel="sponsored noopener"` and the RC-1.10 disclosure sentence; `Organization` + `WebSite` + `FAQPage` JSON-LD; `sitemap.xml`, `robots.txt`, `404.html`; `og/home.png` 1200×630; meta per §6.
- **Accept:** Rich Results Test valid for FAQPage (screenshot); `PLAY_URL` empty → `grep -c "Google Play" site/dist/index.html` = 0; no `.apk` string anywhere in `site/dist`; disclosure text present in the gear section DOM; `og:image` resolves 200 at 1200×630; title ≤ 60 chars, brand once.
- **Verify:** reviewer runs the Facebook/LinkedIn debugger on the preview; greps for `apk`.

**RC-13.5 Guides/rubs/wood 301 map + content parity port** · risk-safe-fix · S · blocked by 13.4
- Diff the live apex `rubs.html`, `wood-chart.html`, 5 guides against app `/rubs`, `/wood-chart`, `/guides/*` (read-only on the sibling folder; copy content into this repo only); port what the app lacks (3 "parts" rub ratios, wood strength badges, missing paragraphs). Finalise `.htaccess` 301s for the 9 retired URLs. If the owner keeps `guides.html` as an index: build it as links only, own canonical.
- **Accept:** a parity checklist in the PR mapping every apex heading to an app URL and present/ported; `.htaccess` lists 9 `Redirect 301` lines whose targets return 200 on the live app (curl table).
- **Verify:** reviewer curls the 9 targets; spot-checks 3 ported headings on the app preview.

**RC-13.6 Upload package + rollback backup** · risk-safe-fix (code) · S · blocked by 13.5
- `npm run site:build` makes `site/dist/` self-contained per §5 (html, css, js, images, favicon, `robots.txt`, `sitemap.xml`, `.htaccess`), writes `site/dist/README-UPLOAD.txt` with the hPanel File Manager steps (back up `public_html` first, delete old files, upload incl. the hidden `.htaccess`, check the 5 URLs), and `site/roughcut-site.zip` for one-click Extract. `site/backup-2026-10-02/` = the current live site fetched by `curl` (10 files), committed. No CI, FTP or credentials anywhere.
- **Accept:** `npm run site:build` from a clean checkout produces `site/dist` with `.htaccess`, `robots.txt`, `sitemap.xml`, `favicon.*`, `README-UPLOAD.txt` present; `npx serve site/dist` renders the home with every asset 200 (no request leaves the folder except Google Fonts and app links); the zip lists `.htaccess`; `grep -rn "FTP\|HOSTINGER_" .github site scripts` = 0; backup files byte-match `curl` of the live pages.
- **Verify:** reviewer unzips `roughcut-site.zip` into an empty folder, serves it, and checks the 5 README URLs locally (paths); diff backup vs live.

**RC-13.7 App `/`: H1, one line, metadata/OG, JSON-LD, footer visible, "What is RoughCut?" link** · risk-safe-fix · S
- Per §7. No framer-motion import added to `/`; carousel untouched.
- **Accept:** `curl /` shows exactly one `<h1>`; `og:image` 200 at 1200×630; title ≤ 60 with the brand once; description has no "no ads"; footer present on `/`; header and footer each contain one link to `https://roughcut.com.au`; `e2e/smoke.spec.ts` and `desktop-scroll.spec.ts` pass unchanged; `/` still static in the build route table.
- **Verify:** reviewer runs both Playwright specs; 390 px screenshot showing H1 + CTA card inside the first viewport.

**RC-13.8 Owner uploads `site/dist/` to Hostinger; orchestrator verifies live** · HUMAN (upload) + verification · S · blocked by 13.6
- Owner follows `README-UPLOAD.txt` in hPanel File Manager (backup zip, delete old, upload or Extract the zip, hidden `.htaccess` included). Then the orchestrator verifies by curl. Search Console verification and sitemap submission are optional, later.
- **Accept:** `curl -I https://roughcut.com.au/` → 200 and the HTML has the new `<title>` and exactly one `<h1>`; `https://www.roughcut.com.au/` serves the same build (same ETag/length); `curl -I` on each of the 9 old URLs (`guides.html`, `guides/*.html` ×5, `rubs.html`, `wood-chart.html`, `index.html`→`/`) → 301 to a URL that returns 200; `curl -s https://roughcut.com.au/site.css | grep -c -- "--motion-base: 220ms"` = 1 (the `.htaccess` copied, and the tokens match the app); `grep -c apk` on the live HTML = 0; `robots.txt` and `sitemap.xml` return 200; Lighthouse mobile ≥ 95 ×4 on the live apex. If anything fails: owner uploads `site/backup-2026-10-02/` back (rollback) and the issue reopens.
- **Verify:** orchestrator runs the curl table live and attaches it to the issue; owner confirms the backup zip exists.

**RC-13.9 Android shell start URL + `offline.html`** · risk-safe-fix (code) + HUMAN (device) · XS · blocked by 13.7
- Per §8.
- **Accept:** `npx cap sync` succeeds; `capacitor.config.json` `server.url` ends in `/calculator?src=app`; `public/offline.html` renders with `var(--color-brand-dark)`; device (HUMAN): app opens on step 1, Back exits.
- **Verify:** config diff + a screenshot of `offline.html`; device note from the owner.

**RC-13.10 Analytics events on both domains** · risk-safe-fix · XS · **BLOCKED** by RC-0.8 (analytics deferred by owner, 2026-10-02); do not start
- When unblocked: site provider snippet only when `site.config.json` has a key; app `home_view`, `home_cta_start` with `src`/`returning`. Until then **no tracking code on either domain**.
- **Accept (later):** with no key configured, `site/dist` contains no third-party script; after RC-0.8, a `site_cta` followed by an app `calc_complete` appears in one provider with `utm_source=site`.
- **Verify (later):** orchestrator sees the two events in the provider's live view.

**Dependencies on the existing backlog:** RC-1.10 wording (disclosure, drop "no ads") before 13.4/13.7 or done inside them; RC-4.1/4.2 (D8) re-skins both via `site:build`, only OG + screenshots redone; RC-5.1 swaps the app carousel in place; RC-12.5 supplies `PLAY_URL`; RC-9.5 adds the iPhone "Add to Home Screen" line; RC-10.3 is superseded (RC-13.0).

---

**Next:** RC-13.0 (this commit), then RC-13.1 → 13.7 (code-only, no owner input needed). RC-13.8 is the owner's upload. RC-13.10 stays blocked.
