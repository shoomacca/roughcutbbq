# RoughCut BBQ — Handover (2026-10-01)

Read this first, then `BLUEPRINT.md` §5 (decisions) and `ISSUES.md`. Linear is the live status board: project "RoughCut BBQ — 10x" (team New Genesis, BOTS-661…736).

## How we work (Chris's rules)
- **One issue → one subagent → it finishes → the orchestrator verifies (short commands only) → next.** Never parallel, and the orchestrator never does the work itself, prod ops included.
- **Pushing `main` = a production deploy** (Vercel is git-connected). Subagents work on a branch `rc-x.y`. The orchestrator verifies, applies any prod migration (additive only), fast-forward merges, waits for READY, then checks live.
- Prod DB `xdiapmnocyibpfrfgdcw` (Sydney, since RC-6.6 on 2026-10-01; its dashboard name is still `roughcutBBQ-staging`). The old Seoul project `yvavflxtjzlbatrqdyai` is retired, and Chris deletes it in the dashboard. **There is no staging project now.** RC-0.6 needs a new one. Until it exists, subagents must not apply migrations anywhere.
- Vercel env vars: use the CLI (logged in as shoomacca; the repo is linked). The Vercel MCP gets 403 on env. Domain moves: REST API with the CLI token.

## Live state
- Live at app.roughcut.com.au and bbq.bsbsbs.au (Vercel `roughcut-bbq`). GitHub `shoomacca/roughcutbbq` `main`; August work is on `archive/aug-2026`.
- CI runs on every push: tsc, lint (blocking), vitest (864), build, Playwright (6).
- Secrets rotated. Values are in `%USERPROFILE%\roughcut-secrets-2026-10-01.txt`; Chris is to move them into his password manager and delete the file.

## Done (verified)
RC-0.1, 0.2, 0.3, 0.4, 0.5, 0.7 · RC-1.1, 1.2, 1.3, 1.4, 1.7 · RC-3.1

## Blocked on Chris
- **RC-0.6 staging (BOTS-666):** the former staging project became production in RC-6.6, so a NEW staging Supabase project is needed. Create it, apply `supabase/migrations/0001_baseline.sql` plus `seed/gear.sql`, then set Preview (`staging`) `SUPABASE_URL` and `SUPABASE_SECRET_KEY` to it and redeploy the `staging` branch. **Warning:** Preview (`staging`) `SUPABASE_URL` currently points at `xdiapmnocyibpfrfgdcw`, which is now PRODUCTION. Do not add a secret key for it there.
- **Email:** there has never been a `RESEND_API_KEY`. A Resend key and a verified sending domain are needed (RC-1.8 work).
- **RC-0.8:** a PostHog/Sentry account choice is needed.
- **RC-0.9 cleanup:** ask before deleting the old folders and the `bbq-calculator` Vercel project/repo (now unused).

## Next issues (code-only, in order)
RC-1.8 (email + anti-enumeration; email sending is untestable until there's a Resend key) → RC-2.4 → RC-3.2 (needs FSANZ source check) → RC-3.3 → RC-4.4 → RC-4.1 (D8 charcoal + ember) → …
RC-1.6 folds into RC-7.1 (D3 = Supabase Auth). Cancel it when RC-7.1 starts.

## Owner decisions 2026-10-02 (explainer website + app home)
- **D1 amended:** keep the separate explainer website on Hostinger at `roughcut.com.au` (+www), static, with the **same UI/style/motion as the app**; all CTAs → `app.roughcut.com.au`; **no apex redirect**. RC-10.3 superseded.
- **Deploy:** no pipeline, no Hostinger credentials. `npm run site:build` → self-contained `site/dist/` (+ `roughcut-site.zip`, `README-UPLOAD.txt`); Chris copies it into `public_html` via hPanel File Manager; the orchestrator verifies live by curl (RC-13.8). Rollback = `site/backup-2026-10-02/`.
- **Defaults:** build now on current tokens (before D8); sample card = spatchcock chicken until RC-3.4; analytics deferred, no tracking code (RC-13.10 blocked).
- Plan: `.planning/HOME-AND-SITE-PLAN.md`. Issues RC-13.0–13.10 in ISSUES.md §M13. Order: RC-13.1 → 13.2 → 13.3 → 13.4 → 13.5 → 13.6 → 13.7 → 13.8 (Chris) → 13.9.

## New since the plan
- **BOTS-735 RC-0.10:** demo accounts (after staging).
- **BOTS-736 RC-6.6 (done 2026-10-01):** prod Supabase moved from Seoul `yvavflxtjzlbatrqdyai` to Sydney `xdiapmnocyibpfrfgdcw`. The data was verified identical (row count + md5 per table). The Vercel Production `SUPABASE_URL`/`SUPABASE_SECRET_KEY` now point at Sydney. Seoul was deleted by Chris on 2026-10-01 (verified: absent from the project list, both domains still 200). Chris is renaming `roughcutBBQ-staging` to `roughcutBBQ`. The `staging` branch Preview `SUPABASE_URL` points at the prod DB; don't add a secret key there until RC-0.6 gets a new staging project.

## PAUSED 2026-10-02 (Chris asked to pause) - resume here
**Shipped to prod on 2026-10-02:** desktop drag/wheel/momentum on all carousels plus the app-wide motion system (`main` at `7b9c07c`). Verified by Opus over 3 rounds, and Chris approved it ("exactly what we wanted"). `--ease-spring` overshoot kept (Chris liked it).
**Admin login:** there are no per-user admins. One shared `ADMIN_PASSWORD` (Vercel env + the secrets file) logs into `/admin/gallery` and `/admin/gear`; verified 200 on the live site. Per-email superadmin for chris@bsbsbs.au = RC-7.1 (not started).
**Website (M13), branch `rc-13-site` (pushed, not merged; it is NOT a Vercel thing, Hostinger gets `site/dist/`):**
- Done and verified: RC-13.0 (docs), RC-13.1 `4086859` (scaffold, token extractor, 29 parity tests), RC-13.2 `37517b0` (reveal.js, header/footer, mobile nav, 9 site e2e), RC-13.3 `4b0b8d2` (hero, how it works, engine-driven spatchcock sample card, 6 featured cooks; all 22 app links 200). `npm run site:build` -> `site/dist/` (10 files).
- **Next: RC-13.4** (guides/recipes, gallery, gear + disclosure, FAQ, Play flag, JSON-LD, sitemap, OG) -> 13.5 (.htaccess 301 map + content port) -> 13.6 (upload package + backup) -> 13.7 (app `/` H1/SEO) -> 13.8 (Chris uploads; verify by curl) -> 13.9 (Android shell -> /calculator?src=app + missing `public/offline.html`).
- Chris wants the website built by **Fable 5.1** subagents (one issue each); Opus verifies before anything ships.
- **Fix in RC-13.4:** the featured tiles show the known linear-model bug numbers (Pulled pork 15 hrs 24 min @ 4 kg, Brisket 13 hrs 45 min @ 5 kg). Hide times on the affected tiles or pick smaller reference weights until RC-3.4.
- GUESSED, unchecked: `app/globals.css` ~L143 vs ~L211 may let `.reveal` fade-up translate under reduced motion (the same specificity bug RC-13.3 fixed in site.css). Check it in the app.
**Open with Chris:**
- **Amazon:** the old account was deleted; the new Associates ID is `roughcutbbq-22` (confirmed by Chris 2026-10-02). All 52 gear rows still carry the dead `bsbsbs0f-22`. Chris to pick: (1) the paste-an-Amazon-URL admin feature (design in this session: no API until the account is verified for the Creators API; PA-API was retired in May 2026) or (2) just rewrite the 52 links now. Recommend doing the link rewrite first either way.
- **Android:** the shell loads `https://roughcut-bbq.vercel.app` live, so web deploys reach the app without a rebuild. Ask whether it's on Google Play or sideloaded before rebuilding (versionCode 1; keystore `../roughcut-upload.keystore`).
- Analytics choice (PostHog EU recommended); staging secret; Resend key; move the secrets file into a password manager.
- Pre-existing bugs found by Opus: Back-button scroll restoration lands near the top; mobile home hydration #418 (`HeroCarousel` `!isTouch()` hint); a `/calculator` hard load with `bbq_initial_cat` falls back to free mode.
