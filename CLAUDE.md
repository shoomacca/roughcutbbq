# RoughCut BBQ — canonical repo

**This folder is the ONLY place RoughCut BBQ code is edited.** Every sibling folder
(`../roughcut-bbq-v2`, `../roughcutbbq-main`, `../../bbq-pro*`, `../../bbq-calculator`)
is history. Do not edit them and do not copy from them without checking this repo first.

- Plan and status: `.planning/BLUEPRINT.md` (milestones M0–M12, decisions D1–D8, answered 2026-10-01 in §5).
- Git identity (repo-local, already set): `shoomacca <shoomacca@gmail.com>`. Vercel blocks
  deploys from any other author.
- Production: Vercel project `roughcut-bbq`; DB and storage: Supabase `xdiapmnocyibpfrfgdcw`
  (Sydney; production since RC-6.6. There is no staging project until RC-0.6 creates one).
  Server secrets are read via `cfg()` in `lib/runtime-config.ts`; never import it
  or `lib/supabase.ts` from client components. Never use `NEXT_PUBLIC_` for a secret.
- Admin auth = httpOnly `admin_token` cookie via `/api/admin/login` (`isAdminRequest()`).
- Never commit `android/key.properties`, keystores or `.env*` (except `.env.local.example`).
- M0 must finish before anything else ships (admin password rotation comes before any push to
  the public GitHub repo).
