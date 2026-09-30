# supabase/

Database schema for RoughCut BBQ (Supabase project `yvavflxtjzlbatrqdyai`).

## How the baseline was captured

`migrations/0001_baseline.sql` was reconstructed on 2026-09-30 from the live database using read-only catalog queries (`pg_class`, `pg_attribute`, `pg_constraint`, `pg_indexes`, `pg_proc`/`pg_get_functiondef`, `pg_views`, `pg_policies`, ACLs, `storage.buckets`). No DDL or DML was run against live and no user rows were read. It replaces the old MySQL-era `lib/migrations/`.

It covers the `public` tables, the `gallery_with_counts` view (`security_invoker`), the `increment_cook_tally` and `rls_auto_enable` functions plus the `ensure_rls` event trigger, RLS flags, grants, and the `gallery` storage bucket. Live has no RLS policies at all (public or storage), so none are in the file.

## How to apply

- New/empty Supabase project or branch: run the file in the SQL editor, or `supabase db push` after linking the project (the CLI picks up `supabase/migrations/`).
- It is idempotent (`if not exists`, `create or replace`, `on conflict do nothing`), so re-running is safe.
- Then load the catalogue: run `seed/gear.sql`.

Do NOT apply to the live production project; it already has this schema.

## Data

There is no data in the baseline except two structural rows: `cook_tally` id=1 (count 0, required by `increment_cook_tally()`) and the `gallery` bucket. The only seed is `seed/gear.sql` (52 gear catalogue rows). No users, saved cooks, subscribers, gear clicks, gallery posts or comments are included.

## Not verified

Applying the file to an empty database has not been tested (no local Postgres was available when it was written). Do that on a throwaway branch/project before relying on it (RC-0.6).
