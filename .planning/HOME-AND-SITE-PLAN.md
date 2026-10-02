# RoughCut BBQ — Home page and explainer site: build plan

**Written:** 2026-10-02 · **Status:** plan only, nothing built · **Owner's ask:** "maybe we should have a home page that explains what its for, make it easy etc? I think we need to re-evaluate the actual website that explains this as well, so I want a build plan."

Tags: **[M]** measured (command run / line read / page fetched on 2026-10-02) · **[G]** judgement.

This plan sits inside the existing programme (`BLUEPRINT.md`, `ISSUES.md`). It replaces the thin "Landing hero on `/` or `/about`" line of RC-10.3 with a real spec, and it adds issues RC-13.x. It does not change D1 (already decided: one home at `app.roughcut.com.au`, apex redirects).

---

## 1. What exists today (discovery)

### 1.1 The app home page `/`

- `app/page.tsx` renders `ProgressBar current={1}` + `HeroCarousel` and nothing else [M]. The home page is literally step 1 of the calculator: seven emoji category cards (Pork, Beef, Chicken, Lamb, Fish, Vegetables, Jerky), a headline that changes with the centred card ("Low & slow pork glory"), and one CTA "Cook Pork →" that writes `sessionStorage.bbq_initial_cat` and pushes `/calculator` [M: `components/home/HeroCarousel.tsx:257-260`]. Desktop needs a double-click to proceed [M: `:379`].
- **No `<h1>` on the live home page** [M: `curl https://app.roughcut.com.au/ | grep -c "<h1"` → 0]. The headline is an `<h2>` [M: `HeroCarousel.tsx:364`]. Nothing on the page says what the product is.
- The footer is hidden on `/`, `/calculator/*`, `/results/*` [M: `components/Footer.tsx:10`]. So the home page has no links to guides, gear, gallery, privacy, or the Amazon disclosure.
- Two dead home components exist: `HomeCarousel.tsx` (framer-motion, "Smokemaster BBQ" branding, photo cards) and `SeoSection.tsx` (how-it-works + value props, server component). Neither is imported anywhere [M: `grep -rn "HomeCarousel\|SeoSection" app components` only hits their own files]. RC-4.4 already schedules their deletion. `SeoSection`'s copy structure (3 steps, 4 value props, cuts covered) is reusable as a starting point for the new sections.
- Screenshot of the live home at 390 px: `.planning/audits/shots/app-home-390.png` [M]. It reads as "pick an animal", not "this is a BBQ cook calculator".

### 1.2 Every route and its job [M: `find app -name page.tsx`]

| Route | Job | Metadata today |
|---|---|---|
| `/` | Calculator step 1 (category carousel) | title "RoughCut BBQ — Free BBQ & Slow Cook Calculator", desc, OG title/desc, no OG image, no H1 |
| `/calculator` | Steps: category → method → cut → weight (client, framer-motion step slide) | "BBQ Calculator — Plan Your Cook" |
| `/results` | The cook plan: times, temps, timeline, start-time, save/email/share; HowTo JSON-LD | "Your Cook Plan \| Rough Cut BBQ" (brand twice via template, wrong spelling) |
| `/cook` + `/cook/[method]/[cut]` | 257 static SEO pages (80 cuts × methods) with HowTo + FAQ + Breadcrumb JSON-LD | per page |
| `/ideas` | "What can I cook with what I have": cooker + fridge → matched cuts | yes |
| `/recipes`, `/recipes/[slug]` | 60 recipes, Recipe JSON-LD on detail | yes |
| `/guides`, `/guides/<5 slugs>` | 5 MDX guides (same 5 as the marketing site) | yes |
| `/rubs` | 31 rubs | yes |
| `/wood-chart` | wood pairing table | yes |
| `/techniques` | techniques page (double footer bug, RC-6.1) | ? |
| `/gear` | 28 affiliate gear items, `/go/[slug]` redirects | yes |
| `/gallery` | before/after community posts | yes |
| `/saves` | saved cooks (local + account) | none |
| `/login`, `/signup`, `/account/delete`, `/unsubscribe`, `/privacy` | auth + legal | partial |
| `/admin/*` | gallery moderation + gear editor | n/a |

Data: 8 categories, 80 cuts, 257 cut×method pairs, 61 recipes, 31 rubs, 28 gear items, 5 guides, 13 food photos in `public/images` [M: node count over `data/meats.json`; `grep -c slug:`; `ls public/images`].

### 1.3 "The actual website that explains this": the explainer site **exists and is live** [M]

- `https://roughcut.com.au` and `https://www.roughcut.com.au` both return **200** from **Hostinger/LiteSpeed**, `Last-Modified: 29 Jun 2026`, 10,210 bytes, title "Rough Cut BBQ — Technical Pitmaster Journal" [M: `curl -sI`]. DNS: `109.106.254.151`, `www` is a CNAME alias [M: nslookup]. `http://` 301s to `https://` [M].
- It is a 6-page static site: `index.html`, `guides.html`, `rubs.html`, `wood-chart.html`, 5 `guides/*.html`, `style.css`, no images [M: fetched HTML; audit-ui §4]. Content: hero "The Art & Science of Low & Slow Smoke", 5 guides (same titles as the app's `/guides`), 3 rub recipes, a 6-wood pairing table [M: fetched HTML]. Screenshot: `.planning/audits/shots/web-home-1440.png`.
- Its two CTAs: "LAUNCH APP" → `https://app.roughcut.com.au` (now the **new** app, since RC-0.7 moved the domain — the audit's "old build" note is out of date [M: live title matches this repo]) and "DOWNLOAD FOR ANDROID (APK)" → `app.roughcut.com.au/rough-cut-bbq-debug.apk` → **404** [M: `curl -sI` today].
- It overflows horizontally on a 390 px phone (document 462 px wide) and has no mobile nav [M: audit-ui §4, measured 2026-09-30; not re-measured today].
- Source of the live site: `../roughcutbbq-main/roughcutbbq-main/marketing-website/` (read-only; includes `images/` with the same 13 photos plus `rough_cut_bbq_hero.png`, `rough_cut_bbq_forum.png`, `example5.png`) [M: `ls -R`]. Audit-ui §4 found the live site matches git commit `7b96dbd` (29 Jun), and that a later "impeccable" pass (`3acec80`, 9 Aug) was never deployed [M: audit; not re-diffed today].
- Brand split, measured by the audit: site is "Rough Cut BBQ." (two words, Playfair Display, gold `#f59e0b` on near-black), app is "🔥 RoughCut BBQ" (one word, Inter/Abril Fatface, forest green with red/orange) [M: audit-ui §4 table; D5 later chose "RoughCut BBQ"; D8 chose charcoal + ember].
- Decision already on record: **D1 (answered 2026-10-01): `app.roughcut.com.au` is the one home; the journal site's content moves into the app and the apex redirects there** [M: BLUEPRINT §5]. RC-10.3 is the existing issue for that merge.

**Could not verify from here:** Hostinger hPanel access (who holds the login, whether the apex DNS is managed at Hostinger or at the registrar), Google Search Console data for either domain (whether the apex has any rankings worth preserving), and the Linear board state. These are owner checks and are listed in §8.

### 1.4 SEO basics today [M]

- Root layout: `metadataBase` = `NEXT_PUBLIC_SITE_URL` or `https://app.roughcut.com.au`; title template `%s | RoughCut BBQ`; OG `siteName`, `type: website`, `locale: en_AU` [M: `app/layout.tsx:49-62`]. **No OG image anywhere**; Twitter card is `summary` (no image) [M: live HTML head].
- Home: no H1 [M]. Description still says "no ads" (RC-1.10 removes that claim) [M: `app/page.tsx:8`].
- `robots.txt`: static, allows all, disallows `/admin/` and `/api/`, sitemap URL hard-coded to `app.roughcut.com.au` [M: `public/robots.txt`]. No `noindex` on `/results`, `/saves`, `/login`, `/signup` (RC-10.1 covers this).
- `app/sitemap.ts`: 16 static URLs + 257 cook pages + 61 recipes = **333 `<loc>`** live [M: `curl sitemap.xml | grep -c <loc>`]. `/` has priority 1.
- JSON-LD: HowTo (`cookPlanJsonLd`) + FAQPage + BreadcrumbList on `/cook/[method]/[cut]`; Recipe on `/recipes/[slug]`; HowTo on `/results` (a client page, so it only exists after hydration) [M: `lib/jsonld.ts`, `grep ld+json`]. **No `WebSite`/`WebApplication`/`Organization` on `/`.** RC-10.2 plans to drop HowTo.
- What Google sees first [G, from the measured sitemap priorities and content]: the 257 `/cook/*` pages are the long-tail entry points ("how long to smoke brisket"); `/` is the brand query landing. Today a brand-query visitor lands on an emoji carousel with no sentence explaining the product. There is no `/about`.
- Analytics: `trackEvent` calls exist (results, email capture, gear clicks, upload) but `lib/posthog.ts` only forwards to `window.posthog` which is **never loaded** [M: `lib/posthog.ts`; no `posthog-js` in `package.json`]. RC-0.8 is blocked on the owner's PostHog/Sentry choice [M: HANDOVER].

### 1.5 Brand and motion system to reuse (do not invent a new look) [M]

- Colour tokens (`app/globals.css` `@theme`): `--color-brand-primary #C0392B`, `-secondary #E67E22`, `-dark #1b2d1d`, `-surface #1E3524`, `-text #F5F5F5`, `-muted #7A9E7A`, `-card #F2EDD7`. Fonts: Inter (sans) + Abril Fatface (`--font-display`). **D8 will move these to charcoal + ember in RC-4.1/4.2.** The home page must be written against the token names, never raw hex, so RC-4.1 re-skins it for free.
- Motion tokens: `--motion-fast 150ms / base 220ms / slow 320ms / hero 650ms`, `--motion-dist 16px`, `--ease-out-soft / in-soft / spring`; utilities `transition-ui`, `lift`, `collapse-box`, `skeleton`; `animate-fade-in / fade-up`; scroll reveal via `components/Reveal.tsx` (SSR-visible, hydration-gated, `data-instant` above the fold); route transitions via `app/template.tsx` (React `<ViewTransition>`); one reduced-motion block; `lib/motion.ts` mirrors durations for framer-motion and provides `useCountUp` [M: files read]. Shipped in commits `e3c6836`…`7b9c07c` [M: `git log`].
- Rules from the motion work that the home page inherits: server HTML fully visible (no JS = no hidden content); framer-motion only where it animates (the home page should use **zero** framer-motion, CSS + `Reveal` only); only transform/opacity/filter animate; decorative motion drops to a fade under `prefers-reduced-motion`.

---

## 2. Audience and the job of the page

**Audience:** an Australian backyard cook with a kettle, offset, kamado, pellet smoker or just the oven, who has a lump of meat and a time they need to eat. They arrived from a Google search ("how long to smoke a pork shoulder"), a mate's share link, or the Play Store listing. Metric. Not a competition pitmaster.

**The home page's job, in order:**
1. **5-second test:** "RoughCut BBQ tells me when my meat will be done and when to start." One H1, one sentence, one visual that is obviously a cook plan.
2. **One tap to start a cook.** The primary CTA goes to the calculator. The carousel stays as the fast path for people who already know what they're cooking.
3. **Trust and depth for the scroller:** how it works, what the plan contains, real numbers, guides, gallery, gear with disclosure, app download, FAQ.
4. **Returning users feel no friction.** The carousel + "Start a cook" sit at the top of the viewport on a phone, exactly where step 1 is today. Nothing new sits above it except the H1 and one line.

**Returning-user rule (recommendation):** do **not** auto-redirect returning users to `/calculator`; it breaks the Back button, confuses shared links, and hides the new sections. Instead: (a) the hero carousel is still the first thing on screen, (b) a `localStorage` flag `rc_seen_home` (set on first visit) switches the hero copy to "Welcome back" and promotes "Resume last cook" when `lib/resultStorage` has a saved input, (c) the Android shell opens `/calculator` directly (§6). [G: judgement; measured constraint is that the carousel already works and the Playwright smoke test depends on `/` → results.]

---

## 3. Page structure with draft copy

Australian English. Plain. No "precision", "legendary", "elevate". Every section earns its place by answering a question a first-timer actually has. Sections are server components except the carousel and the FAQ accordion (`collapse-box`, CSS only).

### 3.1 Hero (above the fold, phone first)

```
H1:  Know when your BBQ will be done.
P:   Pick the cut, the cooker and the weight. RoughCut BBQ gives you cook time,
     pit temp, pull temp, rest, and the time to light the fire. Free, metric,
     made in Australia.
CTA (primary, full width on phone):  Start a cook →   (→ /calculator)
Secondary text link:                 See a sample plan  (→ /cook/smoker/pork-shoulder)
```
Below the copy: the **existing `HeroCarousel`**, unchanged in behaviour, with its own CTA relabelled "Cook {Pork} →" (keep). Order on phone: H1 → one line → primary CTA → carousel. On desktop: two columns, copy left, carousel right. Keep `ProgressBar` **off** the home page (it is a calculator affordance; it returns on `/calculator`).

Optional trust line under the CTA, only if the tally endpoint is wired: "{n} cooks planned" via the existing `TallyCounter` [M: component exists, used by the dead `HomeCarousel`].

### 3.2 How it works (3 steps)

```
H2: Three taps, one plan.
1. Pick the cut.        Pork, beef, chicken, lamb, fish, veg, jerky: 80 cuts.
2. Pick the cooker.     Smoker, kettle, kamado, oven, slow cooker and more.
3. Enter the weight.    Get the full plan: times, temps and when to start.
```
Each step shows a small screenshot or the real step UI card (reuse the `brand-card` style). `Reveal` with stagger.

### 3.3 What you get (the plan, shown as a real example)

Render a real `calculateCook()` output for `smoker / pork shoulder / 4 kg` server-side, as a static "sample plan" card using the results page's StatBlock styling:

```
H2: Your plan, not a guess.
Cook time ~ 15 h 24   ·   Pit 110 °C   ·   Pull at 95 °C   ·   Rest 60 min
Start at 1:30 am to eat at 5:00 pm.
Plus: when to wrap, when the stall hits, which rub and wood suit it,
and the gear worth owning. Save it, email it, or print it for the shed wall.
```
Those are today's real engine numbers [M: `calculateCook({smoker, pork, pork_shoulder, 4 kg})` → 15.4 h, 110 °C, 95 °C, 60 min]. The 15.4 h is the known linear-model over-estimate (BLUEPRINT §3; RC-3.4 fixes it), which is exactly why the card must read from the engine and never hard-code: when RC-3.4 lands, the home page is right the same day. If the owner would rather not show a number that is currently wrong, RC-13.2 can use a cut whose model is sane today (e.g. spatchcock chicken) and switch to pork shoulder after RC-3.4. Link: "Plan this cook →" (`/results?method=smoker&cat=pork&cut=pork_shoulder&kg=4`, the URL path already supported [M: `app/cook/[method]/[cut]/page.tsx` builds `resultsHref` this way]).

### 3.4 Featured cooks (6 tiles)

```
H2: Start with a classic.
Brisket · Pulled pork · Pork ribs · Spatchcock chicken · Lamb shoulder · Hot-smoked salmon
```
Each tile: real photo from `public/images` (brisket.jpg, pulled-pork.jpg, ribs.jpg, chicken.jpg, fish.jpg; lamb has no photo, list it for RC-6.3), the cook time at a reference weight, link to `/cook/smoker/<cut>`. These are the 257-page cluster's front door, which is the main SEO internal-linking win on the page.

### 3.5 Guides and recipes

```
H2: Learn the bits that matter.
Brisket from trim to rest · The stall, explained · How long to smoke ribs ·
Spatchcock chicken · Using a meat thermometer                 All guides →
Recipes: 60 tested cooks, from Texas pulled pork to smoked cauliflower.  All recipes →
```
Five guide rows (existing `/guides` data) + one recipes link. No new content needed.

### 3.6 Community gallery

```
H2: Before and after.
Post your cook, see what other backyards are turning out.    See the gallery →
```
Three latest public posts from `gallery_with_counts` (server fetch, cached 10 min; empty state: "Be the first to post a cook"). Drop this section if the gallery has fewer than 3 public posts at launch [G: an empty gallery hurts more than no section].

### 3.7 Gear (with disclosure)

```
H2: Gear we'd actually buy.
A thermometer first, then everything else.                     See all gear →
(paid links) As an Amazon Associate, RoughCut BBQ earns from qualifying purchases.
```
Three items via the existing catalogue (`GEAR` today, `getCatalog()` after RC-2.2; "Pitmaster Box"/home-banner placement after RC-8.1). Disclosure sentence lives in the section, not just the footer, per RC-1.10.

### 3.8 App download

```
H2: Take it to the pit.
RoughCut BBQ on Android. Same calculator, in your pocket.   [Get it on Google Play]
```
**Hidden until RC-12.5 publishes the Play listing** (feature flag `NEXT_PUBLIC_PLAY_URL`; section renders only when set). No APK links. iOS: not in scope; "Add to Home Screen" instructions once RC-9.5 ships the PWA manifest.

### 3.9 FAQ (5 questions, FAQPage JSON-LD)

```
Is it free?                 Yes. No account needed. An account only saves your cooks.
Is it metric?               Yes. Kilograms and degrees Celsius only.
How accurate is it?         It is a planning estimate from published cook ranges. Always
                            cook to internal temperature, not the clock; the plan tells
                            you both.
Which cookers?              Smoker, charcoal kettle, kamado, oven, slow cooker, pressure
                            cooker, wood fire, rotisserie, dehydrator.
Can I plan backwards?       Yes: set "eat at" and it tells you when to start.
                            (ship this answer only after RC-3.5)
```
`collapse-box` accordion, CSS only, keyboard accessible.

### 3.10 Footer

Show the existing `Footer` on `/` (remove `/` from the hide list in `Footer.tsx:10`). Add Privacy, Terms, Disclosure links (RC-1.10) and the Amazon sentence it already has.

**Cut, deliberately:** a testimonials block (no real ones), a "trusted by" row, a newsletter signup (the email capture already lives on results, where intent is), a pricing section (it's free), an about-the-founder block (can be a short line in the footer later).

---

## 4. What happens to the hero carousel

Options considered:
- **A. Keep it as the hero's interactive element on `/`** (recommended).
- B. Move it to `/calculator` step 1 only; the home hero becomes copy + a button.
- C. Both: a static image of the carousel on `/`, the real one on `/calculator`.

**Recommend A.** Measured reasons: the carousel is the brand's signature motion and is called out as the one thing to keep in the UI audit [M: BLUEPRINT §2, audit-ui §1]; the Playwright smoke test and `desktop-scroll.spec.ts` drive `/` through it [M: `e2e/*.spec.ts` `goto('/')`]; `CategoryStep` on `/calculator` already renders the same carousel for direct visits [M: `app/calculator/page.tsx` free mode]; so keeping it on `/` adds no new component. Judgement: returning users lose nothing because step 1 is still on screen; first-timers gain the H1 and the CTA above it. RC-5.1's merged, keyboard-accessible Carousel replaces it in place later.

Two changes to it: drop the desktop double-click-to-proceed hint (RC-5.1 already plans this; on the home page the button is the way), and the headline under the card becomes an `<h2>`-less `<p>` so the page has exactly one H1 and the section H2s read in order.

---

## 5. The explainer website: recommendation

**(a) The app's home page IS the marketing site; `roughcut.com.au` and `www` 301 to `https://app.roughcut.com.au`.** This is D1, already decided, and the measurements back it:

| Factor | Measured | Effect |
|---|---|---|
| Content overlap | The site's 5 guides, rubs and wood chart already exist as app routes [M: `app/guides/*`, `/rubs`, `/wood-chart`] | Nothing to port except 3 "measured by parts" rub recipes and the 6-row wood copy, if the app's versions are weaker (check in RC-13.6) |
| Cost | Hostinger hosting fee vs $0 on the existing Vercel project | Saves the hosting line; one less login |
| SEO | Two domains split authority; the apex site has 6 pages and no images, the app has 333 URLs [M] | 301s hand any apex equity to the app; one sitemap, one Search Console property |
| Maintenance | Static HTML with a hand-edited nav that already drifted (dead APK link, mobile overflow) [M] | One codebase, one header/footer, CI visual snapshots |
| Brand | Two brands today (name, colour, font) [M: audit-ui §4] | One |

(b) A separate site is only worth it if the owner wants editorial content on a CMS that non-developers edit. Nothing in the backlog asks for that. **If** the owner wants to keep the apex as the "front door" URL, the cheaper variant is: point the apex at Vercel as a domain on the same project and make **`roughcut.com.au` canonical** with `app.` redirecting to it. That is a bigger change (every canonical, sitemap, OG, the Capacitor `allowNavigation`, Supabase auth redirect URLs) and is listed as the one open question that changes the plan (§8 Q1).

Redirect map for RC-13.7 (every live apex URL, measured from the fetched HTML):

| Old | New |
|---|---|
| `/`, `/index.html` | `/` |
| `/guides.html`, `/#guides` | `/guides` |
| `/guides/<slug>.html` (5) | `/guides/<slug>` (same slugs [M]) |
| `/rubs.html`, `/#rubs` | `/rubs` |
| `/wood-chart.html`, `/#wood-chart` | `/wood-chart` |
| `/style.css`, anything else | `/` |

---

## 6. SEO plan

- **Titles/descriptions** (RC-4.5 owns the template; this plan sets the home values):
  - `/` title: `RoughCut BBQ: free BBQ and smoker cook time calculator (AU, metric)` (≤60 chars after trimming: "Free BBQ cook time calculator, metric | RoughCut BBQ" via the template).
  - `/` description (≤155): `Pick the cut, cooker and weight. Get cook time, pit and pull temps, rest and the time to start. Free, metric, no account needed.` (no "no ads", per RC-1.10).
- **OG image:** one static `public/og/home.png` 1200×630 in the brand (D8 palette once RC-4.1 lands; until then the current tokens), plus a dynamic `app/opengraph-image.tsx` for `/cook/*` showing cut + time + temps (this overlaps RC-9.4's cook card; build the route once, use it for both). Set `twitter:card = summary_large_image`.
- **Structured data on `/`:** `WebSite` (with `potentialAction: SearchAction` only if a search page exists; it doesn't, so omit), `WebApplication` (`applicationCategory: UtilitiesApplication`, `operatingSystem: Any`, `offers: price 0 AUD`), `Organization` (name, url, logo), and `FAQPage` for §3.9. **Do not** put HowTo on `/` (Google dropped HowTo rich results in 2023; RC-10.2 already plans removal elsewhere) [G: policy knowledge, verify against current Google docs in the issue].
- **Sitemap:** `/` stays priority 1; add `/privacy`, `/terms`, `/disclosure` (after RC-1.10) at 0.3; no new URLs otherwise. `lastModified` should stop being `now()` for every URL (it tells Google nothing); use a build-time constant per content file [G].
- **robots:** unchanged by this plan; RC-10.1 makes it host-aware and adds `noindex` to results/saves/auth.
- **Internal linking from `/`:** 6 featured cook pages, 5 guides, recipes, gallery, gear, ideas, rubs, wood chart. That is every top-level route except auth/saves, and the first time the 257-page cluster gets links from the home page.
- **Page speed budget for `/`:** LCP ≤ 2.0 s on 4G mobile emulation; LCP element is the H1 text or the first carousel card (no hero photo above the fold on phone); total JS ≤ the current shared baseline (no framer-motion import on `/`); every image through `next/image` with `sizes`; CLS < 0.02 (reserve height for the carousel and the sample-plan card). Lighthouse mobile ≥ 90 now, ≥ 95 once RC-6.4's budget lands.

---

## 7. Android app

Measured: `capacitor.config.json` `server.url` is `https://roughcut-bbq.vercel.app` and `allowNavigation` lists the vercel host, `app.roughcut.com.au`, `*.supabase.co` [M]. `CapacitorBootstrap` exists but is **not mounted** anywhere [M: `grep CapacitorBootstrap app components` → only its own file]; RC-12.1 mounts it. `public/offline.html` (the `errorPath`) does not exist [M].

Changes this plan needs (small, folded into RC-13.8):
1. `server.url` → `https://app.roughcut.com.au/calculator?src=app` so the native app opens on step 1, not the marketing home. `app.roughcut.com.au` is already allowed [M].
2. Hide the marketing-only sections when running natively: `CapacitorBootstrap` (once mounted) sets `document.documentElement.dataset.native = ''`; `/` renders the hero + carousel only under `html[data-native]` (CSS `display:none` on the marketing sections, so SSR HTML stays identical and nothing hydrates differently). The "Get it on Google Play" section is always hidden natively.
3. Back button on `/calculator` step 1 in native: exit the app rather than go to `/` (the existing `backButton` listener uses `canGoBack`; starting on `/calculator` makes this correct with no code change).
4. Commit a minimal `public/offline.html` in brand tokens (RC-9.5 also wants it; do it once here).
D4 (remote shell vs offline bundle) is unchanged and still waits on RC-12.1.

---

## 8. Measurement

**Dependency: RC-0.8 (PostHog EU or Vercel Analytics) is blocked on the owner's choice** [M: HANDOVER "Blocked on Chris"]. Until it lands, the only live signal is `cook_tally` (plans created) and `gear_clicks`. Build the events now against `trackEvent` (it is a no-op until the provider loads), so the day RC-0.8 ships, the home page is measured from day one.

Events (all with `src` = `web | app`, `returning` = boolean from `rc_seen_home`):
- `home_view`, `home_cta_start` (which CTA: hero button / carousel button / sample plan / featured tile), `home_section_view` (section id, via the existing `Reveal` IntersectionObserver), `home_faq_open` (question), `home_play_click`, `home_gear_click` (slug), `calc_complete` (already fires on results).

Success criteria, 4 weeks after launch vs the 4 weeks before (baseline from `cook_tally` by day, which exists now):
- `/` → results conversion ≥ today's (no regression for returning users): plans/day per home view.
- Bounce from `/` for first-time visitors falls (needs analytics).
- Organic brand-query clicks and `/cook/*` impressions in Search Console rise after the apex 301 (needs GSC verified: RC-10.5's HUMAN step; pull it forward).
- Lighthouse mobile on `/`: Performance ≥ 90, A11y ≥ 95, SEO = 100, measured in CI (RC-6.4's budget, or a one-off `lhci` run in RC-13.9).

---

## 9. Risks and open questions for the owner

**Decisions needed (only these change the plan):**
1. **Canonical URL:** stay with `app.roughcut.com.au` (D1, this plan) or make the apex `roughcut.com.au` the canonical home and have `app.` redirect? Recommend staying with D1 now; the apex can become canonical later, but every move costs a round of 301s. Also: who holds the Hostinger login and where is the apex DNS managed? (needed for RC-13.7; `risk-prod-state`).
2. **Analytics provider** (RC-0.8): PostHog EU or Vercel Analytics. The home page's success can't be measured without it.
3. **Build the home page before or after the D8 re-skin (RC-4.1/4.2)?** This plan builds it on the current token names so the re-skin is free; the OG image is the one asset that must be redone after D8. Recommend: build now, regenerate the OG image in RC-4.1.
4. **Lamb and the Play Store section:** lamb has no photo (RC-6.3 lists it); the Play section stays hidden until RC-12.5. Both fine, just confirming nothing is expected sooner.

**Risks:**
- Playwright smoke and desktop-scroll tests start at `/` and drive the carousel; RC-13.1 must keep them green (they are the regression guard for returning users).
- Adding server fetches (gallery, tally) to `/` makes it dynamic; use `unstable_cache`/`revalidate` so `/` stays static-with-ISR and LCP doesn't wait on Supabase.
- The "no ads" claim in the current description must not be copied into the new copy (RC-1.10).

---

## 10. Issues (RC-13.x: Home page and explainer site)

Same conventions as `ISSUES.md`: size XS/S/M/L, risk tag, testable acceptance, one subagent per issue, branch `rc-13.y`, commit `feat(RC-13.y): …`. Every issue implicitly includes `tsc`, `lint`, `build`, vitest and Playwright green. Execute in this order. Linear ids to be assigned when mirrored.

**RC-13.1 Home page shell: H1, hero copy, primary CTA, carousel kept, footer shown** · risk-safe-fix · S
- `app/page.tsx`: H1 + one-line description + "Start a cook →" link to `/calculator`, then `HeroCarousel`; remove `ProgressBar` from `/`; carousel headline becomes a `<p>`; drop the double-click hint. `Footer.tsx`: show the footer on `/`.
- Returning-user flag `rc_seen_home` (localStorage, try/catch) switches hero copy to "Welcome back"; if `lib/resultStorage` has a last input, add "Resume last cook →" to `/results`.
- No framer-motion import on `/`; CSS tokens only, no raw hex.
- **Accept:** `curl /` shows exactly one `<h1>` and the H1 text; `e2e/smoke.spec.ts` and `desktop-scroll.spec.ts` pass unchanged; Playwright: first visit shows "Start a cook", second visit shows "Welcome back"; Tab reaches the CTA before the carousel; `grep -c "framer-motion" app/page.tsx` = 0.
- **Verify (reviewer):** run the two Playwright specs; load `/` at 390 px and confirm the CTA and the first carousel card are both inside the first viewport (screenshot in the PR).

**RC-13.2 Sections: how it works + sample plan from the engine** · risk-safe-fix · S · blocked by 13.1
- `components/home/HowItWorks.tsx` (server) and `components/home/SamplePlan.tsx` (server; calls `calculateCook({method:'smoker', categoryId:'pork', cutId:'pork_shoulder', weightKg:4})`), styled with the results StatBlock classes, `Reveal` stagger. "Plan this cook →" links to the `/results?…` URL.
- **Accept:** a vitest asserts the sample plan renders the same numbers as `calculateCook` for that input (no literals); Playwright: clicking "Plan this cook" lands on `/results` showing "Pork Shoulder" and 4 kg; `html[data-hydrated]` absent → sections fully visible (SSR check with JS disabled).
- **Verify:** change the fixture weight in a scratch build and confirm the card changes; JS-off screenshot.

**RC-13.3 Sections: featured cooks, guides + recipes, gear with disclosure** · risk-safe-fix · M · blocked by 13.2
- `FeaturedCooks` (6 tiles, `next/image` from `public/images`, reference-weight cook time from the engine, links to `/cook/smoker/<cut>`); `GuidesAndRecipes` (reuse the `/guides` list; export it from one module so both pages share it); `GearPicks` (3 items, catalogue source of the day: `GEAR` now, `getCatalog()` after RC-2.2; disclosure sentence + "(paid link)" per RC-1.10 wording; `rel="sponsored noopener"`).
- **Accept:** every link on `/` returns 200 (Playwright crawls all `a[href^="/"]`); each tile image has non-empty alt; 3 gear links go through `/go/<slug>`; the disclosure text is present in the section's DOM; LCP image ≤ 100 KB (`next/image` AVIF).
- **Verify:** link crawl output in the PR; `curl -sI` on the 6 cook pages.

**RC-13.4 Sections: gallery strip, FAQ accordion, Play download (flagged)** · risk-safe-fix · S · blocked by 13.3
- `GalleryStrip`: 3 latest public posts via a cached server fetch (`revalidate: 600`), hidden when < 3; `Faq`: 5 Q/As with `collapse-box`, one open at a time optional, keyboard operable; `AppDownload`: renders only when `NEXT_PUBLIC_PLAY_URL` is set, never links an APK.
- **Accept:** with an empty gallery the strip is absent and `/` still returns 200; FAQ toggles by keyboard (Enter/Space) and `aria-expanded` flips; `NEXT_PUBLIC_PLAY_URL` unset → no "Google Play" text in HTML; `/` is static/ISR (build output shows ○ or ◐, not ƒ).
- **Verify:** `npm run build` route table in the PR; axe on `/`: 0 serious.

**RC-13.5 SEO for `/`: metadata, OG image, JSON-LD, sitemap tweaks** · risk-safe-fix · S · blocked by 13.4
- Home title/description per §6 (brand once, no "no ads"); `public/og/home.png` 1200×630 + `openGraph.images` + `twitter:card summary_large_image`; JSON-LD `WebApplication` + `Organization` + `FAQPage` (one `<script>`); sitemap `lastModified` from a per-file constant instead of `now()`.
- **Accept:** Rich Results Test valid for FAQPage on `/` (screenshot); `curl /` shows one `og:image` that returns 200 and is 1200×630; title ≤ 60 chars with the brand exactly once; `/sitemap.xml` still lists 333+ URLs.
- **Verify:** Facebook/LinkedIn debugger render; vitest for the JSON-LD builder.

**RC-13.6 Content parity with the apex site** · risk-safe-fix · S · blocked by 13.5
- Diff the live apex pages (`rubs.html`, `wood-chart.html`, 5 guides) against the app's `/rubs`, `/wood-chart`, `/guides/*`; port anything the app lacks (the 3 "parts" rub ratios, wood strength badges, any guide paragraphs). Read-only on the sibling folders; copy content into this repo only.
- **Accept:** a parity checklist in the PR with each apex heading mapped to an app URL and "present/ported"; no new routes needed.
- **Verify:** spot-check 3 headings on the live app after merge.

**RC-13.7 Apex redirect: `roughcut.com.au` + `www` → app** · risk-prod-state (DNS, Hostinger) · S · blocked by 13.6, 10.1 · needs Chris's go
- Preferred: add `roughcut.com.au` and `www` as domains on Vercel project `roughcut-bbq` with redirect to `app.roughcut.com.au` (308), plus `next.config.ts` `redirects()` for the old paths per the §5 map (host-matched). Fallback if DNS must stay at Hostinger: `.htaccess` 301 rules with the same map. Then retire the Hostinger site.
- **Accept:** `curl -I` on each of the 11 old URLs → 301/308 to a URL that returns 200; `https://www.roughcut.com.au/guides/how-to-smoke-a-brisket.html` lands on `/guides/how-to-smoke-a-brisket`; Search Console shows the apex property with a change-of-address (HUMAN).
- **Verify:** the curl table in the PR, re-run by the orchestrator after the DNS change.

**RC-13.8 Android shell opens on the calculator; native hides marketing sections; offline page** · risk-safe-fix (code) + HUMAN (device test) · S · blocked by 13.4
- `capacitor.config.json` `server.url` → `https://app.roughcut.com.au/calculator?src=app`; `CapacitorBootstrap` sets `html[data-native]` (mount it per RC-12.1, or at least export the flag-setting); CSS hides marketing sections under `html[data-native]`; commit `public/offline.html` in tokens.
- **Accept:** `npx cap sync` succeeds; with `data-native` set in DevTools, `/` shows only hero + carousel; `offline.html` renders with the brand background; on a device (HUMAN) the app opens on step 1 and Back exits.
- **Verify:** DevTools screenshot with the attribute; device note from Chris.

**RC-13.9 Home page analytics events + Lighthouse check** · risk-safe-fix · XS · blocked by 13.4 (events live only after RC-0.8)
- Emit the §8 events through `trackEvent`; `home_section_view` via the `Reveal` observer callback (one per section, once).
- **Accept:** a vitest spies `window.posthog.capture` and sees `home_view` + `home_cta_start` with `src`/`returning`; a one-off `lhci` or `npx lighthouse` mobile run on a preview URL: Performance ≥ 90, A11y ≥ 95, SEO 100 (report attached).
- **Verify:** Lighthouse JSON in the PR; after RC-0.8, the orchestrator sees `home_view` in the provider's live events.

**Dependencies on the existing backlog:** RC-1.10 (disclosure wording, remove "no ads") should land before 13.3 or be done inside it; RC-10.1 before 13.7; RC-4.1/4.2 (D8) will re-skin everything above with no structural change; RC-5.1 swaps the carousel in place; RC-8.1 later feeds `GearPicks` through the placement resolver; RC-10.3's "landing hero" line is superseded by RC-13.1–13.5 and its "301 the apex" by RC-13.7.

---

**Next:** owner answers §9 Q1–Q3, then RC-13.1.
