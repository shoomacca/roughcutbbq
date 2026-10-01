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

## New since the plan
- **BOTS-735 RC-0.10:** demo accounts (after staging).
- **BOTS-736 RC-6.6 (done 2026-10-01):** prod Supabase moved from Seoul `yvavflxtjzlbatrqdyai` to Sydney `xdiapmnocyibpfrfgdcw`. The data was verified identical (row count + md5 per table). The Vercel Production `SUPABASE_URL`/`SUPABASE_SECRET_KEY` now point at Sydney. Still for Chris: delete the Seoul project (the MCP pause was refused because it isn't free-tier), and rename `roughcutBBQ-staging` to e.g. `roughcutBBQ` in the dashboard.
