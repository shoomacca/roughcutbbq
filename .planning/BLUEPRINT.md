# RoughCut BBQ — Delivery Blueprint v2

**Updated:** 2026-09-30 · **Canonical repo:** `RoughCut/roughcut-bbq` (branch `main`) · **Issue list:** `.planning/ISSUES.md` (mirrored to Linear)
**Evidence:** `.planning/audits/` — `audit-code.md`, `audit-ui.md` (+ `shots/`), `audit-admin.md`, `research-10x.md`, and `scripts/`. Four audits, each verified by spot-checks on 2026-09-30.
Tags: **[M]** measured (ran it / read the line / queried it) · **[G]** guess or judgement.

---

## 1. Where everything is

There were seven copies in two lineages that split on 29 June; all merged here on 2026-09-30.
- **Base:** the v2 folder, which is what production runs.
- **Ported from GitHub `roughcutbbq` (Aug 8):** server-side admin login, timing-safe auth, 257 `/cook/*` pages, 60 `/recipes/*` pages.
- **Not ported:** the login wall, the local-JSON DB layer, the marketing-site copy.

Folder map, what's safe to delete, and the remote accounts: see §1 of v1 in git history (`git show 7dc7c22:.planning/BLUEPRINT.md`).

**Production is still the July build** [M: live `/cook`, `/privacy`, `/account/delete`, `/api/admin/login` all return 404]. None of the fixes in this repo are live until M0 ships.

## 2. Pros — keep and build on

| Area | What's good |
|---|---|
| Positioning | Free, no account, AU-focused, and it covers 9 cooker types. Competitors are either hardware-locked (MEATER, ThermoWorks, FireBoard) or thin calculators [research §1] |
| Data | 80 cuts × 8 categories, 257 cut/method pairs, structurally clean: no missing keys, no mode mismatches, no wrap temp above pull temp [M: audit-code §4]. Plus 60 recipes, 31 rubs, 28 gear items, a wood chart and 5 guides |
| Backend | Supabase with RLS on all 9 tables; the gallery view uses security-invoker; the storage bucket keeps uploads across deploys [M] |
| Monetisation base | `/go/<slug>` redirect with click logging and a static fallback; Amazon tag on every item [M] |
| Signature UI | Tilted-card scroll carousel: distinctive, worth keeping as the brand's motion moment [audit-ui §1] |
| SEO base | 257 programmatic cook pages + 60 recipe pages + JSON-LD + sitemap (merged) [M: build] |
| Android | Capacitor 8 project, signed AAB built 12 Jul, targetSdk 36 [M] |
| Build health | `tsc` clean, `next build` passes, 367 static pages [M] |

## 3. Cons — the problems, grouped (full tables with file:line in the audits)

**Security & ops**
- **Admin password is public:** it's in the live JS bundle [M].
- **`/api/og-image` fetches any URL** for anyone [M: live probe].
- **Next 16.1.6:** 1 critical + 10 high advisories [M: `npm audit`].
- **No rate limits** anywhere.
- **Sessions can't be revoked.**
- **Flagged gallery list is public** [M].
- **No tests, no CI, no staging, no error monitoring, no analytics:** PostHog is never initialised [M].
- **Production isn't built from git:** it comes from a tarball in a public bucket [M].

**The calculator (the product)**
- **Linear time model:** 141 of 257 pairs ignore weight entirely; 35 pairs exceed 24 h at 8 kg, e.g. beef cheeks 36 h. A 6 kg pork shoulder comes out at 23.1 h [M].
- **Fixed milestone offsets:** stall at 60% and wrap at 65% of total time, whatever the cut [M].
- **Unreachable targets:** 11 slow-cooker pairs set 90 °C but pull at 95 °C [M].
- **Food safety:** salmon jerky pre-heats to 63 °C; poultry pulls at 74 °C vs the AU advice of 75 °C [M; the safety sources are in research §4, verify before changing].
- **Bugs:** unbounded `?kg=` (3850 h / NaN); stale sessionStorage beats the URL; a "Ready at" time past midnight shows no day marker; "Saved!" shows even when the save failed [M].
- **Nothing to plan with:** no serve-by planning, no ranges, no cook mode — the features users actually want [research §2].

**UI & motion**
- **Three palettes** in one app: 64 hex values, 50 rgba() and 242 raw Tailwind colour classes vs 520 token uses [M].
- **Inconsistent building blocks:** 6 container widths, 4 heading styles, 4 primary-button styles; the home page has no H1 [M].
- **Motion ignores users:** zero `prefers-reduced-motion` handling and zero `focus-visible` styles; the carousels can't be driven by keyboard [M].
- **Contrast:** the main CTA is 2.85:1 [M].
- **Header breaks at 768 px** [M: screenshot].
- **Bundle and assets:** framer-motion is used for one accordion; 170 KB gz JS ships on every page; 13 real food photos go unused while emoji stand in [M].
- **App ≠ website:** different name spellings, palette, fonts, nav and tone. The live marketing site overflows on mobile, "Launch App" goes to the old build, and the APK link is a 404 [M].

**Store / sponsors / admin**
- **Two catalogue sources that disagree:** static 57 vs DB 52 [M].
- **Admin edits don't reach** `/ideas` or the 257 cook pages [M].
- **Deleted items still redirect**, via the static fallback [M].
- **"Recommended gear" is always MEATER Plus:** `recommended_for` is empty on all rows [M].
- **Admin is thin:** 7 fields, no images, ordering, scheduling, sponsors, preview or audit log, and one shared password [M].
- **Clicks log only slug + time:** no placement, bot filter or dedupe, and a fake `test-widget` row [M].
- **Compliance:** an Amazon link sits in the email with no disclosure, and "No ads" copy would contradict sponsor slots [M code / G policy].

## 4. The 10× plan — five systems

### 4.1 Engine you can trust (M3)
- **Golden fixtures and CI:** a reference fixture set from published ranges [research §3], enforced in CI.
- **Weight/thickness model:** a model that outputs a **range** plus "cook to temp, not time".
- **Serve-by reverse planner:** eat-at → start, wrap window, pull, rest/hold. The faux cambro turns stall uncertainty into a safe buffer.
- **Optional adjusters:** ambient/wind/cooker adjusters, labelled as estimates.

This is the ranked #1–3 feature set in the research [research §2].

### 4.2 One design + motion system across app, website, emails and Android (M4–M6, M10)
- **Brand direction:** "Pit Journal" (proposed, D8): charcoal background, one ember accent, a serif display face + Inter + a mono "data" face for times and temps, real food photos instead of emoji [audit-ui §5].
- **One token file:** `app/tokens.css` (semantic tokens only), mapped into Tailwind `@theme inline`. The same values are exported to emails and to the Capacitor shell.
- **Primitives in `components/ui/`:** Button, Chip, Card, Container, PageHeader, SiteHeader/Footer, Carousel, Stepper, StatBlock, Accordion, Modal/Sheet, ProductTile, EmptyState, Skeleton, Icon.
- **Motion rules:**
  - Motion only explains state.
  - Durations: 100–160 ms (micro), 240 ms (component), 400–600 ms (scene).
  - Animate only transform, opacity and filter.
  - One merged Carousel as the signature moment.
  - View Transitions between calculator steps.
  - All durations → 0 under reduced motion.
  - No animation library on the critical path; remove framer-motion.
- **The website is not a second codebase:** its content moves into the Next app as routes, and the apex 301s to the app (D1, option A) [audit-ui §5.6]. One codebase, one header/footer, zero drift.
- **Consistency is enforced by CI:** a lint/grep gate (no raw hex, no `#f97316`, no `fontFamily`), plus Playwright visual snapshots of 10 key routes at 390 and 1440 px, plus axe with 0 serious findings.

### 4.3 Superadmin for store items and sponsors (M2, M7, M8)
**Recommendation:** extend the custom Next admin on Supabase (not a CMS) [audit-admin §6].
- **The DB is the only source of truth:** pages render from `getCatalog()` / `getPlacement(slot, ctx)` wrapped in a `catalog` cache tag. Every admin save calls `revalidateTag`, so changes are live in seconds with no redeploy.
- **Superadmin sign-in:** Supabase Auth (magic link/passkey) + an `admin_users` table + RLS `is_admin()`. This replaces the shared password.
- **Screens:**
  - Dashboard
  - Products: image upload, ASIN link builder, tag validation, drafts, reorder
  - Categories
  - **Placements:** 9 slots, e.g. the results "Pitmaster Box", `/gear` featured, home banner, email
  - **Sponsors:** logo, schedule, per-sponsor report and CSV
  - Creatives
  - Link health (daily cron)
  - Click analytics (placement, bot-filtered, deduped, impressions → CTR)
  - Gallery moderation
  - Audit log

  Details: [audit-admin §5, §7].
- **Disclosure built in:** "Sponsored" / "Affiliate link" labels and `rel="sponsored"` come from the data model, so the UI can't drop them.

### 4.4 Live Cook Mode + offline (M9)
- Big-type step-paging screen with Wake Lock.
- Local and web notifications for wrap/spritz/pull/rest.
- Manual temp log with a chart and re-estimate.
- Shareable cook card.
- PWA offline.

This is also what makes the Android app pass Play's "webview spam" rule [research §7].

### 4.5 Trust & quality bar (M0, M1, and CI throughout)
Definition of done for the programme:
- `npm audit --omit=dev`: 0 high/critical.
- Supabase advisor: 0 WARN.
- CI green: typecheck, lint, Vitest goldens, Playwright smoke + visual + axe.
- Lighthouse mobile ≥ 95 on Performance, A11y, Best Practices and SEO.
- 0 console errors.
- Sentry clean.
- Every route has one H1 and one title containing the brand exactly once.
- Admin changes live within 5 s.

## 5. Decisions only Chris can make (issue RC-0.1)

| # | Decision | Recommendation |
|---|---|---|
| D1 | Canonical domain; fate of the `roughcut.com.au` Hostinger site | App on `app.roughcut.com.au`; port the site's content into the app; 301 the apex |
| D2 | GitHub target | Overwrite `shoomacca/roughcutbbq` `main`; keep August as `archive/aug-2026` |
| D3 | Accounts | Supabase Auth for users **and** the superadmin (magic link + Google) |
| D4 | Android architecture | Decide **after** the device test RC-12.1; lean hybrid (offline calculator + Cook Mode) |
| D5 | Brand spelling | Pick one: "RoughCut BBQ" or "Rough Cut BBQ" |
| D6 | Delete stale folders/repos after M0 | Yes, once the push is verified |
| D7 | What "sponsors" means for you | Paid brand slots + featured products + sponsored guides, all labelled |
| D8 | Visual direction | "Pit Journal" charcoal + ember (audit-ui §5.1) vs keeping the current forest green |

## 6. Milestones (execute in order; details and acceptance criteria per issue in `ISSUES.md`)

| # | Milestone | Why it's here | Issues |
|---|---|---|---|
| M0 | Decisions, foundation & go-live | Nothing else is real until prod is built from git with secrets rotated | 9 |
| M1 | Security & trust hotfixes | Close the open doors before adding features | 10 |
| M2 | Store: one source of truth | Quick win; makes the admin actually work | 4 |
| M3 | Engine accuracy & planner | The core 10× | 6 |
| M4 | Design system foundations | Tokens + primitives, so every later UI issue is consistent | 5 |
| M5 | Motion system | Carousel, reduced motion, transitions | 4 |
| M6 | Layout, a11y, imagery, performance | The polish bar | 5 |
| M7 | Superadmin v2 | Proper auth, product editor, instant publish | 6 |
| M8 | Sponsors, placements & tracking | Paid slots, scheduling, reporting | 6 |
| M9 | Live Cook Mode & PWA | The feature nobody free offers | 5 |
| M10 | SEO, content & one brand | Merge the website, de-dupe cook pages | 6 |
| M11 | Community | Gallery worth posting to | 3 |
| M12 | Android / Play Store | Ship it | 5 |

## 7. Execution protocol (how every issue is delivered)

1. **One issue → one subagent → finish → verify → next.** Never parallel.
2. The subagent gets a self-contained prompt: the issue body + `CLAUDE.md` + the audit sections it cites.
   - Model: Sonnet for `risk-safe-fix` S/M issues, Opus for L issues, design, engine and anything `risk-prod-state`.
3. **Verification is done by Opus** (the orchestrator), not the implementer. It re-runs the acceptance commands, reads the diff, and checks that no secrets were committed.
4. **One commit per issue:** `feat(RC-x.y): …` / `fix(RC-x.y): …`, authored `shoomacca <shoomacca@gmail.com>`.
5. **Human gates:**
   - `risk-prod-state` issues (live DB, env vars, deploys, domains) are prepared by the agent and executed only after Chris says go.
   - `HUMAN` issues are Chris's.
6. Linear status moves Todo → In Progress → In Review (verification) → Done. A failed verification goes back to In Progress with the failing output attached.
7. `STATE` lives in Linear plus the "Next" line at the bottom of `ISSUES.md`.
