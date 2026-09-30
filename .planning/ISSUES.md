# RoughCut BBQ — Issue backlog (source of truth, mirrored to Linear)

Execute strictly in order, one issue per subagent, verified before the next starts (BLUEPRINT §7).

**Linear:** project "RoughCut BBQ — 10x" (team New Genesis, label `RoughCut BBQ`): https://linear.app/bitsbotsbytes/project/roughcut-bbq-10x-a73d51bcabb2
RC ids map 1:1 in document order to **BOTS-661 … BOTS-734** (RC-0.1 = BOTS-661, RC-1.1 = BOTS-670, RC-2.1 = BOTS-680, RC-3.1 = BOTS-684, RC-4.1 = BOTS-690, RC-5.1 = BOTS-695, RC-6.1 = BOTS-699, RC-7.1 = BOTS-704, RC-8.1 = BOTS-710, RC-9.1 = BOTS-716, RC-10.1 = BOTS-721, RC-11.1 = BOTS-727, RC-12.1 = BOTS-730, RC-12.5 = BOTS-734). Blockers are set as Linear relations.

**Labels**
- **Size:** XS <1h · S half day · M 1–2 days · L 3+ days
- **Risk:** `risk-safe-fix` (code only; runs through the subagent pipeline) · `risk-prod-state` (touches live DB, env, deploy or domains; needs Chris's go) · `HUMAN` (Chris does it) · `needs-decision`

**Refs:** `AC` = audits/audit-code.md · `AU` = audits/audit-ui.md · `AA` = audits/audit-admin.md · `RS` = audits/research-10x.md

Every code issue implicitly includes: `npx tsc --noEmit`, `npm run lint` (no new errors), `npm run build` green, and one commit `type(RC-x.y): …`.

---

## M0 — Decisions, foundation & go-live

**RC-0.1 Owner decisions D1–D8** · HUMAN · needs-decision · XS
Decide D1–D8 (BLUEPRINT §5) and record the answers in BLUEPRINT §5.
- **Accept:** all 8 answered in the file.

**RC-0.2 Rotate secrets and set Vercel env vars** · risk-prod-state · S · blocked by 0.1
- Generate a new `ADMIN_PASSWORD` + `JWT_SECRET`.
- Set them in Vercel `roughcut-bbq` along with `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`.
- Delete `NEXT_PUBLIC_ADMIN_PASSWORD`.
- Scrub the old password from `../ROUGHCUT-BBQ-REPORT.md`.

**Accept:**
- `vercel env ls` shows all vars and no `NEXT_PUBLIC_ADMIN_PASSWORD`.
- The report file no longer contains the old password.

**RC-0.3 Push canonical to GitHub and connect Vercel to git** · risk-prod-state · S · blocked by 0.2
- Per D2: create branch `archive/aug-2026` from the current GitHub `main`, then push canonical `main` (force-with-lease, with Chris's go).
- Connect Vercel `roughcut-bbq` to the repo.
- Remove `setup-source.js`, the runtime-config payload injection (`RUNTIME_CONFIG` stays empty) and the public Supabase `deploy` bucket.

**Accept:**
- A Vercel preview deployment is built from a git SHA with state READY and author `shoomacca` (not BLOCKED).
- The `deploy` bucket is gone.

**RC-0.4 Capture the live Supabase schema as migrations** · risk-safe-fix · S
- Dump the live schema into `supabase/migrations/0001_baseline.sql`: tables, `gallery_with_counts` view, `increment_cook_tally` RPC, RLS policies, the `gallery` bucket and its policies.
- Delete the stale MySQL `lib/migrations/`.

**Accept:**
- Applying the migration to an empty Supabase branch/project succeeds.
- A diff against live shows no differences.

**RC-0.5 Test harness + CI** · risk-safe-fix · M
- Add Vitest (engine goldens from the current output, a zod schema test for `meats.json`).
- Add a Playwright smoke test: home → calculator → results, `/cook/smoker/pork_shoulder`, `/gear`.
- Add a GitHub Actions workflow running tsc, lint, vitest, build and Playwright against `next start`.

**Accept:**
- CI is green on `main`.
- A deliberately broken golden fails CI.

Ref AC §7.

**RC-0.6 Staging environment** · risk-prod-state · M · blocked by 0.3, 0.4
- Create a separate Supabase project for preview/staging, seeded from the migrations.
- Point Vercel Preview env vars at it, with a per-environment `NEXT_PUBLIC_SITE_URL`.

**Accept:**
- A PR preview writes a test save.
- Prod row counts are unchanged; staging counts +1.

**RC-0.7 First production deploy of merged code + domain move** · risk-prod-state · S · blocked by 0.3, 0.5
- Promote to production.
- Move `app.roughcut.com.au`, then `bbq.bsbsbs.au`, from Vercel project `bbq-calculator` to `roughcut-bbq`, one at a time.
- Archive the `bbq-calculator` project and repo.

**Accept:**
- Live `/privacy`, `/account/delete` and `/cook/smoker/pork_shoulder` return 200 on both domains.
- The old admin password is rejected by `/api/admin/login`.
- `grep kd84` over the live JS returns 0.

**RC-0.8 Analytics, error monitoring and uptime** · risk-safe-fix · S · blocked by 0.7
- Initialise PostHog (EU host) or Vercel Analytics; wire the existing `trackEvent` calls.
- Add Sentry for client and server.
- Add an uptime check on `/`, `/calculator` and `/api/tally`.
- Confirm Supabase backups/PITR.

**Accept:**
- A test event appears in the analytics dashboard.
- A thrown test error appears in Sentry.
- Uptime shows green.

Ref AC O3.

**RC-0.9 Archive stale folders and repos** · HUMAN approval · XS · blocked by 0.7
- Per D6: zip-archive and then delete `RoughCut/roughcutbbq-main`, `roughcutbbq`, the `*.zip` downloads, `ziBAne6e`, and `projects/bbq-*`.
- Back up the keystore and `key.properties` to two places.

**Accept:** the folder list matches BLUEPRINT v1 §1 "Keep" only.

**RC-0.10 Test / demo accounts (user + admin) + seed/reset script** · risk-prod-state · S · blocked by 0.6 · Linear BOTS-735 (added 2026-09-30)
- `scripts/seed-demo.ts`, idempotent, with a `--reset` flag.
- **Demo user** `demo@roughcut.com.au` with seeded saves, gallery posts, comments and stars.
- **Demo admin** login.
- Staging gets the full data set; prod gets only the demo user, and only with Chris's go.
- `is_demo` accounts are excluded from tally, analytics and clicks, and are **never emailed**.
- Credentials are kept in Vercel env and Chris's password manager, never in the repo or Linear.
- **Accept:** Chris logs in as the demo user and as admin on staging; reset works; demo accounts are sent no email and excluded from counts. Also feeds Play "App access" (RC-12.4).

## M1 — Security & trust hotfixes

**RC-1.1 Lock down `/api/og-image`** · risk-safe-fix · S
- Host allowlist (amazon.com.au, amazon.com, amzn.to), https only, manual redirects re-checked on each hop, response size cap.

**Accept:**
- `?url=https://github.com` → 400.
- An Amazon product URL still returns an image.
- Unit test.

Ref AC H1.

**RC-1.2 Upgrade Next.js and prune production dependencies** · risk-safe-fix · S
- Bump to the latest patched 16.x.
- Move `react-email`, `@capacitor/cli` and `@capacitor/assets` to devDependencies.

**Accept:** `npm audit --omit=dev` → 0 critical and 0 high. Ref AC H2.

**RC-1.3 Gallery images render in production** · risk-safe-fix · XS
- Add `images.remotePatterns` for the project's Supabase public gallery path.

**Accept:** on a preview with a test post, `/_next/image?url=<supabase obj>` returns 200. Ref AC H3.

**RC-1.4 Shared API guard layer** · risk-safe-fix · M
- Create `lib/api.ts` with `requireUser`, `requireAdmin`, `parseBody(zodSchema)` and `errorResponse`.
- Migrate all 20 routes.
- Add length caps: comment ≤1000, name ≤80, sync ≤50 items, `result_json` ≤16 KB.

**Accept:**
- No route calls `verifyToken` directly.
- Invalid or oversize bodies → 400 (route tests).

Ref AC T1.

**RC-1.5 Rate limiting** · risk-safe-fix · S · blocked by 1.4
- Upstash/Vercel KV limiter on login, signup, admin login, upload, report, comment and subscribe.

**Accept:** the 6th rapid login from one IP → 429 (test). Ref AC H4.

**RC-1.6 Session revocation + account deletion cleanup** · risk-prod-state (migration) · M · blocked by 1.4
- Add a `token_version` column; logout-everywhere/delete bumps it.
- Deleting an account removes the user's gallery posts and their storage objects.
- (If D3 = Supabase Auth, fold into RC-7.1 and cancel this.)

**Accept:**
- After deletion, the old cookie → `/api/auth/me` returns `user:null`.
- 0 posts and 0 objects remain for that user.

Ref AC T2, T3.

**RC-1.7 Gallery moderation and upload hardening** · risk-safe-fix · M · blocked by 1.4
- The `?flagged=true` list becomes admin-only.
- One report per reporter per post (unique table); auto-hide at 3 distinct reporters.
- Uploads: magic-byte check, `sharp` resize to ≤2000 px WebP with EXIF/GPS stripped, orphan cleanup on failure.

**Accept:**
- Anonymous `GET ?flagged=true` → 401.
- 3 reports from one session hide nothing.
- The uploaded file has no EXIF (test with exiftool).

Ref AA M-F4, BLUEPRINT v1 1.0–1.2.

**RC-1.8 Email flows and anti-enumeration** · risk-safe-fix · M · blocked by 1.4
- Double opt-in.
- Unsubscribe via POST confirmation plus `List-Unsubscribe` one-click.
- Allow-list cut/method values.
- Generic signup response; dummy scrypt for unknown emails; minimum password length 10.

**Accept:**
- A GET to the unsubscribe link doesn't unsubscribe.
- Signup with an existing email looks identical to a new one.

Ref AC T4, T5.

**RC-1.9 Storage/RPC hardening + real CSP** · risk-prod-state (bucket and grants) · M
- Gallery bucket: 5 MB limit and MIME allow-list.
- Revoke anon EXECUTE on the flagged functions.
- CSP: no `unsafe-eval`, nonce or trimmed `script-src`, `img-src` narrowed.

**Accept:**
- Supabase advisor shows 0 WARN.
- No CSP violations on 10 routes.
- securityheaders.com grade A.

Ref AC T6, T7.

**RC-1.10 Legal and disclosure pages** · risk-safe-fix · S · needs-decision (policy text check)
- Add `/terms` and `/disclosure`; update `/privacy` to list the real processors.
- Add the Amazon AU disclosure sentence near every Amazon link block, with the link-level "(paid link)" tag.
- Remove the "No ads" claims (`app/layout.tsx:26`, `app/page.tsx:8`, `IdeasClient.tsx:181`).
- Verify the wording against the official Amazon Associates AU and ACCC texts, and cite them in the PR.

**Accept:** a disclosure checklist signed off with source links. Ref RS §6, AA M-F.

## M2 — Store: one source of truth

**RC-2.1 Backfill the catalogue in the DB** · risk-prod-state (data) · S
- Insert the 5 static-only items (e.g. `jack-daniels-chips` and four Lane's/Bad Byron's rubs).
- Set `methods`/`recommended_for` on all rows.
- Delete the `test-widget` click row.

**Accept:**
- The `audits/scripts/cmp.ts` diff reports 0 missing.
- `/results` for kamado vs oven shows different picks.

Ref AA M-A1.

**RC-2.2 Server-render the catalogue with cache tag `catalog`** · risk-safe-fix · M · blocked by 2.1
- `getCatalog()` in `lib/catalog.ts`.
- `/gear`, `/rubs`, `/ideas`, `/cook/*` and `GearRecommendation` read it.
- Remove the `GEAR`/`RUBS` imports from pages.
- Admin mutations call `revalidateTag('catalog')` (check the Next 16 signature in the docs).

**Accept:**
- `grep "data/gear\|data/rubs" app components` only hits the snapshot generator.
- An admin edit shows on `/ideas` and on a cook page without a redeploy.

Ref AA M-A2.

**RC-2.3 `/go` hardening** · risk-safe-fix · S · blocked by 2.2
- Build-time JSON snapshot fallback generated from the DB; archived or deleted items → 302 `/gear`.
- Unknown slugs aren't logged.
- Click logging runs in `after()`.
- `Disallow: /go/` in robots.

**Accept:**
- A deleted slug → 302 `/gear`.
- `/go/nonsense` logs 0 rows.

Ref AA M-A3, M-E5.

**RC-2.4 Admin copy and dead-data cleanup + email link compliance** · risk-safe-fix · XS
- Fix the false claim at `admin/gear/page.tsx:188`.
- Delete `lib/bbqData.ts` `affiliateProducts`; fix the Therapen typo and the duplicate Plowboys URL.
- Remove the Amazon link from the cook-plan email pending the policy check.

**Accept:** the rendered email has no amazon-bound `/go` link. Ref AA M-A4, M-F1.

## M3 — Engine accuracy & planner (core 10×)

**RC-3.1 Engine correctness bugs** · risk-safe-fix · S · blocked by 0.5
- kg bounds 0.1–30 validated by zod; the results page redirects on bad input.
- URL params beat sessionStorage.
- Clock-honest timeline ("+1 day"; 1.995 h → "2 hrs").
- The stall milestone is skipped when the cook is under ~4 h.
- The saves UI shows an error on failure; login sync only clears local history on 2xx.

**Accept:** golden and Playwright tests for each. Ref AC E1, E2, E3, E5.

**RC-3.2 Food-safety and data fixes + integrity test in CI** · risk-safe-fix · needs-decision · S · blocked by 3.1
- Fix the 11 slow-cooker unreachable targets.
- Salmon jerky pre-heat → 71 °C.
- Poultry 74 → 75 °C, pending source verification (research §4: Food Safety Information Council; check FSANZ).
- Promote `audits/scripts/integrity.js` to a CI test.

**Accept:** the integrity test reports 0 issues except documented intentional ones. Ref AC E4, §4.

**RC-3.3 Reference fixture dataset** · Research · M
- For the top 20 cuts, collect published time ranges by weight at typical pit temps, with sources.
- Complete the 6 unsourced rows from RS §3.
- Store as `tests/fixtures/reference-cooks.json` with a citation per row.

**Accept:** 20 rows, each with ≥1 URL; conflicts recorded as bands.

**RC-3.4 New time model with ranges** · Opus · L · blocked by 3.3
- A weight/thickness-aware model (e.g. `k·w^α` per cut/method, fitted to the fixtures).
- Output `{low, high}` + "cook to temp" guidance.
- Milestone offsets derived from the model, not fixed fractions.
- The old model stays behind a flag until the fixtures pass.

**Accept:**
- 100% of fixtures fall inside the band.
- Monotonic in weight.
- The results page shows a range.
- A 6 kg pork shoulder is no longer 23.1 h.

**RC-3.5 Serve-by planner + hold/rest planner** · M · blocked by 3.4
- "Eat at" input → start time, wrap window, pull, rest.
- Optional faux-cambro hold buffer (keep ≥60 °C, max hold guidance).
- The forward start-time picker stays.

**Accept:**
- Given eat 18:00 and brisket 5 kg, it shows a start time with a day marker.
- Unit tests over DST and midnight.

Ref RS §2 #1, #3.

**RC-3.6 Conditions adjusters** · M · blocked by 3.4
- Optional ambient temp, wind, cooker type (offset/pellet/kamado/kettle) and wrap style inputs.
- Each adjustment shows its source or an "estimate" label.

**Accept:**
- Adjusters widen/shift the range as documented.
- Off by default.
- Tests.

Ref RS §2 #7.

## M4 — Design system foundations

**RC-4.1 Tokens file (brand direction per D8)** · Opus · M · blocked by 0.1
- `app/tokens.css` with semantic tokens (AU §5.2), mapped into Tailwind `@theme inline`.
- Fix the self-referencing `--font-display`.
- Put a contrast table for every text/bg pair in the PR.

**Accept:**
- Hex count in tsx goes 64 → ≤5.
- Every pair ≥4.5:1.

Ref AU UI-01.

**RC-4.2 Fonts** · S · blocked by 4.1
- One serif display face (replacing Abril Fatface) + Inter + a mono data face via `next/font`.
- Remove all inline `fontFamily`.

**Accept:**
- `grep fontFamily` = 0.
- Every H1 uses the display face (Playwright).

Ref AU UI-02.

**RC-4.3 UI primitives** · M · blocked by 4.2
- `components/ui/`: Button, Chip/FilterChips, Card, Container, PageHeader, StatBlock, EmptyState, Skeleton, Icon.
- Replace the 4 button recipes and the 3 chip sets.
- Add a visual regression baseline (Playwright screenshots of 10 routes at 390/1440 px) and a CI grep gate: no raw hex, no `#f97316`, no `bg-[#`.

**Accept:** the gates pass; the consistency matrix (AU §3) shows one container scale and one H1 style. Ref AU UI-03.

**RC-4.4 Dead code removal** · XS
- Delete `HomeCarousel`, `SeoSection`, the dead keyframes, `lib/bbqData.ts`, `generate_assets.py` and `lib/migrations` (if RC-0.4 is done).
- Keep `public/images` for RC-6.3.

**Accept:** `knip`/`ts-prune` is clean; build green. Ref AU UI-04, AC P1.

**RC-4.5 Brand name and titles** · S · blocked by 0.1 (D5)
- One spelling everywhere.
- Child titles drop the brand so the template adds it once.
- Metadata for every page; titles ≤60 characters.

**Accept:** curl of 15 routes shows the brand exactly once per title and 0 default titles. Ref AU UI-05, AC SE2.

## M5 — Motion system

**RC-5.1 One accessible Carousel** · Opus · M · blocked by 4.3
- Merge `HeroCarousel` + `ScrollCarousel`.
- Cache card centres per resize.
- Cancel the tween on pointer/wheel/key input.
- Keyboard arrows, Enter selects, ARIA carousel pattern, `aria-live` for the centred item; drop double-click-to-proceed.

**Accept:**
- One file.
- No forced reflow in a Chrome trace.
- The calculator flow is completable by keyboard only (Playwright).
- axe: 0 serious findings.

Ref AU MO-01, LA-02.

**RC-5.2 Motion tokens + reduced-motion policy** · S · blocked by 5.1
- `--dur-*` / `--ease-*` tokens; all durations → 0 under `reduce`.
- Carousel: no entrance glide, no rotate/scale.
- In-app motion toggle.

**Accept:** Playwright `reducedMotion:'reduce'` → `scrollLeft` constant and `document.getAnimations().length === 0` after 1 s. Ref AU MO-02.

**RC-5.3 Step transitions** · M · blocked by 5.2
- View Transitions between calculator steps; the chosen card morphs into the step header.
- ≤450 ms; off under reduced motion.

**Accept:** CLS <0.02 over the flow. Ref AU MO-03.

**RC-5.4 Remove framer-motion + fix hydration mismatch** · S · blocked by 5.2
- CSS grid-rows accordion on `/saves`.
- `isTouch` computed in an effect or via CSS `pointer:fine`.

**Accept:**
- framer-motion is gone from `package.json`.
- `/saves` JS drops by ≥30 KB gz.
- 0 console errors on `/` in mobile emulation.

Ref AU MO-04, MO-05.

## M6 — Layout, accessibility, imagery, performance

**RC-6.1 Responsive SiteHeader/SiteFooter** · S · blocked by 4.3
- Collapse below `lg`; a "More" group; ARIA sheet.
- One footer everywhere; fix `/techniques` (double footer, nested main).

**Accept:**
- At 768/900/1024 px the header is 56 px high with the logo on one line.
- Every route has 1 `<main>` and 1 `<footer>`.

Ref AU LA-01, LA-04.

**RC-6.2 Contrast and focus** · S · blocked by 4.3
- CTAs use `--on-accent`; a `focus-visible` ring token on all interactive elements; fix the alpha texts.
- A real H1 on home; bound the home CTA width.

**Accept:**
- All pairs in AU §2d pass AA.
- Tabbing through `/` shows the ring on every stop.
- Lighthouse A11y ≥95.

Ref AU LA-03, LA-04.

**RC-6.3 Real imagery** · M · blocked by 4.3
- `next/image` (AVIF) with the 13 existing photos on category cards and recipe thumbnails.
- An SVG icon set replaces UI emoji.
- List the cuts that still need photos (HUMAN or AI generation).

**Accept:**
- Home/recipes/ideas show photos with meaningful alt text.
- LCP image ≤100 KB.

Ref AU LA-05.

**RC-6.4 Server-first pages + performance budget + error states** · M · blocked by 5.4
- `/recipes`, `/rubs`, `/gear`, `/techniques` become server components with small client islands.
- Replace swallowed errors with logged 5xx + client error states.
- Add a Lighthouse CI budget.

**Accept:**
- Shared baseline JS below 120 KB gz.
- Lighthouse mobile Performance ≥95 on 5 routes.
- A forced DB failure shows an error UI and a Sentry event.

Ref AC P3, P4.

**RC-6.5 Calculator + results redesign (mobile-first, one-thumb)** · Opus · L · blocked by 3.5, 5.3, 6.2
- Redesign the flow and results on the new system: StatBlock for time and temps, the range from RC-3.4, the planner from RC-3.5, and a clear "cook to temp" message.
- Run the impeccable/design-review skill.
- Chris signs off on screenshots.

**Accept:** Chris's sign-off; the visual snapshots are updated.

## M7 — Superadmin v2

**RC-7.1 Supabase Auth superadmin (+ users per D3)** · risk-prod-state · M · blocked by 0.1, 1.4
- Magic link/passkey sign-in; `admin_users` table + `is_admin()` in RLS + a `requireAdmin()` helper.
- Admin routes become Server Actions using the user's JWT.
- Retire `ADMIN_PASSWORD`/`admin_token`; protect `/admin/*` server-side.

**Accept:**
- The old password flow is gone.
- A non-admin gets 403.
- RLS denies writes with the anon key and a non-admin JWT (tested without the service role).

Ref AA M-B1, M-B2.

**RC-7.2 Audit log** · risk-prod-state (migration) · S · blocked by 7.1
- A trigger on the catalogue, placement and sponsor tables writes the actor and the before/after values.
- An `/admin/audit` screen.

**Accept:** every create/update/delete produces a row with the actor. Ref AA M-B3.

**RC-7.3 Catalogue v2 schema** · risk-prod-state (migration) · S · blocked by 7.1
- New `gear` columns (status, image_path, badge, price_note, kind, asin, disclosure, sponsor_id, sort_order), a `categories` table, and a `catalog` storage bucket with policies.

**Accept:** the migration applies to staging, then prod after Chris's go. Ref AA §5, M-C1.

**RC-7.4 Product editor** · M · blocked by 7.3
- Image upload (resize to WebP, alt text required).
- ASIN → link builder; URL validation (https, Amazon host, `tag=bsbsbs0f-22`).
- Drafts and publish; disclosure type; sponsor; a live preview card per slot.
- Remove the `og-image` scraping from `/gear`.

**Accept:**
- Saving an Amazon URL without the tag is blocked.
- An uploaded image renders on `/gear`.
- `/gear` makes 0 og-image calls.

Ref AA M-C2, M-C3.

**RC-7.5 Categories, ordering, preview + instant publish** · M · blocked by 7.4
- A categories screen; drag reorder; a Draft Mode preview; `revalidateTag` on save.

**Accept:**
- A draft is visible only to the admin.
- Publish is live within 5 s.
- A new category appears in the correct store.

Ref AA M-C4, M-C5.

**RC-7.6 Admin dashboard + gallery moderation queue** · M · blocked by 7.1, 1.7
- `/admin` dashboard: clicks 1/7/30 days, top items, broken links, sponsor items ending soon, recent audit entries.
- Moderation queue: hide/restore/dismiss/delete/ban.

**Accept:** each action works on staging with test data, which is hard-deleted afterwards. Ref AA §7.

## M8 — Sponsors, placements & tracking

**RC-8.1 Placements data model + resolver** · risk-prod-state (migration) · M · blocked by 7.3
- Tables `placements`, `placement_items`, `sponsors`, `creatives`, seeded with the 9 slot keys.
- `getPlacement(key, ctx)`: targeting by method/cut, priority, weight, schedule window.
- Every commercial surface renders through it.

**Accept:**
- `grep` shows no product list rendered outside the resolver.
- Unit tests for targeting and scheduling.

Ref AA M-D1.

**RC-8.2 Placements, sponsors and creatives admin screens + scheduling cron** · M · blocked by 8.1
- A screen per slot showing what's live, what's scheduled and the editorial fill.
- Sponsor record with a logo; creatives with a UTM builder (non-Amazon only).
- A Vercel Cron revalidates on window edges.

**Accept:** an item scheduled at T appears within 5 min of T and disappears within 5 min of its end (staging). Ref AA M-D2.

**RC-8.3 Disclosure labels in the rendering layer** · S · blocked by 8.1, 1.10
- "Sponsored" chip for paid items, "Affiliate link" for Amazon; `rel="sponsored noopener"` on all outbound links.
- Labels come from the data and can't be dropped.

**Accept:** a snapshot test finds a label on every commercial item. Ref AA M-D3.

**RC-8.4 Pitmaster Box on results** · M · blocked by 8.1, 6.5
- Rub + wood + gear matched to the cut and method via the resolver, in the new design.

**Accept:** brisket/smoker vs chicken/oven show different, relevant items; clicks are tagged with the placement. Ref AA M-D5.

**RC-8.5 Click tracking v2 + impressions** · risk-prod-state (migration) · M · blocked by 8.1
- `gear_clicks` columns: placement, page, referrer, UA family, bot flag, daily visitor hash, country.
- Dedupe index.
- `impressions_daily` via server slot counters.

**Accept:**
- A bot UA is flagged.
- Two clicks within an hour count as 1.
- The redirect p95 doesn't grow.
- CTR per slot is computable.

Ref AA M-E1, M-E2.

**RC-8.6 Link-health cron + analytics dashboard + CSV export** · M · blocked by 8.5
- Daily check of every URL: 200, tag present, not a dog page; results to `link_checks`; Telegram/email alert on failure.
- `/admin/analytics` by day × slot × item; per-sponsor CSV.

**Accept:**
- An injected broken URL shows red within 24 h.
- The CSV matches the SQL totals.

Ref AA M-E3, M-E4.

## M9 — Live Cook Mode & PWA

**RC-9.1 Cook Mode screen** · Opus · L · blocked by 3.5, 6.5
- Start a cook from the plan.
- Big-type backyard view with step paging, current phase and next action.
- Wake Lock.
- The active cook persists locally.

**Accept:**
- The screen stays awake (Wake Lock granted) on Android Chrome.
- Survives a reload.
- Playwright flow.

Ref RS §2 #4, §5.

**RC-9.2 Alerts** · M · blocked by 9.1
- Web Notifications (PWA) for wrap, spritz, pull, rest end and serve.
- Capacitor Local Notifications when running natively.
- Clear permission UX.

**Accept:** a scheduled alert fires with the screen off on an Android device (native) and on desktop Chrome (web). Ref RS §2 #5.

**RC-9.3 Temperature log + chart + re-estimate** · M · blocked by 9.1
- Quick-add pit/meat temps; SVG chart with the stall band.
- Predicted finish refit from the actual readings.

**Accept:** feeding a recorded cook's log reproduces its finish within the model band (test). Ref RS §2 #6.

**RC-9.4 Shareable cook card** · S · blocked by 9.3
- An OG image route renders cut, time, chart and brand; a share button; the link returns to the cut page.

**Accept:** the card renders at 1200×630 and passes the Facebook/LinkedIn debuggers.

**RC-9.5 PWA offline** · M · blocked by 9.1
- Manifest, service worker (calculator, data and active cook offline).
- `public/offline.html` committed (also for Capacitor).

**Accept:**
- Lighthouse PWA installable.
- Airplane mode: the calculator works and the active cook continues.

Ref AC AN1.

## M10 — SEO, content & one brand

**RC-10.1 Host-correct robots, sitemap, canonicals and noindex** · S · blocked by 0.7
- `robots.ts` built from `SITE_URL`.
- noindex on results, saves, auth, admin and account.
- `X-Robots-Tag` on non-canonical hosts.

**Accept:** live robots and sitemap host match the page host; canonicals are present. Ref AC SE1.

**RC-10.2 De-duplicate `/cook` pages + useful structured data** · M · blocked by 3.4
- Canonicalise or merge method pages where the numbers are identical; add cut-specific intros.
- Drop HowTo; add `Recipe` on recipe pages; keep BreadcrumbList.

**Accept:**
- Median same-cut Jaccard <0.5 (`thin.js`).
- Rich Results Test valid on 3 pages.

Ref AC SE3, SE4.

**RC-10.3 Merge the marketing site into the app + 301 the apex** · risk-prod-state (DNS) · M · blocked by 0.1 (D1), 4.3
- Port the journal content (5 guides, rubs matrix, wood matrix) into app routes on the new primitives.
- Landing hero on `/` or `/about`.
- 301 every `roughcut.com.au/*` URL; remove the dead APK link.

**Accept:** `curl -I` on every old URL → 301 to a 200 page. Ref AU BR-02, BR-03.

**RC-10.4 Emails + native shell on tokens** · S · blocked by 4.1
- Email colours from the token TS export; Capacitor background and status bar = `--bg`.

**Accept:** `grep "#1a1a1a"` = 0; the email preview matches the brand. Ref AU BR-04.

**RC-10.5 Guides to ~20 + internal linking + Search Console** · M (content) + HUMAN (GSC verification)
- 15 new AU high-intent guides.
- Cut ↔ recipe ↔ rub ↔ wood links.
- Verify Search Console and Bing and submit the sitemap.

**Accept:** 20 guides live; GSC shows the sitemap processed.

**RC-10.6 `/ideas` deep links into the calculator** · XS
- Preselect cut and method.

**Accept:** clicking an idea lands on results with the right cut and method. Ref BLUEPRINT v1 5.5.

## M11 — Community

**RC-11.1 Gallery UX** · M · blocked by 1.7, 4.3
- Filters, lightbox, before/after slider, empty state that invites the first post.

**Accept:** Playwright upload → view → star → comment flow on staging.

**RC-11.2 Attach cook card/log to a gallery post** · S · blocked by 9.4, 11.1
- **Accept:** a post shows its cook card and links to the cut page.

**RC-11.3 Monthly cook-off** · S · blocked by 11.1
- Featured post by stars per month, winner banner, admin override.

**Accept:** the month rollover picks the correct winner (test).

## M12 — Android / Play Store

**RC-12.1 Device test of Capacitor plugins on a remote URL** · HUMAN (device) · S · blocked by 0.7
- Mount `CapacitorBootstrap`.
- Test StatusBar, App (back button), SplashScreen and LocalNotifications against the remote `server.url`.
- Write up the result; it decides D4.

**Accept:** a written pass/fail per plugin. Ref AC AN4, P2.

**RC-12.2 Native layer per D4** · Opus · L · blocked by 12.1, 9.2, 9.5
- Implement the D4 choice (remote shell, or an offline bundle for the calculator and Cook Mode).
- Local notifications, haptics, back button, offline screen.
- Point at the canonical domain; narrow `allowNavigation`.

**Accept:** the ANDROID-BUILD-PLAN §6 device checklist passes on a real phone.

**RC-12.3 App Links + release hygiene** · S · blocked by 12.2
- `assetlinks.json` with the Play signing SHA-256.
- Version from CI; release fails without signing; `allowBackup=false`.

**Accept:** `adb shell pm get-app-links` shows verified; versionCode auto-increments. Ref AC AN2, AN3.

**RC-12.4 Store listing + Data safety / content rating / UGC forms** · HUMAN · S · blocked by 1.10, 12.2
- Icons, feature graphic, screenshots, copy.
- Forms answered truthfully (ANDROID-BUILD-PLAN §5).

**Accept:** Play Console shows all forms complete.

**RC-12.5 Internal → closed (12 testers × 14 days) → production** · HUMAN · M · blocked by 12.4
- **Accept:** the production track is live; the store link works.

---
**Done:** RC-0.4 (05ec731, verified 2026-09-30).
**Next:** RC-0.1 (Chris: decisions). Can run meanwhile without decisions: RC-0.4 → RC-0.5 → RC-1.1 → RC-1.2 → RC-1.3 (all code-only, no prod state).
