-- =============================================================================
-- 0001_baseline.sql : RoughCut BBQ, baseline schema
-- Production is Supabase project xdiapmnocyibpfrfgdcw (Sydney) since RC-6.6.
-- Captured on 2026-09-30 from the then-live project yvavflxtjzlbatrqdyai (Seoul, retired)
-- (read-only catalog queries: pg_class / pg_attribute / pg_constraint /
-- pg_indexes / pg_proc / pg_views / pg_policies / storage.buckets / ACLs).
-- Ticket: BOTS-664 / RC-0.4.
--
-- Contains schema only. No user data. The only rows are structural:
--   * cook_tally id=1 (increment_cook_tally() updates that row; without it the
--     RPC returns NULL). The live count is not copied; it starts at 0.
--   * the 'gallery' storage bucket.
-- Catalogue data for public.gear lives in supabase/seed/gear.sql.
--
-- Facts about live, recorded as found (not "fixed" here):
--   * RLS is ENABLED on all 9 public tables and there are ZERO policies in
--     public and ZERO on storage.objects. Effect: anon/authenticated get no
--     rows; only service_role (bypasses RLS) can read or write. The app's
--     server code must therefore use the service-role key.
--   * anon/authenticated/service_role hold ALL privileges on every public
--     table, view and sequence (Supabase default ACLs). RLS is what restricts.
--   * The 'gallery' bucket is public with no file_size_limit and no
--     allowed_mime_types. A second public bucket 'deploy' exists live and is
--     intentionally NOT captured here (out of scope for the app schema).
--   * Extensions on live: pgcrypto, uuid-ossp, pg_stat_statements,
--     supabase_vault (Supabase defaults); nothing in public uses them.
--
-- Written to be idempotent and to apply to an empty Supabase project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables (dependency order)
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id            bigint generated always as identity,
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
);

create table if not exists public.gallery_posts (
  id           text not null,
  user_id      bigint,
  before_url   text not null,
  after_url    text not null,
  name         text,
  cut          text not null,
  method       text not null,
  gear_used    text,
  report_count integer not null default 0,
  reported     boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint gallery_posts_pkey primary key (id),
  constraint gallery_posts_user_id_fkey foreign key (user_id) references public.users (id) on delete set null
);

create table if not exists public.gear (
  id              bigint generated always as identity,
  slug            text not null,
  name            text not null,
  category        text not null,
  affiliate_url   text not null default '#',
  image_url       text,
  description     text,
  recommended_for text,
  sort_order      integer not null default 0,
  constraint gear_pkey primary key (id),
  constraint gear_slug_key unique (slug)
);

create table if not exists public.gear_clicks (
  id         bigint generated always as identity,
  gear_slug  text not null,
  clicked_at timestamptz not null default now(),
  constraint gear_clicks_pkey primary key (id)
);

create table if not exists public.post_comments (
  id           bigint generated always as identity,
  post_id      text not null,
  user_id      bigint not null,
  comment_text text not null,
  created_at   timestamptz not null default now(),
  constraint post_comments_pkey primary key (id),
  constraint post_comments_post_id_fkey foreign key (post_id) references public.gallery_posts (id) on delete cascade,
  constraint post_comments_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade
);

create table if not exists public.post_stars (
  user_id bigint not null,
  post_id text not null,
  constraint post_stars_pkey primary key (user_id, post_id),
  constraint post_stars_post_id_fkey foreign key (post_id) references public.gallery_posts (id) on delete cascade,
  constraint post_stars_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade
);

create table if not exists public.saved_cooks (
  id            bigint generated always as identity,
  user_id       bigint,
  session_id    text,
  method        text not null default '',
  meat_category text not null default '',
  cut           text not null default '',
  weight_kg     numeric(6,2) not null default 0,
  result_json   text not null default '{}',
  created_at    timestamptz not null default now(),
  constraint saved_cooks_pkey primary key (id),
  constraint saved_cooks_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade
);

create table if not exists public.subscribers (
  id                bigint generated always as identity,
  email             text not null,
  cut               text,
  method            text,
  weight_kg         numeric(6,2),
  cook_time_minutes integer,
  appliance_temp_c  integer,
  internal_temp_c   integer,
  unsubscribe_token text not null,
  created_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz,
  constraint subscribers_pkey primary key (id),
  constraint subscribers_email_key unique (email),
  constraint subscribers_unsubscribe_token_key unique (unsubscribe_token)
);

create table if not exists public.cook_tally (
  id         integer not null default 1,
  count      bigint not null default 0,
  updated_at timestamptz not null default now(),
  constraint cook_tally_pkey primary key (id),
  constraint cook_tally_id_check check ((id = 1))
);

-- ---------------------------------------------------------------------------
-- Indexes (non-constraint; pkey/unique indexes come from the constraints)
-- ---------------------------------------------------------------------------

create index if not exists idx_gallery_created     on public.gallery_posts using btree (created_at desc);
create index if not exists idx_gear_clicks_slug    on public.gear_clicks   using btree (gear_slug);
create index if not exists idx_saved_cooks_session on public.saved_cooks   using btree (session_id);
create index if not exists idx_saved_cooks_user    on public.saved_cooks   using btree (user_id);

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

create or replace view public.gallery_with_counts
  with (security_invoker = true)
as
 SELECT id,
    user_id,
    before_url,
    after_url,
    name,
    cut,
    method,
    gear_used,
    report_count,
    reported,
    created_at,
    ( SELECT count(*) AS count
           FROM post_stars s
          WHERE s.post_id = p.id) AS star_count,
    ( SELECT count(*) AS count
           FROM post_comments c
          WHERE c.post_id = p.id) AS comment_count
   FROM gallery_posts p;

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_cook_tally()
 RETURNS bigint
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.cook_tally set count = count + 1, updated_at = now() where id = 1 returning count;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- Event trigger "ensure_rls" (live: owner postgres, ddl_command_end,
-- tags CREATE TABLE / CREATE TABLE AS / SELECT INTO). Guarded so re-runs and
-- environments where it already exists are a no-op.
do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls
      on ddl_command_end
      when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      execute function public.rls_auto_enable();
  end if;
end
$$;

-- Table triggers: none exist in public on live (0 user triggers).

-- ---------------------------------------------------------------------------
-- Row level security: enabled on every table, exactly as live.
-- Policies: NONE on live (public.* and storage.objects). Do not add any here;
-- a policy change is a separate, reviewed migration.
-- ---------------------------------------------------------------------------

alter table public.users         enable row level security;
alter table public.saved_cooks   enable row level security;
alter table public.cook_tally    enable row level security;
alter table public.subscribers   enable row level security;
alter table public.gallery_posts enable row level security;
alter table public.gear          enable row level security;
alter table public.gear_clicks   enable row level security;
alter table public.post_stars    enable row level security;
alter table public.post_comments enable row level security;

-- ---------------------------------------------------------------------------
-- Grants (as found on live; identical for anon, authenticated, service_role)
--   tables/views: arwdDxtm = ALL   sequences: rwU = ALL   functions: EXECUTE
-- ---------------------------------------------------------------------------

grant all on table
  public.users, public.saved_cooks, public.cook_tally, public.subscribers,
  public.gallery_posts, public.gear, public.gear_clicks, public.post_stars,
  public.post_comments, public.gallery_with_counts
to anon, authenticated, service_role;

grant all on sequence
  public.users_id_seq, public.saved_cooks_id_seq, public.subscribers_id_seq,
  public.gear_id_seq, public.gear_clicks_id_seq, public.post_comments_id_seq
to anon, authenticated, service_role;

-- Live ACL on both functions: {=X/postgres, postgres, anon, authenticated, service_role}
-- i.e. PUBLIC (default) plus explicit grants; kept as found.
grant execute on function public.increment_cook_tally() to public, anon, authenticated, service_role;
grant execute on function public.rls_auto_enable()      to public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Structural row: the single cook_tally row the RPC updates.
-- ---------------------------------------------------------------------------

insert into public.cook_tally (id, count) values (1, 0) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Storage: 'gallery' bucket (public, no size limit, no mime allow-list).
-- storage.objects / storage.buckets have RLS enabled and 0 policies on live.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;
