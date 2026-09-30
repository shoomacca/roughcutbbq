# RoughCut BBQ: code audit (read-only)

**Date:** 2026-09-30 · **Repo:** `RoughCut/roughcut-bbq` @ `7dc7c22` · **Live:** https://roughcut-bbq.vercel.app (GET only)
**Tags:** **[M]** = measured (command run, line read, or live GET shown here). **[G]** = guess or judgement, not verified.
This report does not repeat BLUEPRINT.md findings unless it has new evidence. Where a finding overlaps, it cites the blueprint item it extends.

**What I could not verify from here (you need to check):**
- The Vercel env vars on the live project, including whether `RESEND_API_KEY` is a real env var or only lives in the injected `RUNTIME_CONFIG`.
- Behaviour on a real Android device.
- Rich Results Test and Search Console.

**Side effects of this audit:** read-only SQL only (catalog queries plus `get_advisors`). Live traffic was GETs, plus one `OPTIONS` preflight to `/api/tally`, which has no side effect. One GET to `/api/og-image?url=https://github.com` made the live server fetch github.com, which proves the SSRF (S1).

**Important context [M]:** production is still the **old v2 build**. Live `/cook/smoker/pork-shoulder`, `/privacy`, `/account/delete` and `/offline.html` all return 404. So all SEO and route findings on `/cook` come from the local `.next` build, not the live site.

---

## 1. Pros (what's already good)

- **The data file is structurally clean [M]** (script in §4). Across 80 cuts and 257 cut×method pairs there are:
  - no missing per-method keys and no orphan keys;
  - no `per_kg` pair without `hoursPerKg` and no `flat` pair without `flatCookHours`;
  - no `wrapTemp > internalTemp`, no duplicate cut IDs or names, and no hyphens in IDs, so `/cook` slug round-tripping is safe.
- **Safety notes exist [M].** When the pull temp is below the cut's safe minimum (steaks, lamb, duck breast), `ResultsCard.tsx:159,244` shows a food-safety note.
- **The database is locked down [M].** RLS is on for all 9 public tables and there are 0 policies, so anon and authenticated roles get nothing. `gallery_with_counts` is `security_invoker=true`. All access goes through the server with the service key.
- **Auth primitives are sound [M]:**
  - scrypt with a per-user salt;
  - timing-safe HMAC compare;
  - production refuses to sign without `JWT_SECRET` (`lib/auth.ts:7-15`);
  - admin cookie is httpOnly and SameSite=Lax;
  - admin and user tokens are domain-separated (`admin.` prefix).
- **IDOR is handled [M].** Every saved-cook read, patch and delete is scoped `.eq('user_id', user.userId)` (`app/api/saves/route.ts:33,110,130,154`).
- **Build and types are green [M].** `tsc --noEmit` exits 0. `next build` exits 0 with 367 static pages. Lint has only the 8 errors the blueprint already lists.
- **Pages are mostly static [M].** Every page route is prerendered (○/●); only API routes and `/unsubscribe` are dynamic. Live HTML is served from the edge cache (`X-Vercel-Cache: HIT`, about 80 ms).
- **Security headers are live [M]:** HSTS with preload, nosniff, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, Referrer-Policy, Permissions-Policy.
- **`/cook` pages are genuinely data-driven [M].** They have a unique title each (0 duplicates out of 257), a canonical, and JSON-LD that is valid JSON and matches the visible FAQ.

---

## 2. Findings (sorted by severity)

| # | Sev | Area | Finding | Evidence | Tag |
|---|---|---|---|---|---|
| S1 | **H** | Security | **Unauthenticated open SSRF / fetch proxy.** `/api/og-image?url=` fetches any URL server-side with a spoofed Chrome UA and follows redirects. There is no host allowlist, no scheme check and no private-IP block. The response is cached publicly for 24 h. | `app/api/og-image/route.ts:5-17`. Live: `GET /api/og-image?url=https://github.com` returned `{"image":"https://images.ctfassets.net/…GH-Homepage-Universe-img.png"}` with `Cache-Control: public, max-age=86400`. | M |
| S2 | **H** | Security | **Next.js 16.1.6 carries a critical advisory:** RCE in the Image Optimization API with AVIF (GHSA-2xp9-vwfh-vxw4). It also has high-severity DoS, SSRF-in-rewrites and middleware-bypass advisories. `npm audit --omit=dev`: 16 vulnerabilities (1 critical, 10 high, 5 moderate). `next` is pinned to exactly `16.1.6`. | `package.json:24`, audit output in §5 | M (advisory); exploitability on Vercel-hosted image optimisation is G |
| C1 | **H** | Correctness / community | **Gallery images can't render in production.** `app/gallery/page.tsx:188-206` renders Supabase URLs through `next/image`, but `next.config.ts` has no `images.remotePatterns`. Next's host check only throws in dev (`node_modules/next/dist/shared/lib/image-loader.js:21`); in prod the optimizer rejects the host instead. | Live: `/_next/image?url=/images/brisket.jpg` returned 200, and a remote public PNG returned 400 `INVALID_IMAGE_OPTIMIZE_REQUEST`. It has never been hit only because the gallery has 0 posts. | M (config + live behaviour for remote hosts); a real Supabase object is untested (none exist) |
| A1 | **H** | Android | **`CapacitorBootstrap` is never mounted.** No file imports it (0 importers), and `app/layout.tsx` renders only Header, main and Footer. So the status-bar styling, hardware back-button handler and splash hide in `components/CapacitorBootstrap.tsx` never run. That is the "native value" story for Play. | `grep` for Capacitor across `app components lib` finds only the component itself; `app/layout.tsx:39-47` | M. What the WebView does by default without the listener is G. |
| A2 | **H** | Android | **The offline screen doesn't exist in source.** `capacitor.config.json` sets `errorPath: "/offline.html"` with `webDir: "public"`, but `public/` contains only `robots.txt` and `images/`. The only copy is in `android/app/src/main/assets/public/offline.html`, which is **git-ignored** (`android/.gitignore:96`). A fresh clone, or the next `npx cap sync`, will ship without it. | `ls public`; `git check-ignore -v` | M |
| C2 | **M** | Correctness | **A shared or `/cook` link shows the wrong cook.** `app/results/page.tsx:94-101` prefers the last result in sessionStorage over the URL params. So "Open in calculator" on any `/cook` page (`app/cook/[method]/[cut]/page.tsx:134,250`) shows the *previous* calculation if the tab has one. | Code read of both files | M (logic); not clicked in a browser |
| C3 | **M** | Correctness | **URL input isn't validated.** `?kg=` goes straight into `calculateCook`, which has no bounds (`lib/calculator.ts:43-62`); the UI's 0.1–30 kg check lives only in `WeightStep.tsx:16`. Outputs: kg=1000 renders "3850 hrs"; kg=-2 renders "-8 hrs 18 min"; kg=abc renders "NaN hrs NaN min". | `results/page.tsx:116`; §4 script plus a node run of `formatCookTime` | M |
| C4 | **M** | Correctness | **The target temperature is below the appliance temperature in 11 slow-cooker pairs.** The appliance is set to 90 °C but the pull temp is 95 °C (e.g. pork shoulder, brisket, beef cheeks), so the target can never be reached. | §4 script | M |
| C5 | **M** | Correctness | **Salmon jerky pre-heat is 63 °C.** USDA says jerky should reach 71 °C (160 °F) before drying, 74 °C for poultry. Every other jerky passes. | `data/meats.json` jerky/salmon_jerky; §4 | M (data); the right standard for fish jerky is a judgement (G) |
| C6 | **M** | Correctness | **Milestones are fixed fractions of total time.** Stall is at 0.60, wrap at 0.65, jerky check at 0.50 (`lib/calculator.ts:85,106,111,119`). At 0.5 kg pork shoulder the stall text ("plateau 1–3 hours") appears at 1.2 h into a 1.9 h cook. At 8 kg, 35 pairs exceed 24 h (beef cheeks 36 h). **"Ready at" wraps at 24 h** (`lib/timeUtils.ts:11`) with no day marker, so a 30 h cook started at 8 AM shows "Ready at 2:00 PM". Extends blueprint §4.1 (linear model) with the milestone and clock evidence. | §4 script; `timeUtils.ts:9-17` | M |
| C7 | **M** | Correctness | **The save button says "Saved!" when the API fails.** The `!saveRes.ok` branch still sets `saved` (`app/results/page.tsx:53-57`). | Code read | M |
| C8 | **M** | Data loss | **Login and signup sync wipes local history even when the sync fails.** The `/api/saves/sync` response is never checked before `localStorage.setItem('bbq_history','[]')`. | `app/login/page.tsx:39-45`, `app/signup/page.tsx:~52` | M |
| S3 | **M** | Security | **Admin login has no rate limit or lockout.** A single shared password can be brute-forced online (`app/api/admin/login/route.ts:15-44`). **Rotating `ADMIN_PASSWORD` doesn't revoke issued admin tokens**, because they're signed with `JWT_SECRET` and live 24 h (`lib/auth.ts:80-99`). Relevant to M0.1: rotate `JWT_SECRET` too, or accept up to 24 h of exposure. | Code read | M |
| S4 | **M** | Security | **Sessions can't be revoked.** User JWTs are stateless and last 30 days. Logout and account delete only clear the cookie (`api/auth/logout/route.ts:6`, `api/account/delete/route.ts:34`), and `verifyToken` never checks that the user still exists. A copied token keeps "working" after deletion: `/api/auth/me` still returns the user, and writes fail on the FK with a 500. | `lib/auth.ts:42-61` | M (code). The post-delete behaviour on a live DB is G. |
| S5 | **M** | Security / privacy | **Deleting an account keeps the user's gallery posts.** `gallery_posts.user_id` is `ON DELETE SET NULL`, so posts and photos stay public, relabelled "Anonymous Pitmaster". Comments and stars cascade. Extends blueprint M1.3 (which only mentions storage objects): the DB rows survive too. | SQL: `gallery_posts_user_id_fkey -> users on delete n` | M |
| S6 | **M** | Security | **Email enumeration:** `signup` returns `409 user_exists` (`api/auth/signup/route.ts:23-24`); `subscribe` returns `409 already_subscribed` (`api/subscribe/route.ts:83-84`). Login is also timing-distinguishable: unknown emails skip scrypt (`api/auth/login/route.ts:21`). | Code read | M |
| S7 | **M** | Security | **Weak password policy:** 6 characters minimum, no maximum, no email-format check. A non-string password (e.g. a number) makes `password.length` undefined, so it passes the check and then throws inside `scryptSync`, returning a 500. | `api/auth/signup/route.ts:9` | M |
| S8 | **M** | Security / abuse | **Subscribe sends an email to any address without confirmation, and the content is attacker-controlled.** `cut` and `method` are free strings of any length, placed into the subject and body of mail sent from the brand's domain. Unique email limits this to one send per address. There is no double opt-in. | `api/subscribe/route.ts:10-18,117-122` | M |
| S9 | **M** | Security / ops | **Unsubscribe is a side-effecting GET.** Just rendering `/unsubscribe?token=` unsubscribes (`app/unsubscribe/page.tsx:14-19`, `api/unsubscribe/route.ts:19-24`), so email link scanners will unsubscribe people. The page also calls the API over HTTP via `NEXT_PUBLIC_SITE_URL`, which defaults to `app.roughcut.com.au`. That host still serves the old build per blueprint §1, so live unsubscribes probably hit the wrong app. There is no `List-Unsubscribe` header, and someone who unsubscribed can't resubscribe (409). | Code read | M (code); where live unsubscribes land is G |
| S10 | **M** | Security | **Almost no input validation.** Only `/api/subscribe` uses zod. Other routes take unbounded free text: comments (`gallery/comments/route.ts:47-55`), upload `name`/`cut`/`method`/`gearUsed` (`gallery/upload/route.ts:18-21`), and saves/sync (unbounded array, arbitrary client JSON stored as `result_json`, `saves/sync/route.ts:20-33`). No route has a rate limit. | grep `zod` returns only subscribe | M |
| S11 | **M** | Security | **The CSP gives almost no XSS protection.** `script-src` allows `'unsafe-inline' 'unsafe-eval'`. It also allow-lists PostHog, which isn't loaded anywhere (blueprint §3). `img-src https:` is any host. | Live `curl -I /` | M |
| S12 | **M** | Security / storage | **The `gallery` bucket is public with no size or MIME limit** (`file_size_limit=null`, `allowed_mime_types=null`). Upload checks only the client-declared type (blueprint M1.2). **New evidence:** the route promises 10 MB per image, 20 MB per request, but Vercel functions cap request bodies at 4.5 MB, so ordinary phone photos will likely fail. Upload also leaves orphan objects: if the second upload or the insert fails, the first file stays (`upload/route.ts:42-73`). | SQL `storage.buckets`; code read | M (bucket, orphan logic); the 4.5 MB platform limit is G (from docs, not tested) |
| S13 | **L** | Security | **Anon can call SECURITY DEFINER RPCs.** `increment_cook_tally` and `rls_auto_enable` are executable by anon and authenticated via `/rest/v1/rpc/*` (Supabase advisor WARN ×2), and `/api/tally` POST is also unauthenticated, so the social-proof counter is trivially inflatable. | `get_advisors security` | M |
| S14 | **L** | Security | **CSRF is low risk.** The session and admin cookies are SameSite=Lax, and every state-changing route is POST, PATCH or DELETE. Login CSRF (logging a victim into the attacker's account) is still possible with a text/plain form post, because `req.json()` doesn't check Content-Type. | Cookie options at `auth/login:27-33`, `admin/login:36-42` | M (config); the text/plain parse is G |
| S15 | **L** | Security | **Non-atomic counters:** report is read-modify-write, so concurrent reports lose counts (`gallery/report/route.ts:10-21`); the star toggle ignores insert and delete errors (`star/route.ts:32,35`). `/go/[slug]` logs clicks for any slug, junk included (`go/[slug]/route.ts:20`). | Code read | M |
| S16 | **L** | Supply chain | **Build-time tools are in `dependencies`.** `react-email` pulls socket.io, ws and engine.io; `@capacitor/cli` pulls tar. These account for most of the high audit hits and only belong in devDependencies. `nanoid` is flagged high, but the advisories cover non-secure/custom generators and this code uses the default one. | `npm ls` | M |
| Q1 | **M** | Code quality | **Dead code (0 importers each):** `components/home/HomeCarousel.tsx` (533 lines), `components/home/SeoSection.tsx` (107), `lib/bbqData.ts` (230), `components/CapacitorBootstrap.tsx` (see A1), all 13 files in `public/images/*` (about 690 KB, referenced only by the dead HomeCarousel), `lib/migrations/*.sql` (MySQL era, blueprint M0.5), `setup-source.js` (blueprint M0.2) and `generate_assets.py`. `examples/` doesn't exist. | grep importer count per module | M |
| Q2 | **M** | Code quality | **Auth lookup is duplicated 8 times.** `getAuthenticatedUser()` is copy-pasted in 3 routes (`gallery/comments:6`, `gallery/star:6`, `saves:7`) and inlined in 5 more (`gallery:46-51`, `upload:55-61`, `saves/sync:7-12`, `account/delete:8-18`, `auth/me:6-16`). There is no shared `requireUser()` helper, no zod parse helper and no error helper. | grep | M |
| Q3 | **M** | Code quality | **Errors are swallowed and returned as fake success.** `GET /api/gallery` returns `{posts:[]}` on any error (`gallery/route.ts:76-79`), and so do `GET /api/gear` (`gear/route.ts:17-18`), both tally handlers (`tally/route.ts:9-10,21-22`), og-image, subscribe email sending (`subscribe/route.ts:123-126`) and the client `.catch(()=>{})` calls in the gallery page (`gallery/page.tsx:76,331,370`). An outage looks exactly like an empty site, and there's no error monitoring to notice. | Code read | M |
| Q4 | **M** | Code quality | **Configuration is read two ways.** `subscribe` and `unsubscribe` read `process.env.RESEND_API_KEY`, `EMAIL_FROM` and `NEXT_PUBLIC_SITE_URL` directly (`subscribe/route.ts:94,101,118`), while everything else uses `cfg()`. On the payload-injection deploy, a key that exists only in `RUNTIME_CONFIG` means email silently never sends. | Code read | M (code). Whether live Resend is an env var or payload-only is G. |
| Q5 | **L** | Code quality | **Gear has two sources of truth:** `data/gear.ts` (static) and the DB `gear` table (`/api/gear`, `/go/[slug]` falls back from DB to static). | `go/[slug]/route.ts:26-30` | M |
| Q6 | **L** | Code quality | **Small defects:** `useCalculator.ts:26` has a dead ternary (`pre ? 1 : 1`). `formatCookTime` renders "1 hr 60 min" or "60 min" at rounding edges; 20 per_kg cut×weight combos in 0.1–30 kg hit it (§4). localStorage history is unbounded (`resultStorage.ts:36-37`). | Code read plus script | M |
| P1 | **M** | Performance | **Every page ships 170 KB gzip (556 KB raw) of shared JS, even static text pages** like `/privacy`, the guides and `/cook/*`. The calculator adds the whole `meats.json` (134 KB raw / 33 KB gz chunk) to `/calculator`, `/results`, `/ideas` and `/saves`. Heaviest route is `/results` at 218 KB gz. The whole app ships as client components: Header, all of `/recipes`, `/rubs`, `/gear`, `/gallery` and `/saves` are `'use client'`. | §5 table | M |
| P2 | **L** | Performance | **framer-motion ships only to `/saves`** (126 KB raw / 41 KB gz chunk, used by `app/saves/page.tsx:6,206`). Its only other user is the dead HomeCarousel. Replace it with CSS and drop the dependency. | Chunk fingerprint; only `saves.html` references `41c67dcc…js` | M |
| P3 | **L** | Performance | **Uncached API calls on every page view:** Header calls `/api/auth/me` on every page (`components/Header.tsx:14`); results calls `/api/gear` and `/api/tally`; and `/gear` and `/rubs` call `/api/og-image` once *per product*, scraping Amazon on a cold cache (`app/gear/page.tsx:19`, `app/rubs/page.tsx:19`). That also slows `/gear` and risks Amazon blocking the scraper. | Code read; live `/api/tally` `no-store`, MISS | M |
| P4 | **L** | Performance | **Heavy HTML:** `/techniques` is 325 KB and `/cook` is 166 KB. | §5 | M |
| SEO1 | **M** | SEO | **robots.txt and the sitemap point at a different host,** `app.roughcut.com.au`, which still serves the old build (blueprint §1). `public/robots.txt:6` is hard-coded; `lib/seo.ts:49` and `app/layout.tsx:20` default to it. Live `/sitemap.xml` on vercel.app lists only `app.roughcut.com.au` URLs. `robots.txt` has `Disallow: /admin/`, but the route is `/admin`, which that prefix doesn't match. | Live curl of robots and sitemap | M |
| SEO2 | **M** | SEO | **Seven indexable pages use the default site title and description:** `/recipes`, `/rubs`, `/techniques`, `/wood-chart`, `/login`, `/signup`, `/saves`. The first two are `'use client'` pages, so they can't export metadata; the other two content pages simply don't. Five titles double the brand: "Your Cook Plan \| Rough Cut BBQ \| RoughCut BBQ" (results, privacy, gallery, gear, guides). Only `/cook*` and `/recipes/[slug]` have a canonical. `/results`, `/saves`, `/login`, `/signup` and `/admin` have no `noindex`. | `grep '<title>'` over `.next/server/app/*.html` | M |
| SEO3 | **M** | SEO | **The 257 `/cook` pages are near-duplicates of each other.** Pages for the same cut on different methods have a median 5-gram Jaccard of **0.71**, up to **0.91** (kamado vs smoker pork-shoulder). Body text is 337–749 words; about 28 % of a typical page is shared template. Kamado, smoker and charcoal-kettle share identical numbers for most cuts (e.g. pork_shoulder is 3.85 h/kg on all three), so those pages differ only in the method name. All 257 titles are over 60 characters (max 103). | §6 thin-content script | M (similarity). The ranking impact is G. |
| SEO4 | **L** | SEO | **JSON-LD is valid JSON but unlikely to earn rich results.** It uses HowTo and FAQPage, and Google retired HowTo rich results and limited FAQ rich results to authority sites in 2023. BreadcrumbList positions 1 and 2 share the same `item` URL (`/cook`). The HowTo says "approximately 8 hours" while the FAQ says "7 hrs 42 min" (`lib/jsonld.ts:63` rounds to the hour). | Extracted from `.next/server/app/cook/smoker/pork-shoulder.html` | M (markup); the Google policy is from memory (G), not re-checked live |
| A3 | **M** | Android | **App Links can't verify.** The manifest has `autoVerify` for `app.roughcut.com.au` and `roughcut-bbq.vercel.app` (`AndroidManifest.xml:20-26`), but `/.well-known/assetlinks.json` is 404 live and absent from `public/`. | Live curl | M |
| A4 | **L** | Android | **Release build hygiene:** `versionCode 1` / `versionName "1.0"` hard-coded; `minifyEnabled false`; `allowBackup="true"`; `allowNavigation` includes `*.supabase.co` (any project); the shell points at `roughcut-bbq.vercel.app`. The signing config silently produces an unsigned release if `key.properties` is missing (`build.gradle:21`). `key.properties` is present locally and correctly git-ignored (`.gitignore:50`). | Code read | M |
| A5 | **L** | Android | **Plugins with a remote `server.url` are untested.** Capacitor documents `server.url` as a dev/live-reload feature. Whether plugins (App, StatusBar, SplashScreen) bridge on the remote origin is still unverified (blueprint §8). The three plugins are registered in `capacitor.plugins.json`. | Config read | G |
| O1 | **M** | Ops | **No safety net at all:** no tests, no CI, no error monitoring (no Sentry or equivalent; errors go to `console.error` only), no analytics (blueprint §3), no staging environment. There is one Supabase project for everything, and no migrations reflect the live schema. | `package.json` scripts; `ls` | M |

---

## 3. Calculator correctness notes (area 1 detail)

- The model is linear per kg or flat (blueprint §4.1). **141 of 257 pairs (55 %) are `flat` and ignore weight entirely [M].** That includes whole fish, lamb rack, whole chicken and turkey crown in the slow cooker, and every pressure-cooker shoulder or leg. So a 1 kg and an 8 kg item get the same time.
- **Pressure cooker is inconsistent [M].** Brisket, chuck and rump are `per_kg` at 0.25 h/kg (0.5 kg brisket = 8 min; 8 kg = 2 h), while shoulder, leg and bolar are flat. Pressure-cooker time is governed by thickness, not mass [G].
- **Low-and-slow at 0.5 kg gives 1.4–2.3 h to a 95 °C pull [M].** For example: brisket 1.38 h, pork shoulder 1.93 h. Real small collagen cuts rarely finish that fast at 110 °C [G].
- **Twenty-four pairs pull below the cut's own `safeMinTempC` [M]:** steaks, lamb leg, kangaroo, emu, duck breast at 68 °C. The UI flags them (`ResultsCard.tsx:159`). This is intentional doneness, not a bug. Poultry pulls at 74 °C, which meets USDA but sits 1 °C under FSANZ's 75 °C consumer advice. For an AU audience, consider 75 °C or state both.
- **The data and the tips disagree for pork shoulder [M].** The tip says wrap at 68–70 °C; `wrapTempC` is 72 and `stallTempC` is 70.

---

## 4. Data-integrity script output

Script: `scratchpad/integrity.js` (mirrors `lib/calculator.ts:56-62`). Command: `node integrity.js`.

```
categories=8 cuts=80 cut-method pairs=257

## applianceTemp below target internal (target unreachable): 11
   pork/pork_shoulder slow_cooker appliance=90 internal=95
   pork/baby_back_ribs slow_cooker appliance=90 internal=93
   pork/pork_leg slow_cooker appliance=90 internal=95
   pork/spare_ribs_st_louis slow_cooker appliance=90 internal=93
   pork/country_style_ribs slow_cooker appliance=90 internal=93
   beef/brisket slow_cooker appliance=90 internal=95
   beef/beef_short_ribs slow_cooker appliance=90 internal=95
   beef/chuck_roast slow_cooker appliance=90 internal=95
   beef/beef_cheeks slow_cooker appliance=90 internal=95
   beef/oxtail slow_cooker appliance=90 internal=95
   beef/bolar_blade slow_cooker appliance=90 internal=95
## internalTemp below the cut's own safeMinTempC: 24
   beef/tomahawk_steak smoker|oven|kamado|charcoal_kettle internal=54 safeMin=63
   beef/rump_roast smoker|oven internal=57 safeMin=63
   beef/tri_tip smoker|oven internal=57 safeMin=63
   beef/picanha smoker|oven|wood_fire internal=57 safeMin=63
   beef/beef_tenderloin smoker|oven internal=54 safeMin=63
   chicken/duck_breast smoker|oven internal=68 safeMin=74
   lamb/leg_of_lamb smoker|oven|rotisserie|kamado|charcoal_kettle internal=57 safeMin=63
   game/kangaroo_rump smoker internal=60 / oven internal=58 safeMin=63
   game/emu_steak smoker internal=58 / oven internal=55 safeMin=63
## poultry internal = 74 (below FSANZ 75C advice, meets USDA): 26
   chicken/whole_chicken (5 methods), spatchcock_chicken (5), quail_whole (2), turkey_crown (5),
   whole_turkey (3), whole_duck (2), cornish_hen (2), game/pheasant_whole (2)
## POULTRY internal < 74C (USDA 165F / FSANZ 75C): 2
   chicken/duck_breast smoker internal=68
   chicken/duck_breast oven internal=68
## jerky preheatTempC < 71 (USDA 160F beef / 165F poultry): 1
   jerky/salmon_jerky preheat=63

(no hits for: missing method keys, per_kg without hoursPerKg, flat without flatCookHours,
 dead cross-mode values, wrapTemp > internalTemp, hasStall without stallTempC,
 wrap below stall, orphan keys, unknown methods, mince < 71, pork < 63)

## 15 longest computed cook times (0.5 kg and 8 kg inputs)
   beef/beef_cheeks                   smoker           per_kg     8kg ->  36.00 h  (rate=4.5)
   beef/beef_cheeks                   kamado           per_kg     8kg ->  36.00 h  (rate=4.5)
   pork/pork_knuckle                  smoker           per_kg     8kg ->  32.00 h  (rate=4)
   game/venison_shoulder_pulled       smoker           per_kg     8kg ->  32.00 h  (rate=4)
   game/venison_shoulder_pulled       kamado           per_kg     8kg ->  32.00 h  (rate=4)
   pork/pork_shoulder                 smoker           per_kg     8kg ->  30.80 h  (rate=3.85)
   pork/pork_shoulder                 kamado           per_kg     8kg ->  30.80 h  (rate=3.85)
   pork/pork_shoulder                 charcoal_kettle  per_kg     8kg ->  30.80 h  (rate=3.85)
   pork/pork_leg                      smoker           per_kg     8kg ->  30.80 h  (rate=3.85)
   pork/pork_leg                      kamado           per_kg     8kg ->  30.80 h  (rate=3.85)
   pork/pork_cheeks                   smoker           per_kg     8kg ->  30.80 h  (rate=3.85)
   pork/pork_cheeks                   kamado           per_kg     8kg ->  30.80 h  (rate=3.85)
   beef/chuck_roast                   smoker           per_kg     8kg ->  30.80 h  (rate=3.85)
   beef/chuck_roast                   kamado           per_kg     8kg ->  30.80 h  (rate=3.85)
   beef/chuck_roast                   charcoal_kettle  per_kg     8kg ->  30.80 h  (rate=3.85)

## 15 shortest per_kg cook times at 0.5 kg
   beef/brisket         pressure_cooker 0.13 h | beef/chuck_roast pressure_cooker 0.13 h
   beef/rump_roast      pressure_cooker 0.13 h | pork/pork_tenderloin oven 0.30 h
   beef/beef_tenderloin oven 0.30 h            | beef/tomahawk_steak oven 0.38 h
   beef/tri_tip         oven 0.38 h            | chicken/whole_chicken rotisserie 0.38 h
   beef/picanha         oven 0.42 h            | beef/picanha wood_fire 0.42 h
   pork/bone_in_ham     slow_cooker 0.50 h     | beef/rump_roast slow_cooker 0.50 h
   chicken/whole_chicken oven 0.50 h           | game/kangaroo_rump oven 0.50 h
   game/emu_steak       oven 0.50 h

## low-and-slow per_kg at 0.5 kg (smoker/kamado/kettle, internal >= 90C): 35 pairs, 1.38-2.25 h
   e.g. beef/brisket smoker 1.38 h, pork/pork_shoulder smoker 1.93 h, beef/beef_cheeks smoker 2.25 h

## pairs > 24 h at 8 kg: 35   > 16 h: 64
## flat-mode pairs (weight ignored entirely): 141 of 257

## formatCookTime rollover: 1.995h -> "1 hr 60 min" | 0.999h -> "60 min"
   per_kg pairs x weights 0.1..30 (step 0.1) that render "60 min": 20
## calculateCook has no weight bounds: pork_shoulder smoker kg=1000 -> 3850 h; kg=-2 -> -7.7 h; kg=NaN -> NaN
   (formatCookTime renders these as "3850 hrs", "-8 hrs 18 min", "NaN hrs NaN min")

## milestone offsets are fixed fractions of cookTimeHours (lib/calculator.ts:85,106,111,119,127):
   jerky dry-check 0.50, stall 0.60, wrap 0.65, rest/pull 1.00
   pork_shoulder smoker 6kg: total 23.1h, stall @ 13.9h, wrap @ 15.0h
   pork_shoulder smoker 0.5kg: total 1.93h, stall "1-3 hours" text shown @ 1.16h - stall duration alone exceeds whole cook
```
(Repeated lines are collapsed for length. The raw output is in `scratchpad/integrity.out`.)

---

## 5. Build table

`npm run build` exited 0 (Next 16.1.6, Turbopack): compiled in 4.5 s, 367 static pages in 2.0 s. **Next 16's Turbopack output no longer prints the size or First Load JS columns**, so I computed First Load JS per route. For each prerendered HTML file I summed every `/_next/static/*.js` it references and gzipped each chunk (script: `scratchpad/firstload.js`).

Route types from the build [M]:
- ○ static: every page
- ● SSG: `/cook/[method]/[cut]` (257 pages) and `/recipes/[slug]` (60 HTML files in `.next/server/app/recipes/`)
- ƒ dynamic: all 20 `/api/*` routes, `/go/[slug]` and `/unsubscribe`

| Route | JS chunks | JS raw KB | **JS gzip KB** | HTML KB |
|---|---:|---:|---:|---:|
| /results | 12 | 739.7 | **217.7** | 11.4 |
| /ideas | 12 | 733.8 | 215.2 | 17.1 |
| /saves | 12 | 681.1 | 211.2 | 13.0 |
| /calculator | 12 | 706.8 | 208.5 | 18.8 |
| /gallery | 11 | 593.0 | 180.6 | 14.6 |
| /recipes | 11 | 580.9 | 177.4 | 63.7 |
| /admin/gallery | 11 | 575.4 | 176.5 | 13.8 |
| /gear | 11 | 574.5 | 175.4 | 38.3 |
| /rubs | 11 | 567.1 | 173.2 | 39.2 |
| /admin/gear | 11 | 563.9 | 172.4 | 13.7 |
| / | 11 | 562.1 | 172.3 | 20.4 |
| /account/delete, /signup, /login | 11 | ~560 | ~171 | ~14 |
| /admin, /privacy, /guides/*, /cook, /cook/*, /recipes/*, /techniques, /wood-chart, /_not-found | 10 | 556.1 | **169.7** (shared baseline) | 18–325 (/techniques 324.9, /cook 166.4) |

Largest chunks [M]:
- `aee6…js`: 219 KB raw / 68.5 KB gz (react-dom)
- `a68d…js`: 134 KB / 32.7 KB (meats.json + engine)
- `41c6…js`: 127 KB / 41 KB (framer-motion; `/saves` only)
- `a6da…js` and `7d65…js`: about 110 KB / 30–39 KB each (framework and runtime)

Live caching [M] (`curl -I`):
| Resource | Headers |
|---|---|
| HTML | `public, max-age=0, must-revalidate`, `X-Vercel-Cache: HIT` |
| `/images/*` | `public, max-age=86400, stale-while-revalidate=604800` |
| `/api/*` | `no-store` |
| `/api/og-image` | overrides with `public, max-age=86400` |

Fonts use `next/font` (Inter plus Abril Fatface, self-hosted), which matches `font-src 'self'`. `next/image` is used in 4 places; `/gear` and `/rubs` use raw `<img>` for scraped Amazon images.

`npm audit --omit=dev` [M]: **16 vulnerabilities (1 critical, 10 high, 5 moderate).**
- **Direct dependencies:** next (critical; the 16.1.6 range has 29 advisories, including AVIF image-optimizer RCE, SSRF in rewrites and several middleware bypasses), nanoid (high), resend (moderate, via svix → uuid).
- **Transitive:** socket.io-parser, engine.io and ws via `react-email`; tar via `@capacitor/cli` and `@capacitor/assets`; @xmldom/xmldom; brace-expansion; fast-uri; postcss and sharp via next.

`npx eslint .`: 8 errors (the same 8 the blueprint lists). `npx tsc --noEmit`: exit 0.

---

## 6. SEO thin-content measurement (script `scratchpad/thin.js`)

```
pages=257  visible words in <main>: min=337 median=526 max=749
all-pairs 5-gram Jaccard: median=0.16 p90=0.21 p99=0.62 max=0.91  pairs>=0.5: 410 of 32896
same cut / different method: pairs=410 median=0.71 top:
   0.91 kamado/pork-shoulder <-> smoker/pork-shoulder
   0.90 kamado/brisket <-> smoker/brisket
   0.90 kamado/beef-short-ribs <-> smoker/beef-short-ribs
   0.90 kamado/pork-leg <-> smoker/pork-leg
   0.90 charcoal-kettle/pork-shoulder <-> kamado/pork-shoulder
boilerplate: 146 shingles appear on >50% of pages; avg shingles/page=526 -> ~28% shared template
duplicate <title>s among /cook pages: 0 ; title length max 103 chars; >60 chars: 257
```

**How to read it:**
- **Pages for different cuts are distinct enough.** Median similarity is 0.16.
- **The risk is within a cut.** Smoker, kamado and charcoal-kettle pages for the same cut are about 90 % the same text with the same numbers.
- **Suggested fix: merge or canonicalise them [G].** One option is to canonicalise kamado and kettle to the smoker page where the numbers are identical. The other is to make one page per cut with a method table.

---

## 7. Testing, CI and ops proposal (area 6)

**Minimal high-value suite (Vitest plus Playwright):**
1. **Engine golden tests** (`lib/calculator.test.ts`):
   - a snapshot of `calculateCook` for every one of the 257 pairs at 0.5, 2 and 8 kg;
   - invariants: time > 0 and finite; `internalTemp` ≥ `safeMin` *or* the safety note is shown; appliance ≥ internal except dehydrator; milestones in increasing order; `formatCookTime` never renders "60 min".
2. **Schema test:** zod-parse `meats.json`, which moves the §4 script into CI.
3. **API route tests:** call the route handlers directly with a mocked `getSupabase()`. Cover:
   - 401 without a session;
   - IDOR (user A can't PATCH or DELETE user B's save);
   - admin routes reject without the cookie;
   - og-image rejects non-allow-listed hosts;
   - signup and login do not enumerate;
   - kg bounds on `/results` parsing.
4. **Playwright smoke** against a preview URL:
   - home → calculator → results (pork shoulder 3 kg), checking the time text;
   - `/cook/smoker/brisket` → "Open in calculator" shows brisket (regression test for C2);
   - `/privacy` and `/account/delete` return 200;
   - `/sitemap.xml` host matches the page host;
   - zero console errors on 10 key routes.
5. **CI (GitHub Actions):** `npm ci` → `tsc` → `eslint` → `vitest` → `next build` → `npm audit --omit=dev --audit-level=high` (non-blocking at first) → Playwright on the Vercel preview.

**Ops:**
- **Error monitoring:** Sentry (Next SDK) with server and client capture. Replace the silent `return []` paths with `captureException` plus a real 5xx.
- **Logging:** keep `console.error` but make it structured (route, userId, error code). Turn on Vercel log drains if you're on a paid plan.
- **Backups:** confirm the Supabase plan's daily backups or PITR [G: plan not checked]. Also run a weekly `pg_dump` of the 9 tables plus the `gallery` bucket to a second location.
- **Environments:** today one Supabase project serves prod and local dev [M: single project ID in CLAUDE.md]. Proposal:
  - Vercel Preview for every PR, pointed at a **separate Supabase project** (free tier; simpler and cheaper than branching) or a Supabase branch;
  - schema applied from `supabase/migrations` (M0.5);
  - `NEXT_PUBLIC_SITE_URL` set per environment so canonicals and sitemaps don't leak across hosts;
  - `X-Robots-Tag: noindex` on preview and `*.vercel.app` hosts.

---

## 8. Proposed issue list (grouped into milestones)

Sizes: **S** ≤ half a day, **M** 1–2 days, **L** 3+ days. The items slot into the blueprint's milestones, and "NEW" marks work the blueprint doesn't have.

### M0+ Hotfix (do alongside or immediately after blueprint M0)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| H1 | Lock down `/api/og-image` (NEW) | Allow-list hosts (`amazon.com.au`, `amazon.com`, `amzn.to`); https only; `redirect: 'manual'` with the allow-list re-checked on each hop; cap response size. Better still, precompute the images into `gear.image_url` at admin save time and delete the route. | `?url=https://github.com` → 400; an Amazon product URL still returns an image; unit test passes | S |
| H2 | Upgrade Next.js and prune prod deps (NEW) | Bump `next` and `eslint-config-next` to the latest patched 16.x; move `react-email`, `@capacitor/cli` and `@capacitor/assets` to devDependencies; bump resend and nanoid | `npm audit --omit=dev` shows 0 critical and 0 high; build and tsc green | S |
| H3 | Fix gallery image rendering (NEW) | Add `images.remotePatterns` for `yvavflxtjzlbatrqdyai.supabase.co/storage/v1/object/public/gallery/**`, or `unoptimized` for those images | On a preview with a test post, the `/_next/image?url=<supabase obj>` request returns 200 and the image renders | S |
| H4 | Admin auth hardening (NEW, extends M0.1) | Rate-limit `/api/admin/login` (e.g. 5 per 15 min per IP via Upstash or Vercel KV); include a `pwv` (password version) claim in admin tokens, or rotate `JWT_SECRET` with the password | The 6th wrong attempt returns 429; after rotation an old admin cookie returns 401 | S |

### M1 Trust and compliance (additions to the blueprint's M1)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| T1 | Shared `requireUser()` and zod everywhere | `lib/api.ts` with `requireUser`, `requireAdmin`, `parseBody(schema)` and `errorResponse`; migrate all 20 routes; length caps (comment ≤ 1000, names ≤ 80, sync ≤ 50 items, `result_json` ≤ 16 KB) | No route calls `verifyToken` directly; oversize or invalid bodies → 400; route tests pass | M |
| T2 | Session revocation | Add a `users.token_version` column and put it in the JWT; `verifyToken` or `requireUser` checks the user exists and the version matches; logout-everywhere and delete bump it | After account delete, the old cookie makes `/api/auth/me` return `user:null` | M (S if D3 moves to Supabase Auth) |
| T3 | Account deletion removes gallery posts | Delete the user's `gallery_posts` rows and storage objects before deleting the user (or change the FK to CASCADE and add a storage cleanup) | A test user with a post: after delete, 0 rows and 0 objects | S |
| T4 | Anti-enumeration and password policy | Signup returns a generic response (or moves to D3 magic link); dummy scrypt on unknown-email login; minimum 10 characters with a breached-password check optional; type-check inputs | Signup with an existing email looks identical to a new one; login timings are within noise | S |
| T5 | Email flows done right | Double opt-in (or send only when the user has an account); cap `cut`/`method` length and allow-list them against `meats.json`; unsubscribe becomes a POST confirmation button plus a `List-Unsubscribe`/`One-Click` header; the page queries the DB directly instead of over HTTP; allow resubscribe; use `cfg()` for all email env vars | A link scanner GET doesn't unsubscribe; one-click works from Gmail; resubscribe works | M |
| T6 | Storage and RPC hardening | `gallery` bucket: 5 MB limit and MIME allow-list. Revoke anon and authenticated EXECUTE on `increment_cook_tally` and `rls_auto_enable`. Client-side image downscale to under 4 MB total per request before upload; clean up orphan uploads on failure | Supabase advisor shows 0 WARN; a 12 MP phone photo pair uploads on a preview | M |
| T7 | Real CSP | Drop `'unsafe-eval'`; nonce-based script-src (Next supports it) or at least remove the unused PostHog hosts until analytics lands; `img-src` narrowed to self, Supabase and m.media-amazon.com | No CSP violations in the console on 10 key routes; securityheaders.com grade A | M |

### M2 Engine (adds to the blueprint's M2)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| E1 | Engine input guards | `calculateCook` validates `0.1 ≤ kg ≤ 30`, finite, and the method belongs to the cut; `/results` URL parsing uses the same zod schema and redirects on failure | kg=1000, -2, abc → redirect to `/calculator`; unit tests | S |
| E2 | Shared link and `/cook` link show the linked cook | URL params win over sessionStorage when present | Regression Playwright test (C2) passes | S |
| E3 | Clock-honest timeline | `addHours` returns the day offset ("tomorrow 2:00 PM"); `formatCookTime` rounds total minutes first; the stall milestone is skipped or rephrased when the cook is shorter than about 4 h | Golden tests: 1.995 h → "2 hrs"; a 30 h cook shows "+1 day" | S |
| E4 | Data fixes from §4 | Slow-cooker appliance vs pull (use HIGH ≈ 100 °C or change the pull guidance); salmon jerky pre-heat to 71 °C; decide 74 vs 75 °C poultry for AU (FSANZ); align pork-shoulder tip and wrap temp; decide per_kg vs flat for pressure cooker consistently | The §4 script, promoted to a CI test, reports 0 issues except the documented intentional pulls below safe minimum | S |
| E5 | Save feedback truth | Show an error state when `/api/saves` fails; login/signup sync only clears local history on a 2xx | Simulated 500 → no "Saved!" shown and local history kept | S |

### M4 Performance and code health (adds to the blueprint's M4)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| P1 | Delete dead code | Remove HomeCarousel, SeoSection, `lib/bbqData.ts`, `public/images/*` (or wire them in deliberately), `generate_assets.py`, and `lib/migrations` once M0.5 lands | `knip` or `ts-prune` shows no unused exports; build green | S |
| P2 | Mount CapacitorBootstrap (or delete it) | Import it in `app/layout.tsx` (client island) | On device: back button navigates history, status bar is dark (depends on A5 verification) | S |
| P3 | Server-first pages | `/recipes`, `/rubs`, `/gear` and `/techniques` become server components with small client filter islands; Header auth state in a small island or read from the cookie server-side; drop framer-motion | Shared baseline JS below 120 KB gz; `/privacy` and `/cook/*` ≤ baseline; Lighthouse mobile Performance ≥ 95 | M |
| P4 | Stop swallowing errors | Replace `return []` fallbacks with logged 5xx plus client error states; add Sentry | A forced DB failure shows an error UI and a Sentry event | S |
| P5 | One gear source | Choose between the DB `gear` table and `data/gear.ts`; precompute product image URLs | `/gear` makes 0 calls to `/api/og-image` | S |

### M5 SEO (adds to the blueprint's M5)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| SE1 | Host-correct robots and sitemap | Generate `robots.ts` from `SITE_URL`; fix `/admin` disallow; `noindex` on results, saves, login, signup, admin and account; `X-Robots-Tag: noindex` on non-canonical hosts | Live robots and sitemap host equals the page host; the rich-results/URL-inspection tool shows the canonical | S |
| SE2 | Titles, descriptions and canonicals for every page | Metadata for recipes, rubs, techniques and wood-chart (needs P3); fix the double brand suffix; titles ≤ 60 characters; a canonical on every indexable page | 0 pages with the default title; 0 titles containing both "Rough Cut BBQ" and "RoughCut BBQ" (also D5) | S |
| SE3 | De-duplicate `/cook` | Canonicalise kamado and charcoal-kettle to smoker where the numbers are identical, or consolidate into one page per cut with a method table; add cut-specific intro copy | Same-cut Jaccard median < 0.5 (re-run `thin.js`) | M |
| SE4 | Useful structured data | Drop HowTo; keep BreadcrumbList with distinct URLs; use `Recipe` on recipe pages with `cookTime`/`totalTime`; keep FAQPage as plain markup | Rich Results Test is valid on 3 sampled pages | S |

### M8 Android (adds to the blueprint's M8)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| AN1 | Offline page in source | Add `public/offline.html` and commit it; add a check that `npx cap sync` copies it | A fresh clone plus sync has `offline.html` in the assets; airplane-mode cold start shows it | S |
| AN2 | App Links | Put `public/.well-known/assetlinks.json` with the Play App Signing SHA-256 on the canonical host only; drop vercel.app from the intent filter | `https://…/.well-known/assetlinks.json` returns 200 JSON; `adb shell pm get-app-links` shows "verified" | S |
| AN3 | Release hygiene | Version from `package.json` (or CI); fail the build if `key.properties` is missing for release; `allowBackup=false`; narrow `allowNavigation` to the project's Supabase host | `./gradlew bundleRelease` fails loudly without signing; versionCode increments in CI | S |
| AN4 | Verify plugin bridging on a remote URL (blueprint §8) | Device test of StatusBar, App and SplashScreen with `server.url` | A written result, which decides D4 | S |

### Ops (new milestone M0.6, or fold into M0.5)
| ID | Title | Scope | Acceptance criteria | Size |
|---|---|---|---|---|
| O1 | Test harness and CI | Vitest engine goldens, schema test and route tests, plus a Playwright smoke on preview (§7) | CI required on `main`; failing golden blocks merge | M |
| O2 | Staging | Vercel Preview plus a separate Supabase project seeded from migrations; per-environment `NEXT_PUBLIC_SITE_URL` | A PR preview never writes to the prod DB (verified by row counts) | M |
| O3 | Monitoring and backups | Sentry; uptime check on `/`, `/api/tally` and `/calculator`; confirm Supabase backups/PITR; weekly off-site dump | A test exception appears in Sentry; one restore drill documented | S |
