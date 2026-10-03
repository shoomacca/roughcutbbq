-- =============================================================================
-- 0003_app_settings.sql : admin-editable app settings + Amazon tag switch
--
-- 1. public.app_settings: small key/value table edited from /admin/settings.
--    RLS on, no policies (same convention as 0001/0002): only the service key
--    used by the server can read or write it.
-- 2. Seed amazon_tag = roughcutbbq-22 (the new Associates tracking ID).
--    lib/affiliate.ts applies this tag to every Amazon link at the moment it
--    leaves the server, so changing the setting changes every link without
--    editing gear rows. The app falls back to roughcutbbq-22 if this table or
--    row is missing, so deploying the code before this migration is safe.
-- 3. Rewrite stored gear.affiliate_url from the dead tag bsbsbs0f-22 to
--    roughcutbbq-22 so the raw rows are correct too (belt and braces).
--
-- Idempotent: create if not exists, on conflict do nothing, and the update only
-- touches rows that still contain the old tag.
-- =============================================================================

create table if not exists public.app_settings (
  key        text not null,
  value      text not null,
  updated_at timestamptz not null default now(),
  constraint app_settings_pkey primary key (key)
);

-- RLS on, no policies: only the service key (server) can touch it.
alter table public.app_settings enable row level security;

insert into public.app_settings (key, value)
values ('amazon_tag', 'roughcutbbq-22')
on conflict (key) do nothing;

update public.gear
set affiliate_url = replace(affiliate_url, 'tag=bsbsbs0f-22', 'tag=roughcutbbq-22')
where affiliate_url like '%tag=bsbsbs0f-22%';
