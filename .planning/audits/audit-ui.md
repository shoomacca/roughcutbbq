# RoughCut BBQ: UI, motion and brand-consistency audit

**Date:** 2026-09-30. Read-only audit. Nothing was edited, committed or deployed.
**Code audited:** `C:\Users\Corse\.antigravity\projects\RoughCut\roughcut-bbq` @ `7dc7c22` (canonical).
**Live checked:** https://roughcut-bbq.vercel.app (app), https://roughcut.com.au (marketing), https://app.roughcut.com.au (old build).
**Tags:** **[M]** = measured (I ran the command, read the line, or took the screenshot). **[G]** = guess or judgement, not verified.

### What I could not verify from here (read this first)
- **Live app ≠ canonical code.** Production runs the v2 baseline (deployed 11 Jul). It does not have the canonical repo's `cd9adaf` nav/footer changes. [M: the live footer reads "© 2026 Metric BBQ Calculator — kg & °C only" with one "Home" link (`shots/app-gallery-1440.png`). Canonical `components/Footer.tsx:18` reads "RoughCut BBQ — metric-first" and has 5 links. Live `/cook` returns 404.] Screenshots show **production**. file:line references point at **canonical**.
- **Bundle numbers come from someone else's build.** I did not run `next build` myself. Another process rebuilt `.next` at 20:51 while I was working (a `.next/lock` appeared and the chunk hashes changed under me). All chunk sizes below come from that finished build (`BUILD_ID B01x1prgTNQ4_Uhwb9nQk`, Turbopack). [M]
- **No real phone.** Mobile results come from Playwright (v1.64 from the npx cache, driving the installed Chrome) with `isMobile`, `hasTouch` and a 390×844 viewport. Nothing was installed. Real iOS Safari and Android WebView were not tested.
- **Screen readers were not tested.** The a11y section is a code read plus contrast arithmetic.

Screenshots are in `scratchpad\shots\`: `app-{home,calculator,ideas,recipes,gallery,rubs,woodchart}-{390,1440}.png`, `web-home-{390,1440}.png` and `app-header-768.png`.

---

## 1. Pros: what's good and worth keeping

1. **The token idea already exists.** `app/globals.css:3-14` declares 7 brand colours plus 2 font tokens in a Tailwind 4 `@theme`, and brand token classes are used **520 times** across `app/` and `components/` [M: grep]. Most pages *do* use `bg-brand-surface`, `text-brand-muted` and so on. The system needs finishing, not inventing.
2. **The carousel animation is well engineered.** `HeroCarousel.tsx` and `ScrollCarousel.tsx` use native scroll-snap plus one rAF-coalesced, passive scroll listener. They write `transform` and `opacity` straight to refs with no React re-render per frame, and re-render only when the centred index changes (`HeroCarousel.tsx:62-117`) [M: read]. They animate composited properties only [M]. They should feel smooth on mid-range phones [G]. The "fan of tilted cards" is the one distinctive motion signature the product has. **Keep it.**
3. **The app has no horizontal overflow at 390 px** on any of the 7 pages measured (`scrollWidth == innerWidth == 390`) [M: Playwright].
4. **framer-motion is already code-split.** Its chunk (`41c67dcca7a08fdf.js`, 126.8 KB raw / 41.9 KB gzip) is referenced **only** by `saves/page_client-reference-manifest.js` [M]. Home, calculator and results do not pay for it [M].
5. **Core text contrast is strong.** Body text `#F5F5F5` on `#1b2d1d` is **13.38:1**. Card label `#162818` on `#F2EDD7` is **13.23:1** [M: computed].
6. **The marketing site has a coherent, distinctive editorial language.** Playfair Display, Space Mono labels, hairline borders and one accent (`#f59e0b`, 9.26:1 on its bg) [M: `style.css:2-16`, computed]. It is the better-art-directed of the two surfaces [G: judgement].
7. **Unused food photography is sitting in the repo.** 13 photos in `public/images/` include `brisket.jpg` at 1400×764, which is good quality [M: viewed]. They are referenced only by the dead `HomeCarousel.tsx` [M: grep]. That is a cheap imagery upgrade.
8. **Print styles exist** (`globals.css:49-56`) for printing a cook plan [M].

---

## 2. Cons / issues (severity H/M/L)

### 2a. Visual system

| # | Sev | Issue | Where | Tag |
|---|---|---|---|---|
| V1 | **H** | **Three palettes in one app.** (1) Brand tokens: `#1b2d1d` bg, `#C0392B` red, `#E67E22` orange. (2) A Tailwind orange `#f97316`, hardcoded **17×** and used for every Shop / filter / upload button. (3) A "cream + sage" palette (`#FAF6E9` ×13, `#5A9B6A` ×8, `#1C2A1E`, `#0A150D`) used only on saves / techniques / wood-chart. The result is two different oranges next to each other, e.g. Gallery's red "Share" button beside the orange "Shop" buttons in `shots/app-gallery-1440.png`. | `app/gear/page.tsx:82,154`; `app/rubs/page.tsx:79,151`; `app/recipes/page.tsx:118`; `app/recipes/[slug]/page.tsx:94`; `app/cook/[method]/[cut]/page.tsx:252`; `components/GearRecommendation.tsx:68`; `components/gallery/UploadFlow.tsx:121,167,224,316,340`; `app/saves/page.tsx:112-230`; `app/techniques/page.tsx:9-56`; `app/wood-chart/page.tsx:145-191` | M |
| V2 | **H** | **Hardcoded colour count.** Components contain **64** hex literals, **50** `rgb()`/`rgba()` literals, **27** arbitrary `[#hex]` classes and **242** raw Tailwind palette classes (`text-white` ×59, `border-white/5,/8,/10,/15,/20,/30`, `text-red-400`, `amber-*`), against **520** brand-token classes. Roughly 1 in 3 colour decisions bypasses the tokens. Worst offenders: `HomeCarousel.tsx` (28, dead code), `techniques` (12), `saves` (10), `wood-chart` (9), `UploadFlow` (8). | grep across `app/` and `components/` | M |
| V3 | **H** | **No semantic tokens.** There is no `--surface-raised`, `--border`, `--text-subtle`, `--accent-fg`, `--danger` or `--focus`. The border colour is expressed 6 different ways (`white/5`, `/8`, `/10`, `/15`, `/20`, `brand-muted/10`, `/20`). | `app/globals.css:3-14` | M |
| V4 | M | **Six container widths.** Pages use `max-w-2xl` (home, calculator, results, recipes, rubs, gear, guides), `3xl` (cook/[m]/[c], recipes/[slug], privacy), `4xl` (cook, gallery, saves, wood-chart), `5xl` (ideas, admin), `7xl` (techniques) and `md` (auth). The header and footer are `6xl`. Content never lines up with the logo's left edge on desktop. | `components/Header.tsx:44` vs the files in the matrix (§3) | M |
| V5 | M | **H1 styles are all different.** Four families of heading: Inter `text-2xl font-bold` (recipes, rubs, gear); Inter `text-3xl` (guides, cook, recipes/[slug]); Abril via inline `style={{fontFamily}}` (gallery, saves, login, signup, wood-chart, techniques); Abril via the `font-display` class (privacy, account/delete). Sizes run from 24 px to 72 px (`techniques`: `text-5xl md:text-7xl`). Privacy's H1 is orange, unsubscribe's is amber. **Home has no H1 at all**: its main headline is an `<h2>`. | `components/home/HeroCarousel.tsx:298`; `app/recipes/page.tsx:104`; `app/gallery/page.tsx:378`; `app/techniques/page.tsx:20`; `app/privacy/page.tsx:12`; `app/unsubscribe/page.tsx:35` | M (the 24 px / 30 px / 36 px / 48 px computed sizes were measured live) |
| V6 | M | **The display font is set 10 times with inline `style={{fontFamily:'var(--font-display, Georgia, serif)'}}`** instead of the existing `font-display` utility (used 14×). | grep `fontFamily`, 10 hits | M |
| V7 | L | **The `@theme` font token references itself:** `--font-display: var(--font-display, 'Georgia', serif)`. It works only because next/font's unlayered class beats Tailwind's `@layer theme` `:root` rule. That is fragile. | `app/globals.css:13`; compiled CSS contains both declarations | M (it works live: gallery H1 computes to "Abril Fatface"); fragility [G] |
| V8 | M | **Radii and shadows have no scale.** Radii used: `rounded-xl` ×104, `lg` ×22, `full` ×20, `2xl` ×13, `3xl` ×9, `md` ×2, plain ×5. Primary buttons are `rounded-xl` in the header and gallery, `rounded-2xl` on the home CTA, and `rounded-full` on filter chips. Shadows mix Tailwind `shadow-lg/2xl` with 4 bespoke inline `boxShadow` strings. | grep counts; `HeroCarousel.tsx:282-284`; `app/gallery/page.tsx:388` | M |
| V9 | M | **Buttons: at least 4 primary-button recipes.** (a) `bg-brand-secondary hover:bg-brand-primary` (home/calculator CTA). (b) `bg-brand-primary hover:bg-brand-secondary` (header login, gallery, auth). (c) inline `#f97316` (shop, filters, SEO pages). (d) `bg-[#3A4A3E]` grey (saves empty state). Hover *swaps* red↔orange, so hovering changes the button's identity. | `HeroCarousel.tsx:311`; `Header.tsx:102`; `app/gear/page.tsx:82`; `app/saves/page.tsx:121` | M |
| V10 | M | **Emoji are the entire icon and imagery system.** About 143 emoji code points across the TSX, including category cards, recipe thumbnails and the logo "🔥". Emoji render differently per OS (Windows shows 3D Fluent, Android shows Noto) [G], so the brand looks different on every device. The live app renders **0 `<img>`** on home, calculator, recipes, ideas and gallery [M: Playwright `document.images.length`]. | `HeroCarousel.tsx:6-14`; `Header.tsx:50`; `app/recipes/page.tsx` cards | M (count), G (per-OS look) |
| V11 | L | **Dead UI code.** `components/home/HomeCarousel.tsx` (533 lines, the only real framer-motion showcase, owns the `ember-glow` keyframe) and `components/home/SeoSection.tsx` are imported nowhere. `smoke-wisp` (`globals.css:35-47`) is unused. | grep for imports: 0 hits | M |
| V12 | M | **The native shell colour doesn't match the app.** Capacitor `backgroundColor` and StatusBar are `#1a1a1a` (neutral grey), the app bg is `#1b2d1d` (green). You get a visible band or flash in the Android app [G]. `errorPath: /offline.html` does not exist in `public/`. | `capacitor.config.json`; `components/CapacitorBootstrap.tsx:18`; `ls public` = `images/`, `robots.txt` | M (mismatch, missing file), G (visual effect) |

### 2b. Motion

| # | Sev | Issue | Where | Tag |
|---|---|---|---|---|
| A1 | **H** | **No `prefers-reduced-motion` handling anywhere.** 0 hits for `prefers-reduced-motion`, `motion-safe`, `motion-reduce`, `useReducedMotion` or `MotionConfig` in source. With `reducedMotion:'reduce'` emulated, the home carousel still plays its 650 ms entrance glide: `scrollLeft` samples went 0 → 275 → 233 → 150 → 60 → 10. | grep; Playwright | M |
| A2 | **H** | **The two carousels are one ~300-line component copy-pasted.** `HeroCarousel.tsx` (318 lines) and `ScrollCarousel.tsx` (322 lines) differ only in data source, GAP (20 vs 24), scale/rotate constants (1.1/11° vs 1.08/10°) and label placement [M: `diff`]. Every motion fix has to be made twice, and the two already drift. | both files | M |
| A3 | M | **The scroll glide is a hand-rolled JS tween.** `animateScrollTo` sets `scrollLeft` every rAF with an ease-in-out quad, and duration is distance-based (300–700 ms). It turns scroll-snap off during the tween and back on at the end. If a user touches during the tween, the tween keeps fighting the finger until it ends, because nothing cancels it on `pointerdown`/`wheel` [M: `ScrollCarousel.tsx:127-150`, no cancel path]. Felt jank [G]. | `HeroCarousel.tsx:127-150`; `ScrollCarousel.tsx:127-150` | M code / G feel |
| A4 | M | **Layout reads inside the scroll handler.** `tick()` reads `offsetLeft`/`offsetWidth` for all 7–20 cards on every scroll frame. Because it writes styles in the same loop, read→write→read interleaves (write card i, then read card i+1's `offsetLeft`), which can force synchronous layout per card [G]. Card positions never change during a scroll, so they can be cached once per resize. | `ScrollCarousel.tsx:76-94` | M code / G cost |
| A5 | M | **The resize listener is not throttled,** and `useLayoutEffect` sets state on every resize event. | `HeroCarousel.tsx:21-30` | M |
| A6 | M | **Hydration mismatch on home.** `isTouch()` is evaluated during render. The server HTML contains "Double-click to start cooking" [M: the string is in the curl'd live HTML], and the mobile client removes it [M: absent in `shots/app-home-390.png`]. React re-renders the subtree on mismatch [G]. | `HeroCarousel.tsx:302` | M |
| A7 | M | **Step changes have no transition.** The calculator unmounts one carousel and mounts the next (`app/calculator/page.tsx:60-101`). The only continuity is the new carousel's entrance glide. There is no shared-element or cross-fade, so going Category → Method → Cut feels like page reloads [G]. | `app/calculator/page.tsx:60-101` | M code / G feel |
| A8 | L | **framer-motion is paid for a single accordion.** Its only live use is `/saves`, where it animates `height: 0 → 'auto'` (a layout property: a reflow per frame). The route's first-load JS is 55.3 KB gzip against 20.7 KB for `/recipes`. The framer + saves chunk is 41.9 KB gzip. The same effect is available free with CSS `grid-template-rows: 0fr → 1fr` or `<details>`. | `app/saves/page.tsx:204-238`; `.next/static/chunks/41c67dcca7a08fdf.js` | M |
| A9 | L | **`transition-all` is used 41×** (it also animates layout properties when classes change) and `hover:scale-[1.02]` on wood-chart cards. The duration vocabulary is ad hoc: 200/300/500 ms, the inline 0.2 s, 650 ms, 300–700 ms. | grep; `app/wood-chart/page.tsx:157` | M |
| A10 | L | **The carousel cards run a constant `transition: border 0.2s, box-shadow 0.2s`** while the transform is driven by rAF. A 64 px-blur box-shadow on the centred card is repainted as it changes [G: paint cost]. | `ScrollCarousel.tsx:282-285` | M code / G cost |

**Animation inventory (complete for live code)** [M: grep and read]

| Where | What | Duration / easing | Reduced-motion | Risk |
|---|---|---|---|---|
| `HeroCarousel` / `ScrollCarousel` rAF `tick` | Cards scale 0.6–1.1, rotate ±20–22°, opacity 0.2–1, by distance from centre | Frame-locked to scroll | No | Layout reads per frame (A4) |
| `animateScrollTo` | Programmatic glide to a card | 300–700 ms (distance-based), ease-in-out quad | No | Not cancellable (A3) |
| Entrance glide (both carousels) | Starts 1.4 cards right, glides to 0 | 650 ms, ease-in-out quad | **No (measured)** | Runs on every calculator step |
| Dot nav | Pill width 8→24 px | `transition-all duration-200` | No | Animates width (layout) |
| Card border/shadow | Centred card highlight | 0.2 s ease | No | Big-shadow repaint |
| `saves` accordion | framer `height 0→auto` + opacity | framer default tween | No | Layout per frame; 42 KB chunk |
| `saves` chevron / stars | `rotate-180` / `hover:scale-110` | 300 ms / default | No | Fine |
| wood-chart cards | `hover:scale-[1.02]` | `transition-all duration-300` | No | Fine |
| Skeletons / spinners | `animate-pulse`, `animate-spin` | Tailwind default | No | Fine |
| `ember-glow`, `smoke-wisp` keyframes | Ember pulse / smoke rise | 3 s / 4 s infinite | No | **Unused** (dead `HomeCarousel` only) |
| `HomeCarousel` (dead) | Springs (stiffness 280, damping 32), AnimatePresence hero swap, 3D rotateY cards | spring | No | Not shipped |

### 2c. Layout, mobile and brand

| # | Sev | Issue | Where | Tag |
|---|---|---|---|---|
| L1 | **H** | **The header breaks at tablet widths.** At 768 px the logo wraps onto 3 lines and overflows the 56 px bar, and "Cook Ideas", "Wood Chart" and "My Saves" wrap to two lines. 10 links + login appear at `md:` (768 px). Canonical adds an 11th link ("Cook Times"), which makes it worse. | `components/Header.tsx:54-108`; `shots/app-header-768.png` | M |
| L2 | M | **The mobile menu has no `aria-expanded`/`aria-controls`,** doesn't close on route change (only on link `onClick`), and has no open/close motion. | `Header.tsx:111-145` | M |
| L3 | M | **The home CTA stretches edge to edge on desktop:** the "Cook Pork →" button is 1392 px wide at 1440, with a large dead band above the carousel. | `HeroCarousel.tsx:308` (`px-6`, no max-w); `shots/app-home-1440.png` | M |
| L4 | M | **`/techniques` renders two footers and a nested `<main>`.** The page imports `<Footer/>` itself and wraps content in `<main>` inside the layout's `<main>`. Live `/techniques` HTML has 2 `<footer>` elements. It is also orphaned: not in the header or footer, only in the sitemap. | `app/techniques/page.tsx:10,96`; `app/layout.tsx:43`; `app/sitemap.ts:18` | M |
| L5 | M | **Brand name spelled 3 ways in the app.** "RoughCut BBQ" (14× in source: header, root metadata), "Rough Cut BBQ" (19×: page titles, emails, JSON-LD, affiliate disclosure, OG `siteName`) and "Metric BBQ Calculator" (live footer). Titles double the brand: live `<title>` values include "Your Cook Plan \| Rough Cut BBQ \| RoughCut BBQ" and "Cook Gallery — Rough Cut BBQ \| RoughCut BBQ". | `app/results/layout.tsx:4`; `app/gallery/layout.tsx:4`; `app/gear/layout.tsx:4`; `app/guides/layout.tsx:4`; `app/layout.tsx:22`; `lib/jsonld.ts:42`; curl of live titles | M |
| L6 | M | **Page naming is inconsistent.** Nav says "Gallery", the page H1 says "Community Cook Forum", metadata says "Cook Gallery". Nav says "Cook Times", footer says "Cooking Times". | `Header.tsx:67`; `app/gallery/page.tsx:378`; `app/gallery/layout.tsx:4`; `Footer.tsx:24` | M |
| L7 | L | **The progress bar hides step labels below `sm`,** but the connector keeps `mb-4`, which was sized for the labels. There is no `aria-current="step"`. | `components/ProgressBar.tsx:20,25` | M |

### 2d. Accessibility

Contrast computed with the WCAG 2.x formula; alpha blended onto the actual background [M].

| Pair | Ratio | Verdict | Used at |
|---|---|---|---|
| `#F5F5F5` on `#1b2d1d` (body) | 13.38 | AA | everywhere |
| `#7A9E7A` muted on `#1b2d1d` | 4.86 | AA | subtitles |
| `#7A9E7A` muted on `#1E3524` surface | **4.40** | **Fails AA normal text** | header links, footer, card text |
| muted/70 on surface | **2.91** | **Fail** | `Footer.tsx:37` affiliate disclosure |
| muted/50 on dark | **2.29** | **Fail** | `HeroCarousel.tsx:303` hint |
| white/20 on dark | **1.91** | **Fail** | placeholders (`saves/page.tsx:184`) |
| **White on `#E67E22` (main CTA)** | **2.85** | **Fail, even for large text** | `HeroCarousel.tsx:311`, `ScrollCarousel.tsx:314`, ideas, gallery |
| White on `#f97316` (Shop buttons) | **2.80** | **Fail** | 17 sites (V1) |
| White on `#C0392B` | 5.44 | AA | login button |
| `#C0392B` text on dark | **2.68** | **Fail** | ProgressBar active number (`ProgressBar.tsx:15`), Log Out text (`Header.tsx:94`) |
| `#E67E22` on surface (active nav) | 4.64 | AA | `Header.tsx:38` |
| Web: `#8e8e93` on `#09090b` | 6.10 | AA | marketing body |
| Web: `#09090b` on gold `#f59e0b` | 9.26 | AA | marketing CTA |

| # | Sev | Issue | Where | Tag |
|---|---|---|---|---|
| X1 | **H** | **The primary CTA fails contrast** (2.85:1). It is the most important button in the product. | above | M |
| X2 | **H** | **The carousels are not keyboard-operable.** Cards are `<div onClick>` with no `tabIndex`, role or key handler. There are 0 `onKeyDown` in the codebase. Dot buttons have no `aria-label` (they read as "button" ×7). There is no `aria-roledescription="carousel"`, no live region for the centred item, and the "double-click to proceed" pattern is mouse-only. The CTA button makes the flow *completable* by keyboard, but category choice via keyboard needs the unlabelled dots. | `HeroCarousel.tsx:231-238,259-266`; `ScrollCarousel.tsx:232-242,262-269`; grep `onKeyDown` = 0 | M |
| X3 | **H** | **No visible focus styles.** 0 `focus-visible:` utilities; 19 `outline-none`, all on inputs that swap to a subtle border instead. Buttons and links rely on the browser default ring, which on a dark-green bg is weak [G]. | grep | M (counts) / G (visibility) |
| X4 | M | **Only 5 `aria-*` attributes and 1 `role` in the whole app.** | grep | M |
| X5 | L | **Product images use `alt=""`** (decorative). That is acceptable only if the product name sits next to them. | `app/gear/page.tsx:37`; `app/rubs/page.tsx:36` | M (alt) / G (acceptability) |
| X6 | L | **Emoji-as-content** (e.g. "🐷" as a recipe thumbnail) is read aloud by screen readers as "pig face" [G]. | recipes, carousels | G |

---

## 3. Consistency matrix (canonical code)

Legend. Hdr/Ftr: global header and footer from `app/layout.tsx`. The footer is suppressed on `/`, `/calculator*` and `/results*` (`Footer.tsx:10`). H1 families: **I** = Inter bold; **A-inline** = Abril via inline `style`; **A-class** = Abril via `font-display` class. Btn: **S** = `bg-brand-secondary` (orange #E67E22); **P** = `bg-brand-primary` (red #C0392B); **O** = hardcoded `#f97316`; **G** = grey `#3A4A3E`. All [M] from grep/read unless marked.

| Route | Hdr / Ftr | Container | H1 | Buttons | Cards | Deviations (file:line) |
|---|---|---|---|---|---|---|
| `/` | Hdr only | `max-w-2xl` (progress), carousel full-bleed | **none** (h2, italic black) | S (hover→P) | cream `#F2EDD7` rounded-3xl, inline style | No H1 `HeroCarousel.tsx:298`; hex `:280-289`; unbounded CTA `:308` |
| `/calculator` | Hdr only | `max-w-2xl` | none (step label `<p>`) | S | same cream cards | Duplicate carousel `ScrollCarousel.tsx` (A2) |
| `/results` | Hdr only | `max-w-2xl` | print-only inline-styled H1 | P / S | `rounded-xl p-4` | Inline pt sizes `app/results/page.tsx:164` |
| `/ideas` | both | **`max-w-5xl`** | I `text-3xl md:text-4xl font-black` | S | `bg-brand-surface border-brand-muted/20 rounded-2xl p-4` | Width `IdeasClient.tsx:175`; `font-black` H1 `:176` |
| `/recipes` | both | `max-w-2xl` | I `text-2xl` | **O** chips | `rounded-xl` surface | `#f97316` `app/recipes/page.tsx:118` |
| `/recipes/[slug]` | both | **`max-w-3xl`** | I `text-3xl` | **O** | `border-white/8 rounded-xl p-5` | `app/recipes/[slug]/page.tsx:61,94` |
| `/cook` | both | **`max-w-4xl`** | I `text-3xl` | (links) | — | Width `app/cook/page.tsx:17`. **404 on live** |
| `/cook/[method]/[cut]` | both | `max-w-3xl` | I `text-3xl` | **O** | `border-white/8 rounded-xl` | `:252`; own affiliate text says "Rough Cut" `:284` |
| `/rubs` | both | `max-w-2xl` | I `text-2xl` | **O** | surface `rounded-xl`, 80 px img | `app/rubs/page.tsx:79,151` |
| `/gear` | both | `max-w-2xl` | I `text-2xl` | **O** | same as rubs | `app/gear/page.tsx:82,154` |
| `/wood-chart` | both | **`max-w-4xl`** | **A-inline**, `#FAF6E9`, 36→48 px | — | **inline `rgba(255,255,255,.03)` rounded-3xl p-6, hover scale** | `app/wood-chart/page.tsx:145,157-160,169-191` (cream palette) |
| `/techniques` | **Hdr + 2 footers** | **`max-w-7xl`** | **A-inline 48→72 px, text-shadow** | — | cream/sage hover-gradient cards | Own bg `#0A150D` `:9`; nested `<main>` `:10`; extra `<Footer/>` `:96`; not in nav |
| `/guides` | both | `max-w-2xl` (layout) | I `text-3xl` | — | — | `app/guides/layout.tsx:10` |
| `/gallery` | both | **`max-w-4xl`** | **A-inline** | **P** (hover→S) + **O** in sidebar and upload | `rounded-2xl` surface `shadow-lg` | `app/gallery/page.tsx:374,378,388`; `GearRecommendation.tsx:68`; `UploadFlow.tsx:100` bg `#1a2818` |
| `/saves` | both | **`max-w-4xl`** | **A-inline `#FAF6E9`** | **G** grey | **`#1C2A1E` rounded-2xl, sage accents** | `app/saves/page.tsx:112-230` (whole page off-token) |
| `/login` | both | `max-w-md` | **A-inline** | P | `rounded-3xl p-8` | `app/login/page.tsx:64,67` |
| `/signup` | both | `max-w-md` | **A-inline** | P | `rounded-3xl p-8` | `app/signup/page.tsx:77,80` |
| `/privacy` | both | **`max-w-3xl`** | **A-class, orange, `font-extrabold`** | — | — | `app/privacy/page.tsx:12`. **404 on live** [M: curl today; `/account/delete` also 404] |
| `/account/delete` | both | `max-w-md` | A-class | P | `rounded-3xl p-8` red border | `app/account/delete/page.tsx:83,88` |
| `/unsubscribe` | both | `max-w-md` | I, **amber-400** | — | — | `app/unsubscribe/page.tsx:35` |
| `/admin` | both | `max-w-2xl` | I `text-2xl` (no colour class) | — | surface `rounded-xl` | `app/admin/page.tsx:7-10` |
| `/admin/gallery` | both | **`max-w-5xl`** | I `text-xl` / `text-2xl` | **O** | — | Own bg `#0d1208` `:92`; `#f97316` `:107` |
| `/admin/gear` | both | `max-w-5xl` | I `text-xl` / `text-2xl` | S / P | `rounded-2xl p-4` | 6× `transition-all` |

**Summary:** 6 container widths, 4 H1 treatments, 4 primary-button recipes, 3 palettes. The pages that match each other best are the "utility list" set: recipes, rubs, gear, guides, cook/*. The worst deviators are **saves, techniques and wood-chart**, which form a separate cream/sage design, and **gallery/upload**, which is off-palette orange plus its own modal bg. [M]

---

## 4. App vs marketing website

**Live roughcut.com.au ≠ the local marketing folder.** Live matches commit `7b96dbd` (29 Jun) byte-for-byte on `index.html`, `style.css`, `rubs.html`, `guides.html` and `wood-chart.html` [M: diff = identical after CR strip]. `Last-Modified: 29 Jun 2026 13:40:36 GMT` [M]. The folder in `scratchpad\gh-rc\marketing-website\` is HEAD `3acec80` (9 Aug, "impeccable" pass), which was **never deployed**. It swaps Inter for Sora, removes the "SECTION 0X // …" mono labels, reorders rub tags and thins the quote border [M: diff].

| Aspect | App (roughcut-bbq.vercel.app) | Marketing (roughcut.com.au, live) | Tag |
|---|---|---|---|
| Brand name | "🔥 RoughCut BBQ" (one word, emoji logo) | "Rough Cut *BBQ.*" (two words, Playfair italic, gold "BBQ.") | M |
| Background | forest green `#1b2d1d` / `#1E3524` | near-black `#09090b` / `#111114` | M |
| Accent | red `#C0392B` + orange `#E67E22` (+ stray `#f97316`) | gold `#f59e0b` + red `#dc2626` | M |
| Display type | Abril Fatface (used on ~half the H1s) | Playfair Display 700 (all headings) | M |
| Body type | Inter | Inter (live) / Sora (undeployed folder) | M |
| Mono / labels | none | Space Mono, uppercase, 0.1em tracking | M |
| Radii | 12–24 px, pill chips | 4 px ("technical") | M |
| Container | 672–1280 px (varies) | 1080 px | M |
| Nav | 10 links + Log In, hamburger < 768 px | 3 anchor links + "Launch App", **no mobile nav at all** | M |
| Tone | Playful, casual ("Brisket? Say less.", "DIY snack game activated") | Technical, editorial ("The Art & Science of Low & Slow Smoke", "JOURNAL VOLUME 01 // METRIC SYSTEM") | M (quoted) |
| Imagery | Emoji only on core pages; 0 `<img>` | **No images at all** (0 `<img>`, no CSS `url()`) | M |
| Motion | Tilt-carousel, glides | Colour/border hover transitions (0.2–0.25 s) only | M |
| Where "Launch App" goes | n/a | `https://app.roughcut.com.au`, the **old** build (title "BBQ Cook Calculator — Free Time & Temp Guide for Any Cut") | M |
| APK button | n/a | `app.roughcut.com.au/rough-cut-bbq-debug.apk` → **404** | M |
| Mobile at 390 px | no overflow | **Horizontal overflow: document is 462 px wide.** The nav doesn't collapse (the only `@media` at 900 px doesn't touch `.nav`) and the hero title and CTAs clip | M: Playwright `scrollWidth=462`; `style.css:475` |
| Emails (3rd surface) | gray `#111827`/`#1f2937` + amber `#f59e0b` | — | M: `emails/*.tsx` |

**Bottom line:** they look like two different companies. They share only Inter and the word "BBQ". The live marketing site also sends users to the stale app and a dead APK link. [M]

---

## 5. Recommended design + motion system

### 5.1 Direction (judgement) [G]
Merge the two: keep the **app's warmth** (fire and wood, a food-first product) and adopt the **marketing site's editorial discipline**: one serif display face, a mono "data" face for times and temperatures, hairline borders, one accent. Proposed name: **"Pit Journal"**. Charcoal bg (not forest green: green reads as "garden app", and every real BBQ photo is warm-on-black, see `brisket.jpg`) and one ember accent. Use the real food photos where emoji are today.

### 5.2 Tokens (one file: `tokens.css`, plain CSS custom properties, consumed by Tailwind `@theme inline` in the app and by `style.css` on the site)

```css
:root {
  /* palette (raw) */
  --char-950:#0b0a09; --char-900:#14110f; --char-800:#1d1916; --char-700:#2a2420; --char-600:#3a322c;
  --ash-50:#f6f2ec;  --ash-300:#c9bfb3;  --ash-400:#a39888;   /* ash-400 on char-900 ≈ 7:1 [G: recompute before ship] */
  --ember-400:#ff9a3d; --ember-500:#f07a1a; --ember-600:#c85c0a;
  --smoke-500:#7d8a80;  --sage-400:#8fb996;   /* keep a nod to the current green as a secondary */
  --red-500:#e5484d; --green-500:#46a758; --amber-500:#f5a524;

  /* semantic (use ONLY these in components) */
  --bg:var(--char-900); --surface:var(--char-800); --surface-raised:var(--char-700);
  --border:rgb(255 255 255 / .08); --border-strong:rgb(255 255 255 / .16);
  --text:var(--ash-50); --text-muted:var(--ash-400); --text-subtle:var(--ash-300);
  --accent:var(--ember-500); --accent-hover:var(--ember-400);
  --on-accent:var(--char-950);            /* dark text on ember: fixes the 2.85:1 CTA */
  --danger:var(--red-500); --success:var(--green-500); --warning:var(--amber-500);
  --focus:var(--ember-400);
  --card-paper:#f2edd7; --on-paper:#162818; /* keep the cream carousel card as a signature */

  /* type */
  --font-display:'Playfair Display',Georgia,serif;
  --font-sans:'Inter',system-ui,sans-serif;
  --font-mono:'Space Mono',ui-monospace,monospace;

  /* space (4px base) */ --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-6:24px; --s-8:32px; --s-12:48px; --s-16:64px;
  /* radii */ --r-sm:6px; --r-md:10px; --r-lg:16px; --r-xl:24px; --r-pill:999px;
  /* elevation */ --shadow-1:0 1px 2px rgb(0 0 0/.4); --shadow-2:0 8px 24px rgb(0 0 0/.45); --glow-ember:0 20px 60px rgb(240 122 26/.30);
  /* layout */ --container:1120px; --container-prose:720px; --gutter:16px;

  /* motion */
  --dur-instant:100ms; --dur-fast:160ms; --dur-base:240ms; --dur-slow:400ms; --dur-scene:600ms;
  --ease-out:cubic-bezier(.2,.8,.2,1); --ease-in-out:cubic-bezier(.65,0,.35,1); --ease-spring:cubic-bezier(.34,1.56,.64,1);
}
@media (prefers-reduced-motion: reduce){ :root{ --dur-fast:0ms; --dur-base:0ms; --dur-slow:0ms; --dur-scene:0ms; } }
```
Every exact value above is a proposal. [G] Contrast must be recomputed for every text/bg pair before this ships.

### 5.3 Type scale (1.25 ratio, fluid at the top)
| Token | Size | Face | Use |
|---|---|---|---|
| `display` | `clamp(2.5rem, 6vw, 4rem)` / 1.05 | Playfair 700 | Home and marketing hero only |
| `h1` | `clamp(2rem, 4vw, 2.75rem)` / 1.1 | Playfair 700 | One per page, every page |
| `h2` | 1.75rem / 1.2 | Playfair 700 | Sections |
| `h3` | 1.25rem / 1.3 | Inter 700 | Card titles |
| `body` | 1rem / 1.6 | Inter 400 | |
| `small` | 0.875rem / 1.5 | Inter 500 | Meta |
| `label` | 0.75rem / 1.4, uppercase, 0.1em | Space Mono 700 | Section eyebrows, chips |
| `data` | 1.5–3rem tabular | Space Mono 700 | **Cook times, temps, weights**: the product's numbers |

Drop Abril Fatface: one serif, not two. [G: taste]

### 5.4 Component list (build once in `components/ui/`, then delete the inline copies)
`Button` (primary / secondary / ghost / danger × sm / md / lg; `asChild` for links) · `Chip` / `FilterChips` (replaces the 3 inline `#f97316` chip sets) · `Card` (surface / raised / paper) · `PageHeader` (eyebrow + H1 + lede; fixes V5) · `Container` (`prose` | `default` | `wide`; fixes V4) · `SiteHeader` (collapses at `lg`, not `md`; fixes L1) · `SiteFooter` · `Carousel` (**one** component replacing Hero + Scroll; keyboard + ARIA) · `Stepper` (ProgressBar with `aria-current`) · `StatBlock` (time / temp in mono) · `Accordion` (CSS grid-rows, no framer) · `Modal` / `Sheet` (SaveModal, UploadFlow) · `ProductTile` (gear / rubs / recommendation) · `EmptyState` · `Skeleton` · `Icon` (one SVG set, e.g. Lucide or a custom 20-icon BBQ set, replacing UI emoji; food emoji → photos).

### 5.5 Motion principles
1. **Motion explains state, never decorates.** Three jobs only: *where did I go* (step transitions), *what is selected* (carousel focus), *what changed* (result reveal, timers).
2. **Durations:** micro (hover, press) 100–160 ms; component (accordion, chip, menu) 240 ms; scene (step change, results reveal) 400–600 ms. Nothing over 600 ms except the entrance glide, which should drop from 650 ms to ≤ 450 ms. [G]
3. **Easing:** `--ease-out` for entering, `--ease-in-out` for moving between positions, `--ease-spring` only on the carousel's centred card and on press feedback.
4. **Only `transform`, `opacity` and `filter`.** No `height`/`width` tweens (fixes A8 and the dot `transition-all`), no `transition-all`.
5. **Signature moment:** keep the tilted-card fan, driven by **CSS scroll-driven animations** (`animation-timeline: view(inline)`) where supported, with the existing rAF path as fallback. That removes per-frame JS on Chromium [G: support on Android WebView and iOS 18+ to be confirmed].
6. **Step transitions:** the View Transitions API (the repo has a `vercel-react-view-transitions` skill; React 19 `<ViewTransition>`), cross-fading the carousel and morphing the chosen card into the next step's header chip. [G: feasibility]
7. **Reduced-motion policy:** under `prefers-reduced-motion: reduce`, set all `--dur-*` to 0. The carousel does no entrance glide, no rotate/scale (opacity-only centre highlight), and uses instant `scrollTo`. Wrap the app in `<MotionConfig reducedMotion="user">` if framer stays. Also provide an in-app toggle stored per user. Acceptance test: Playwright with `reducedMotion:'reduce'` shows no `scrollLeft` change after load.
8. **Budget:** no animation library on the critical path (home, calculator, results). framer-motion is allowed only if lazy-loaded with `LazyMotion` + `domAnimation`. Better: remove it (its only live use is replaceable with CSS).

### 5.6 One system for app and marketing site: options

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. Move marketing into the Next app as routes** (`/`, `/guides/*`, `/rubs`, `/wood-chart` already exist in the app) and 301 `roughcut.com.au/*` to them | Delete the Hostinger site; port the 5 journal guides into the app's MDX guides; landing hero becomes the app's `/` or `/about` | **One codebase, one deploy, one header/footer, zero drift.** SEO consolidates on one domain (the app already has 257 `/cook/*` pages). Fixes the dead APK link and the stale app link at once. Matches BLUEPRINT D1's recommendation | Needs D1 decided. Loses the Hostinger hosting (probably fine). The app home must then serve both "landing" and "start the calculator" jobs [G] |
| **B. Shared `tokens.css`** (+ a small `components.css` for `.btn`, `.card`, `.chip`) published from the app (`/brand/tokens.css` on Vercel) and `<link>`ed by the static site | App's Tailwind `@theme inline { --color-bg: var(--bg) … }` maps to the same vars | Cheap. Keeps the static site. Colours, type and radii sync automatically | Markup still duplicated (header, footer, nav drift again). Two deploys. Cross-origin CSS makes the site depend on the app's uptime (or copy on build). Components can't be shared |
| **C. Design-system package** (`@roughcut/ui`: tokens + React components) in a monorepo | npm workspace; the static site would need to become Astro/Next to consume React | Most "proper". Reusable for emails (react-email) and Android | Heaviest. Over-engineered for 1 registered user and ~0 traffic (BLUEPRINT §3). The static site must be rewritten anyway to consume it |

**Recommendation: A, with B's token file as the internal mechanism.** [G: judgement, based on the measured facts that the site is 6 static pages with no images, links to a stale build, has a 404 download and overflows on mobile]
Put all tokens in `app/tokens.css`, imported by `globals.css`, and use the same vars in `emails/` via a small TS export. Move the 5 journal guides into `/guides/*`. Rebuild the landing hero as the app home's top section (or `/about`). 301 the apex to the app. If the owner insists on keeping a separate static site (D1), fall back to **B**: serve `tokens.css` from the app and have the static site `<link>` it. Also copy the header/footer HTML from a single generated snippet. **C is not recommended now.**

---

## 6. Proposed issues, grouped into milestones

These slot into BLUEPRINT **M4** (4.1–4.5) and split it into three shippable milestones. Each keeps to ≤ 5 shards.

### M4a: Foundations (tokens and primitives)
| ID | Title | Scope | Acceptance criteria |
|---|---|---|---|
| UI-01 | Semantic token file | Create `app/tokens.css` per §5.2; map it into Tailwind `@theme inline`; fix the self-referencing `--font-display` | `grep -rE "#[0-9a-fA-F]{6}" app components --include=*.tsx` count goes 64 → ≤ 5 (paper card, Capacitor only); every text/bg token pair recomputed ≥ 4.5:1 and listed in a table in the PR |
| UI-02 | Fonts: one serif, add mono | Replace Abril Fatface with Playfair Display; add Space Mono via `next/font`; remove all 10 inline `fontFamily` styles | `grep fontFamily app components` = 0; every H1 computes to Playfair (Playwright check on 10 routes) |
| UI-03 | Primitives: Button, Chip, Card, Container, PageHeader | Build in `components/ui/`; replace the 4 button recipes and the 3 chip sets | `grep "#f97316"` = 0; `grep "bg-\[#"` = 0; the matrix in §3 shows one container scale (prose / default / wide) and one H1 style |
| UI-04 | Kill dead UI | Delete `HomeCarousel.tsx`, `SeoSection.tsx`, `ember-glow`, `smoke-wisp` (or re-home the ember/smoke keyframes into the new system deliberately) | `tsc --noEmit` and `next build` pass; no import references remain |
| UI-05 | Brand name and titles | One spelling (decision: "RoughCut BBQ" or "Rough Cut BBQ"); remove brand text from child `title`s so the template adds it once; fix the footer copy | `curl` titles of 10 routes: each contains the brand exactly once; `grep -E "Rough Cut\|RoughCut"` shows only the chosen form |

### M4b: Motion and the carousel
| ID | Title | Scope | Acceptance criteria |
|---|---|---|---|
| MO-01 | One `Carousel` component | Merge `HeroCarousel` + `ScrollCarousel`; cache card centres per resize (no `offsetLeft` in the scroll path); throttle resize; cancel the tween on `pointerdown`/`wheel`/`keydown` | One file; Chrome Performance trace of a 3 s fling shows no "Forced reflow" warnings; tween stops within 1 frame of a touch |
| MO-02 | Reduced-motion policy | Duration tokens → 0 under `reduce`; carousel with no entrance, no rotate/scale; `MotionConfig reducedMotion="user"` if framer remains | Playwright with `reducedMotion:'reduce'`: `scrollLeft` constant after load; no CSS animation running (`document.getAnimations().length === 0` after 1 s) |
| MO-03 | Step transitions | View Transitions between calculator steps; chosen card morphs into the step header | Transition ≤ 450 ms; disabled under reduced motion; no layout shift (CLS < 0.02 on the flow) |
| MO-04 | Remove framer-motion | Replace the `/saves` accordion with CSS `grid-template-rows` | `framer-motion` removed from `package.json`; `/saves` first-load JS drops by ≥ 30 KB gzip (baseline 55.3 KB) |
| MO-05 | Fix hydration mismatch and hint | Compute `isTouch` in an effect, or use CSS `@media (pointer:fine)` for the "double-click" hint | 0 console errors on `/` in mobile emulation; SSR HTML equals the client's first render |

### M4c: Layout, mobile, a11y, imagery
| ID | Title | Scope | Acceptance criteria |
|---|---|---|---|
| LA-01 | Responsive header | Collapse to a menu below `lg` (1024); group secondary links ("More"); `aria-expanded`/`aria-controls`; close on route change; animated sheet | At 768 / 900 / 1024 px the header height stays 56 px and the logo is 1 line (Playwright `offsetHeight`) |
| LA-02 | Carousel accessibility | Cards become `<button>`s in a `role="group" aria-roledescription="carousel"`; Left/Right keys move; Enter selects; dots labelled "Show Pork (1 of 7)"; `aria-live="polite"` announces the centred item; drop double-click-to-proceed | Full calculator flow completable with keyboard only (Playwright script); axe: 0 serious/critical on `/`, `/calculator`, `/results` |
| LA-03 | Contrast and focus | Accent buttons use dark `--on-accent` text; `focus-visible` ring token on every interactive element; fix muted-on-surface (4.40) and the /50, /70, /20 alpha texts | Every pair in §2d ≥ 4.5:1 (≥ 3:1 for ≥ 24 px); Tab through `/` shows a visible ring on every stop |
| LA-04 | Page fixes | `/techniques`: remove the extra `<Footer/>` and nested `<main>`, add to nav or delete; home gets a real H1; bound the home CTA (`max-w-md mx-auto`) | Live `/techniques` has 1 `<footer>` and 1 `<main>`; `/` has exactly 1 `<h1>` |
| LA-05 | Imagery | Use `public/images/*` via `next/image` (AVIF) for category cards / recipe thumbnails; commission the missing cuts; SVG icon set for UI glyphs | Home, recipes and ideas render real photos with meaningful `alt`; LCP image ≤ 100 KB; Lighthouse mobile Perf ≥ 95 |

### M4d: One brand across surfaces (needs decision D1)
| ID | Title | Scope | Acceptance criteria |
|---|---|---|---|
| BR-01 | Decide D1 (owner) | Option A (merge) vs B (shared tokens) per §5.6 | Decision recorded in BLUEPRINT §5 |
| BR-02 | Port journal content | 5 journal guides + rubs matrix + wood matrix into app routes, styled with the new primitives | Content parity checklist; each old URL has a target |
| BR-03 | Redirects and links | 301 `roughcut.com.au/*` → app equivalents; remove the dead APK link; point every "Launch App" at the canonical app | `curl -I` on every old URL returns 301 to a 200 page; no link to `app.roughcut.com.au` while it still serves the old build |
| BR-04 | Emails and native shell on tokens | `emails/*` colours from the token TS export; Capacitor bg/status bar = `--bg`; add `public/offline.html` in the new style | `grep "#1a1a1a"` = 0; the offline page exists and renders |
| BR-05 | (if B chosen) Static site consumes tokens | `<link>` the app's `tokens.css`; add a mobile nav; fix the 390 px overflow | Playwright 390 px: `scrollWidth == 390`; the site's colours come only from the shared vars |

---

## Appendix: commands and evidence
- Colour counts: `grep -rEo "#[0-9A-Fa-f]{3,8}\b" app components --include=*.tsx | wc -l` → 64; `rgba?\(` → 50; brand classes → 520; raw palette classes → 242; `\[#…\]` → 27. [M]
- framer usage: `grep -rn "framer-motion"` → `app/saves/page.tsx:6`, `components/home/HomeCarousel.tsx:5` (dead). Chunk mapping from `.next/server/app/saves/page_client-reference-manifest.js`. [M]
- Live marketing vs git: `git show 7b96dbd:marketing-website/<f>` diffed against the `curl` output → identical for all 5 files. [M]
- Screenshots and measurements: `scratchpad\shoot.cjs`, `scratchpad\nav.cjs` (Playwright from the npx cache + installed Chrome; nothing installed). [M]
- Contrast: WCAG relative-luminance formula in Python, alpha pre-blended onto the real background. [M]
