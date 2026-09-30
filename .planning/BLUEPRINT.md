# RoughCut BBQ — Delivery Blueprint

**Written:** 2026-09-30 · **Basis:** full audit of every RoughCut/BBQ folder, both GitHub repos, the live site, Vercel and Supabase (all checked on 2026-09-30).
**Canonical code from now on:** `RoughCut/roughcut-bbq/` (own git repo, branch `main`). Every other folder is history.

Tags: **[M]** = measured today (command/query/line read). **[G]** = guess or judgement, still needs checking.

---

## 1. Where everything is — and what's latest

There were **seven copies** of this app across two lineages that split on 29 June:

```
Mar 2026  bbq-calculator/ ─ bbq-pro/ ─ bbq-pro-deploy/ ─ bbq-pro-hostinger/   (MySQL era, tracked in the stray parent repo)
                                   │
Jun 29    GitHub shoomacca/roughcutbbq @9ab65e5  (login wall, "journal" homepage, local-JSON/pg DB)
                                   │
          ┌────────────────────────┴───────────────────────────┐
Jul 11-12 LINEAGE A: RoughCut/roughcut-bbq-v2/                  Aug 8  LINEAGE B: GitHub roughcutbbq main (6 commits, other agent)
          Supabase for real, login wall gone, /ideas,                  server-side admin login, timing-safe auth,
          admin/gear, privacy + account-delete pages,                  /cook/[method]/[cut] SEO pages, /recipes/[slug],
          Capacitor Android + signed AAB.                              lib/seo.ts, audit report + "10x ideas".
          ► THIS IS WHAT PRODUCTION RUNS                               Still on the old DB layer. Never deployed.
          (never pushed to GitHub)
          └────────────────────────┬───────────────────────────┘
Sep 30    RoughCut/roughcut-bbq/  = A + the good parts of B   ◄── CANONICAL
```

| Folder / place | Status | Keep? |
|---|---|---|
| `RoughCut/roughcut-bbq/` | **Canonical.** Baseline = v2, plus ported August work (see §2) | ✅ |
| `RoughCut/roughcut-bbq-v2/` | Source of the canonical baseline; holds the built `app-release.aab` / `.apk` (12 Jul) | Archive after M0 |
| `RoughCut/roughcut-upload.keystore` + `roughcut-bbq-v2/android/key.properties` | **Play upload key + its passwords. Losing them can't be undone.** | ✅ Back up to 2 places |
| `RoughCut/roughcutbbq-main/`, `roughcutbbq/`, `*.zip`, `ziBAne6e` | June snapshot, an empty `.git` stub, downloads | Delete (with your OK) |
| `RoughCut/android-sdk`, `jdk*`, `cmdline-tools*` (~1.3 GB) | Build toolchain | Keep until Android is automated, then delete |
| `projects/bbq-calculator`, `bbq-pro`, `bbq-pro-deploy`, `bbq-pro-hostinger` | March lineage. `bbq-pro`'s uncommitted `meats.json` is **byte-identical** to canonical [M: md5 match] — nothing lost | Delete (with your OK) |
| GitHub `shoomacca/roughcutbbq` | Lineage B. Public repo | Replace `main` with canonical (decision D2) |
| GitHub `shoomacca/bbq-calculator` | Old June code; the old Vercel project listens to it | Archive |
| Vercel `roughcut-bbq` | **Production.** Last deploy 11 Jul 23:20 UTC [M]. Source is a tarball in a public Supabase bucket, not git | Keep; connect to git in M0 |
| Vercel `bbq-calculator` | Old project, rollback-pinned. **Still holds `app.roughcut.com.au` and `bbq.bsbsbs.au`** [M: both serve the old title] | Retire after domain move |
| Supabase `yvavflxtjzlbatrqdyai` | Live DB and storage | Keep |
| `roughcut.com.au` (apex) | Hostinger, "Technical Pitmaster Journal" site [M] | Decision D1 |

## 2. What the merge did

Baseline commit `d6b0ee2` = v2 exactly, without build outputs, node_modules or secrets.
Ported from the August GitHub work (Opus subagent; `npm ci`, `tsc --noEmit` and `npm run build` all exit 0 [M], build generated 367 static pages including **257 `/cook/[method]/[cut]` pages** and 60 `/recipes/[slug]` pages [M]). Commits `88bf80a`, `33741f1`, `4fb8c93`, `cd9adaf`:
1. Server-side admin login (httpOnly cookie). Removes `NEXT_PUBLIC_ADMIN_PASSWORD`, which today **ships the admin password in the public JS bundle** [M: found `x-admin-password":"kd84…"` in the live `/admin/gallery` chunk]. Also fixes the admin delete, which sent DELETE to a POST-only route [M: live returns 405].
2. Timing-safe token/password comparison; production refuses to start without `JWT_SECRET`.
3. Programmatic SEO pages `/cook/[method]/[cut]` and `/recipes/[slug]`, `lib/seo.ts`, JSON-LD, sitemap.
4. Small nav/footer/guide fixes.

**Deliberately not ported:** August's `lib/db.ts` (local JSON / pg emulation), `middleware.ts` login wall, its API routes (v2's supabase-js versions are the correct ones), `marketing-website/`, `tmp/vercel-restore/`.

## 3. Honest baseline (what "10×" is measured against)

| Metric | Today | Evidence |
|---|---|---|
| Registered users | 1 | [M] Supabase `users` |
| Saved cooks / gallery posts / comments | 0 / 0 / 0 | [M] |
| Email subscribers | 1 | [M] |
| Affiliate clicks logged | 7 | [M] `gear_clicks` |
| Calculations run (tally) | 8 | [M] `/api/tally` |
| Analytics | **None.** `trackEvent` calls `window.posthog`, but PostHog is never initialised anywhere | [M] grep for `posthog.init` / `posthog-js`: 0 hits |
| Tests | None (no test runner in package.json) | [M] |
| Custom domain on the new app | None — domains still point at the old build | [M] |
| Privacy / account-delete live | 404 / 404 | [M] |

Traffic is roughly zero, so "10× usage" means nothing yet. **10× is defined here as a quality bar** (§4). Growth metrics start once M0 lands analytics.

## 4. The 10× quality bar (definition of done for the whole programme)

1. **Right answers.** The calculator is the product. Today cook time = `hoursPerKg × weight`, purely linear [M: `lib/calculator.ts:58-60`]. Example: a 6 kg pork shoulder on the smoker comes out at 3.85 × 6 = **23.1 h** [M: arithmetic on `meats.json`]. Real cooks run much shorter, because cook time follows thickness, not mass [G: domain knowledge; M2 checks it against published references before any change ships]. Target: every cut × method × weight inside a published reference range, shown as a **range** ("9–11 h"), with golden-value unit tests.
2. **Plans backwards from dinner.** "Eat at 6 pm" → start time, wrap window, rest/hold window. Today there's only a forward start-time picker [M: `app/results/page.tsx:28`].
3. **Stays with you through the cook.** Live Cook Mode: timeline, stall/wrap/rest alerts, temperature log with a chart, and a shareable cook card. Works offline in the backyard.
4. **Trustworthy.** No secrets in bundles, admin auth on the server, rate limits, moderation that can't be abused, privacy and deletion live, schema in migrations, CI green on every push.
5. **Fast and polished.** One design system, Lighthouse ≥ 95 on mobile for Performance, A11y, Best Practices and SEO, zero console errors.
6. **Findable.** Hundreds of indexable cut × method pages with correct structured data, per-page OG images, Search Console verified.
7. **Earns.** Affiliate links matched to the cook ("Pitmaster Box"), click-through measured, and cook-plan emails that actually send from a verified domain.
8. **Shippable to Play.** Passes the webview-spam test on real native value (notifications, offline), not a thin wrapper.

## 5. Decisions only you can make (these block milestones)

| # | Decision | My recommendation |
|---|---|---|
| D1 | Canonical domain: `app.roughcut.com.au` for the app, and what happens to the `roughcut.com.au` Hostinger journal? | App on `app.roughcut.com.au`; 301 the apex to it (or keep the journal but link it into the app). One brand, one place. |
| D2 | GitHub: overwrite `shoomacca/roughcutbbq` `main` with canonical (keep August as branch `archive/aug-2026`), or make a new repo? | Overwrite `main` and keep the archive branch. Vercel `roughcut-bbq` connects to it. The repo is **public**: the admin password must be rotated first. |
| D3 | Accounts: keep the homemade JWT/scrypt auth, or move to Supabase Auth (magic link + Google)? | Supabase Auth. It removes the whole custom-crypto attack surface and gives password reset, which doesn't exist today [M: `app/api/auth/` has only login, logout, me, signup]. |
| D4 | Android: remote-URL shell (today) vs bundling the calculator offline in the APK with the server only for accounts and gallery? | Hybrid: bundle calculator + Cook Mode offline (static data already lives in `meats.json`); gallery and accounts stay remote. That's also the Play "native value" argument. |
| D5 | Brand spelling: "RoughCut BBQ" or "Rough Cut BBQ"? Both are in use, and the ported SEO pages say "Rough Cut BBQ" [M] | Pick one; I'll sweep it. |
| D6 | OK to delete the stale folders in §1 once M0 is pushed? | Yes, after the push is verified. |

## 6. Milestones

Each milestone runs in a fresh context: max 5 shards, one commit per shard, a build and verification gate before it's marked done. M0 must go first. M1 and M2 can run in parallel. The rest follow the numbering unless you reprioritise.

### M0 — Foundation & safety  *(must go first; ~1 session)*
| Shard | Work | Done when |
|---|---|---|
| 0.1 | **Rotate the admin password** (the current one is public in the live bundle and in `ROUGHCUT-BBQ-REPORT.md`). Scrub it from that report. | Old password is rejected by the live API |
| 0.2 | **`JWT_SECRET` and `ADMIN_PASSWORD` must be set before deploying the merged code.** Production now refuses to sign tokens without `JWT_SECRET`, and admin login returns "not configured" without `ADMIN_PASSWORD`. If production was running on the old hardcoded fallback secret, every existing session will log out (only 1 user today [M]). Then set real Vercel env vars (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `JWT_SECRET`, `ADMIN_PASSWORD`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`); retire the `runtime-config` payload injection and `setup-source.js` tarball hack; delete the public `deploy` bucket | Build from git succeeds with no injected config; bucket gone |
| 0.3 | Push canonical to GitHub (D2), connect Vercel `roughcut-bbq` to it, deploy | Production deployment built from a git SHA; `/privacy` and `/account/delete` return 200 |
| 0.4 | Move `app.roughcut.com.au` + `bbq.bsbsbs.au` to `roughcut-bbq`; archive `bbq-calculator` project and repo | Both domains serve the new title |
| 0.5 | Capture the live Supabase schema (tables, `gallery_with_counts` view, `increment_cook_tally` RPC, RLS, bucket policies) as `supabase/migrations/`, delete stale MySQL `lib/migrations/`; wire PostHog (or Vercel Analytics) for real; GitHub Actions CI: typecheck + lint + build | Fresh DB can be rebuilt from repo; analytics events visible; CI green |

### M1 — Trust, compliance & moderation
| 1.0 | `GET /api/gallery?flagged=true` has no admin check, so anyone can list reported and hidden posts [M: `app/api/gallery/route.ts:26-33`]. Move it behind `isAdminRequest()`. Also clear the 8 existing lint errors (privacy, IdeasClient, setup-source) [M: `npm run lint`] |
| 1.1 | Report abuse: one report per user/session per post, rate-limited; auto-hide threshold stays at 3 but only counts distinct reporters |
| 1.2 | Upload hardening: magic-byte check (don't trust the declared MIME type), resize + EXIF/GPS strip server-side (`sharp`), per-IP rate limit, optional Cloudflare Turnstile for anonymous uploads |
| 1.3 | Account deletion also removes the user's gallery images from storage; add password reset (or do D3 Supabase Auth here) |
| 1.4 | Terms page, sitewide Amazon Associates disclosure, cookie/analytics notice; privacy page reflects real processors (Supabase, Vercel, Resend, analytics) |
| 1.5 | Security pass: CSP matches real origins (PostHog/Supabase), security headers verified live, dependency audit, Sentry (or similar) for server errors |

### M2 — The engine: accurate, explainable, tested  *(the actual 10×)*
| 2.1 | Test harness (Vitest) + zod schema for `meats.json`, so bad data fails the build |
| 2.2 | Reference dataset: for the 20 most-cooked cuts, collect published time/temp ranges (AmazingRibs, USDA/FSANZ safe temps, manufacturer guides), each with its source cited, as golden fixtures |
| 2.3 | New time model: thickness/weight-aware (e.g. a `k·w^α` fit per cut/method), output a **range** plus a confidence note; fixtures must pass; keep flat-time cuts as they are |
| 2.4 | Serve-by planner: eat-at time → start time, wrap window, stall buffer, rest/hold window (faux-cambro guidance); the forward picker stays |
| 2.5 | Conditions adjusters (optional inputs): ambient temp, wind, cooker type (offset/pellet/kamado), wrap style (none/paper/foil). Each adjuster has to show a cited source or be labelled an estimate |

### M3 — Live Cook Mode + offline
| 3.1 | Cook Mode screen: timeline from the plan, current phase, next action, big-type "backyard" view |
| 3.2 | Alerts: web notifications (PWA) and native local notifications (Capacitor) for wrap window, spritz, rest, serve |
| 3.3 | Temperature log: quick-add pit/meat temps, live chart, predicted finish re-estimated from the actual curve |
| 3.4 | Shareable cook card: branded image (chart + cut + time) via OG route; links back to the cut page |
| 3.5 | PWA: manifest, service worker, offline calculator + active cook; installable |

### M4 — Design system & polish
| 4.1 | Design tokens + component inventory; one visual language across calculator, ideas, recipes, gallery, guides (run `impeccable` / design-review skills) |
| 4.2 | Calculator + results redesign, mobile-first, one-thumb use at the pit |
| 4.3 | Accessibility: keyboard, contrast, screen-reader labels on carousels |
| 4.4 | Performance: image pipeline (next/image, AVIF), bundle trim (framer-motion usage audit), Lighthouse ≥ 95 ×4 on mobile |
| 4.5 | Empty/error/loading states everywhere; zero console errors |

### M5 — SEO & content engine
| 5.1 | Validate the merged `/cook/[method]/[cut]` pages: unique copy per page, canonical URLs, no thin duplicates, HowTo/FAQ/Breadcrumb JSON-LD valid in Rich Results Test |
| 5.2 | Per-page OG images (recipe, cut, cook card) |
| 5.3 | Guides: from 5 up to ~20, covering the high-intent Australian queries (brisket, lamb shoulder, pork belly, snags, prawns…) |
| 5.4 | Search Console + Bing verified, sitemap submitted, internal linking between cut ↔ recipe ↔ rub ↔ wood |
| 5.5 | `/ideas` deep-links into the calculator with cut + method preselected (on the July idea list) |

### M6 — Monetisation that helps the cook
| 6.1 | "Pitmaster Box": results page recommends the rub, wood and gear matched to this cut/method (from the `gear` table) |
| 6.2 | Affiliate dashboard in `/admin`: clicks per slug/page/day from `gear_clicks`; broken-link checker |
| 6.3 | Cook-plan email: verify Resend sending domain, test delivery, add a "reminder before your cook" email |
| 6.4 | Admin gear editor hardened (the merge fixes auth) + audit log of affiliate URL changes |

### M7 — Community
| 7.1 | Gallery UX: cut/method filters, lightbox, before/after slider |
| 7.2 | Attach a cook log / cook card to a gallery post ("how I cooked it") |
| 7.3 | Monthly cook-off: featured post by stars, with a winner banner |
| 7.4 | Moderation queue in admin: reported, hidden, restore, ban |

### M8 — Android / Play Store
| 8.1 | Implement D4 (offline bundle for calculator + Cook Mode) or keep the remote shell; point at `app.roughcut.com.au` |
| 8.2 | Native: local notifications, haptics, status bar, back button, offline screen, App Links + `assetlinks.json` |
| 8.3 | Icons, splash, store listing, screenshots; Data safety / content rating / UGC forms (see `ANDROID-BUILD-PLAN.md` §5) |
| 8.4 | Internal test → closed test (12 testers × 14 days if it's a new personal account) → production |
| 8.5 | Versioning + release script; keystore backed up in two places |

## 7. Risks

| Risk | Mitigation |
|---|---|
| The public GitHub repo gets pushed before the password is rotated | M0.1 comes before M0.3, no exceptions |
| New time model gives *worse* answers than today | M2 ships only if golden fixtures pass; the old model stays behind a flag until then |
| Play rejects it as a webview wrapper | D4 hybrid + native notifications (M3.2/M8.2) |
| Google DNS/domain change breaks the old live site | Move one domain at a time; verify each serves the new title before the next |
| Duplicate folders get edited again by another agent | §1 table + a `CLAUDE.md` in canonical saying "this is the only repo" |

## 8. What I could not verify from here (you need to check)

- Vercel dashboard: whether the rollback pin on `bbq-calculator` still blocks domain moves.
- Play Console: whether an account exists, and whether any build was uploaded.
- Whether the keystore passwords are backed up anywhere besides `android/key.properties`.
- DNS for `roughcut.com.au` (it sits at Hostinger): who controls it.
- Whether the Resend sending domain is verified (email is best-effort and fails silently in code).
- The August audit's claim that Capacitor plugins don't work when the app loads a remote `server.url` is **unverified**. Test it on a device in M8 before designing around it.
