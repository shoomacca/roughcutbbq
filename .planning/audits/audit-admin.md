# RoughCut BBQ: sponsors, store items and the admin (audit)

**Date:** 2026-09-30. **Scope:** a read-only audit of the canonical repo `RoughCut/roughcut-bbq` (HEAD `7dc7c22`), the live site `roughcut-bbq.vercel.app` (GET requests only) and Supabase `yvavflxtjzlbatrqdyai` (SELECT only on `gear`, `gear_clicks`, `pg_policies`, `pg_indexes`, `information_schema` and `storage.buckets`).

**Tags:** **[M]** means measured: a line was read, a query was run or a request was made, and the evidence is cited. **[G]** means guessed: judgement, domain knowledge or a policy recalled from memory that I did not check here.

**What I could not verify from here (you need to check):**
- The Amazon Associates AU Operating Agreement and Program Policies were **not fetched**. Every Amazon rule below is **[G]**.
- The ACCC guidance was not fetched either. It is **[G]**.
- Vercel env vars, the Amazon Associates dashboard (earnings, and whether the tag is attributed) and the Resend domain.

**Important context [M]:** live production does **not** run the canonical code yet.
- `GET https://roughcut-bbq.vercel.app/api/admin/login` returns **404**, and `/cook/smoker/pork_shoulder` returns **404**, although both routes exist in canonical.
- So the admin/auth findings below describe canonical code, which is not deployed yet.
- The catalogue data flow (`/api/gear`, `/gear`, `/go`) behaves the same on live: `/api/gear` returns the 52 DB rows.

---

## 1. Pros (what already works)

| # | Pro | Evidence |
|---|---|---|
| P1 | One redirect layer. Every affiliate link on every surface goes through `/go/[slug]`, so the URL can be changed centrally for the **DB** rows | [M] `app/go/[slug]/route.ts:16`. All renderers link `/go/${slug}` (gear 63, rubs 60, GearRecommendation 63, IdeasClient 302/326, cook page 273, subscribe 98) |
| P2 | `/go` fails safe: it tries the DB, then the static list, then `/gear` | [M] `app/go/[slug]/route.ts:25-34` |
| P3 | The slug is immutable on PATCH, which protects public URLs | [M] `app/api/admin/gear/route.ts:41` |
| P4 | Admin writes are field-whitelisted and server-gated with `isAdminRequest()`. A duplicate slug returns 409 | [M] `app/api/admin/gear/route.ts:5-13,16,25,36,53` |
| P5 | Admin session design (canonical): server-side password check, sha256 + `timingSafeEqual`, an HMAC-signed httpOnly cookie with a 24 h TTL, and `JWT_SECRET` required in prod | [M] `app/api/admin/login/route.ts:16-43`, `lib/auth.ts:7-15,77-105` |
| P6 | Every one of the 52 DB rows carries `tag=bsbsbs0f-22` | [M] SQL: `tagged` = n in all 11 categories |
| P7 | RLS is enabled on all 9 public tables with zero policies. The anon/publishable key can read nothing; only the service key used server-side can | [M] `pg_class.relrowsecurity=true`, `pg_policies` is empty |
| P8 | Store pages are client-rendered from `/api/gear`, which answers `Cache-Control: no-store`. Admin edits therefore show on `/gear`, `/rubs`, `/results` and `/gallery` on the next page load, with no revalidation needed | [M] live response headers `Cache-Control: no-store, no-cache`, `X-Vercel-Cache: MISS` |
| P9 | Disclosure text exists on most commercial surfaces, and the footer is sitewide | [M] `components/Footer.tsx:38` (rendered by `app/layout.tsx:44`), `app/gear/page.tsx:186`, `app/rubs/page.tsx:183`, `IdeasClient.tsx:337`, cook page 284, `GearRecommendation.tsx:76` |
| P10 | `gear.slug` has a unique index and `gear_clicks.gear_slug` is indexed | [M] `pg_indexes` |

## 2. Cons and issues

Severity: **H** = loses money, breaks compliance or security. **M** = the owner's edits don't take effect or the data is wrong. **L** = polish.

| # | Sev | Issue | Evidence |
|---|---|---|---|
| C1 | **H** | **Two sources of truth that disagree.** The static files hold 27 gear + 30 rubs = 57 items; the DB holds 52. **5 static items are missing from the DB**: `jack-daniels-chips`, `lanes-championship`, `bad-byrons-butt-rub`, `lanes-bird-rub`, `lanes-fish-rub`. The other 52 match field-for-field (0 diffs in name, category, description, URL) | [M] `tsx` diff of `data/gear.ts` + `data/rubs.ts` against live `/api/gear` (scratchpad `cmp.ts`) |
| C2 | **H** | **Admin edits don't reach /ideas or the 257 SEO cook pages.** Both import the static `GEAR`/`RUBS` directly. The admin page tells the owner otherwise ("Changes go live immediately on … /ideas gear picks"), which is false | [M] `components/ideas/IdeasClient.tsx:7-8,151,159-163`, `app/cook/[method]/[cut]/page.tsx:15,120-122`; claim at `app/admin/gear/page.tsx:188` |
| C3 | **H** | **Deleting a product doesn't remove it.** If the slug exists in the static files, `/go` still redirects to the static URL, and /ideas and /cook still render the item. You can't retire a product or a sponsor without a code change | [M] `app/go/[slug]/route.ts:26-30`; the delete confirm text admits it (`app/admin/gear/page.tsx:108`) |
| C4 | **H** | **Contextual recommendation is dead.** `recommended_for` is NULL on all 52 rows, so the method filter never matches and falls back to the whole list sorted by `sort_order`. As a result: the results page always shows **MEATER Plus** (sort 1); the gallery always shows the 3 first thermometers; the cook-plan email always links MEATER Plus (the "thermometer" lookup also reads `recommended_for`). The admin UI has no input for `recommended_for`, although the API accepts it | [M] SQL `with_rf=0` in every category; `GearRecommendation.tsx:33-43`; `app/api/subscribe/route.ts:36-46`; `app/gallery/page.tsx:469`; `app/results/page.tsx:256`; admin inputs at `app/admin/gear/page.tsx:194-200,219-226` (no `recommended_for`). Consistent with `gear_clicks`: 4 of 7 real clicks are `meater-plus` |
| C5 | **H** [G on policy] | **Affiliate link in email.** The cook-plan email links `/go/<slug>`, which redirects to an Amazon Special Link. Amazon Associates policies prohibit Special Links in emails [G: policy recalled, not fetched]. A redirect probably doesn't cure that [G]. The email also has **no affiliate disclosure** | [M] `app/api/subscribe/route.ts:97-98,112-113`; `emails/CookPlanEmail.tsx:79-92` (no disclosure text in 79-100) |
| C6 | **H** [G on policy] | **Product images are scraped from Amazon HTML.** The image is the first search-result thumbnail, so it may not even show the named product. Associates rules require product content via PA-API/SiteStripe only [G] | [M] `app/api/og-image/route.ts:9-46`; live test returned `m.media-amazon.com/...` thumbnails for 2 search URLs. Called once per row from `app/gear/page.tsx:18-23` and `app/rubs/page.tsx:18-23` |
| C7 | **H** | **Open fetch proxy (SSRF).** `/api/og-image?url=` fetches **any** URL server-side, with no host allowlist | [M] `app/api/og-image/route.ts:5-9` |
| C8 | **M** | **"No ads" promises conflict with sponsors.** Adding paid placements would make these statements misleading [G: ACL s18 risk] | [M] `app/layout.tsx:26`, `app/page.tsx:8`, `IdeasClient.tsx:181,338` |
| C9 | **M** | **Admin fields are too thin for a store or sponsors.** Missing: image, active/enabled flag, schedule, placement, sponsor/brand, price, badge, featured, disclosure type and notes. `image_url` exists in the DB but is not writable (not in `FIELDS`) and unused (NULL ×52) | [M] `app/api/admin/gear/route.ts:5`; SQL `with_image=0` |
| C10 | **M** | **No URL validation.** The API accepts any `affiliate_url`: non-https, a non-Amazon host, a missing `tag=`, or `'#'`. The tag rule is only placeholder text in the UI | [M] `app/api/admin/gear/route.ts:19-20,40`; `app/admin/gear/page.tsx:189,199` |
| C11 | **M** | **All 52 links are Amazon *search* URLs (`/s?k=`), not product (ASIN) links.** Weaker conversion [G]. There is at least one typo: `ThermoWorks+Therapen+ONE`. `plowboys-yardbird-beef` and `-pork` share one URL | [M] SQL `search_urls` = n everywhere; row id 2; duplicate-URL diff |
| C12 | **M** | **Shared-password admin.** There is one secret with no identity, no login rate limit and no revocation: logout clears only the cookie, and a token stays valid until `exp`. There is no audit log | [M] `app/api/admin/login/route.ts` (no limiter), `lib/auth.ts:80-99` (stateless, `role:'admin'` only); grep `ratelimit` has 0 hits |
| C13 | **M** | **`/go` click log problems.** The insert is `await`ed although the comment says fire-and-forget, so it adds latency to every redirect. Unknown slugs are logged: a `test-widget` row exists that is not in the DB. There are no page/placement/referrer/UA columns, no bot filter and no dedupe. Clicks that use the static fallback are logged only if the DB is up | [M] `app/go/[slug]/route.ts:19-20`; SQL `gear_clicks` groups (7 rows, one `not_in_db=true`); columns = id, gear_slug, clicked_at |
| C14 | **M** | **SEO/SSR sees the static list, not the DB.** `/gear` and `/rubs` SSR-render the static array, then swap to DB rows after hydration. The live `/gear` HTML contains `jack-daniels-chips`, which isn't in the DB. The result is a layout flash, and crawlers index items the owner may have deleted | [M] `app/gear/page.tsx:93`, `app/rubs/page.tsx:90`; `curl /gear \| grep jack-daniels-chips` hit |
| C15 | **M** | **Gallery moderation is delete-only.** There is no hide/restore, no "dismiss report" and no queue of auto-hidden posts beyond `report_count>0`. The flagged list endpoint is public. Reports are not per-user (anyone can re-POST) | [M] `app/admin/gallery/page.tsx:37,68-86`; `app/api/gallery/route.ts:26-33` (no admin check); `app/api/gallery/report/route.ts:17-21` |
| C16 | **L** | **Category mismatches.** The static categories and the DB categories are separate lists, and admin free-text categories create new tabs. The `/gear` emoji map has `Cookware` while the data uses `Cookware & Storage`. The rub/gear split relies on a hard-coded `RUB_CATEGORIES` set, so a new rub category typed in admin would appear on **/gear**, not /rubs | [M] `app/gear/page.tsx:7,51-58,101`; `app/rubs/page.tsx:6,98`; `data/gear.ts` `GEAR_CATEGORIES` |
| C17 | **L** | **Inconsistent `rel` and brand on links.** `GearRecommendation` links lack `sponsored`/`nofollow`, and /gear and /rubs use `nofollow` rather than `sponsored`. The brand text differs too ("BBQ Calculator" vs "RoughCut BBQ" vs "Rough Cut BBQ") | [M] `GearRecommendation.tsx:65`, `app/gear/page.tsx:65,142,186`, `app/rubs/page.tsx:62` |
| C18 | **L** | **Per-cut `rubs`/`woods` in `meats.json` are free-text recipes, not product references,** so they can never link to or sell a product. 80 `"rubs"` keys | [M] `data/meats.json:70-79`; rendered at `components/calculator/ResultsCard.tsx:154,229-253`, cook page 220-224 |
| C19 | **L** | **Dead code.** `lib/bbqData.ts:177` `affiliateProducts` points at `https://amazon.com/` and has no importers | [M] grep: only the definition |
| C20 | **L** | **Schema not in migrations.** `lib/migrations/005_gear.sql` is MySQL (`AUTO_INCREMENT`) with a different seed, while the live table is Postgres `bigint identity ALWAYS`. You can't rebuild the table from the repo (see blueprint M0.5) | [M] `lib/migrations/005_gear.sql:2`, `005_gear_seed.sql`; `information_schema` identity = ALWAYS |

## 3. Current data-flow map

```
                 ┌──────────────── STATIC (compiled into the bundle) ────────────────┐
                 │ data/gear.ts  GEAR[27]      data/rubs.ts  RUBS[30]                 │
                 │ data/meats.json  cut.rubs[] / cut.woods[]  (free text, no links)   │
                 └──────┬─────────────┬──────────────┬──────────────┬────────────────┘
                        │             │              │              │
   SSR first paint of   │  /ideas     │ /cook/[m]/[c]│  /go fallback│ ResultsCard + cook page
   /gear & /rubs        │  (only)     │ (only, 257   │  (if DB miss)│ "Rub ideas"/"Wood pairings"
   (gear 93, rubs 90)   │  Ideas 7-8, │ SSG pages)   │  go 26-30    │ (text only)
                        │  151,159    │ cook 120-122 │              │
                 ┌──────┴─────────────┴──────────────┴──────────────┴────────────────┐
                 │ SUPABASE public.gear [52 rows]  ◄── /api/admin/gear POST/PATCH/DELETE│
                 │  (id, slug, name, category, affiliate_url, image_url, description,   │
                 │   recommended_for, sort_order)       ▲ admin UI app/admin/gear      │
                 └──────┬────────────────────────┬──────────────────────┬──────────────┘
                        │ GET /api/gear (no-store)│ subscribe route      │ /go/[slug]
                        ▼                         ▼ (server, 26-46)      ▼ (route 16) + INSERT gear_clicks(slug)
   /gear  (client swap, drops rub cats)     Cook-plan email → /go/<slug>     302 → amazon.com.au/s?k=…&tag=bsbsbs0f-22
   /rubs  (client swap, rub cats only)      (always MEATER+ today, C4)
   /results  <GearRecommendation limit=1>   (always MEATER+ today, C4)
   /gallery  <GearRecommendation limit=3>   (first 3 thermometers)
   /admin/gear (list)
   Product images: /gear & /rubs → /api/og-image?url=<affiliate_url> → scrape Amazon HTML (C6/C7)
```

**Does an admin edit show up everywhere? [M]**

| Surface | Reads | Edit visible? | Delete removes it? |
|---|---|---|---|
| `/gear`, `/rubs` (after hydration) | DB | Yes, next load | Yes (SSR HTML still shows the static list, C14) |
| `/results`, `/gallery` widget | DB | Yes | Yes |
| Cook-plan email | DB | Yes | Yes |
| `/go/[slug]` redirect | DB, then static | Yes | **No** if the slug is in the static files (C3) |
| `/ideas` | static | **No** | **No** |
| `/cook/[method]/[cut]` (257 SSG pages) | static | **No** | **No** |
| Per-cut rubs/woods text | `meats.json` | n/a (not products) | n/a |

## 4. What "sponsors" could mean here

| Type | Example | What it needs |
|---|---|---|
| **Affiliate product** (today) | an Amazon AU item via `tag=bsbsbs0f-22` | product, link, placement; label "Affiliate link" |
| **Sponsored/featured product slot** | a charcoal brand pays to be the #1 pick in "Charcoal & Wood" or on smoker results | placement assignment with a sponsor, a schedule and **"Sponsored"** label, and its own tracking |
| **Brand/local sponsor** | a butcher ("Order your brisket from X") | sponsor record, logo in Storage, direct (non-Amazon) URL with UTM, geo/cut targeting |
| **Sponsored content** | "Brisket guide presented by X", a sponsored recipe | a `sponsor_id` on guide/recipe content, a byline disclosure, `rel="sponsored"` |
| **Banner/creative** | a home or results banner, the email footer slot | creative (image + alt + headline + CTA), slot, schedule, impressions and clicks |

**Disclosure rules to encode:**
- **[G]** Amazon Associates needs a clear statement ("As an Amazon Associate I earn from qualifying purchases") near the links, plus:
  - no Special Links in email or offline material
  - no Amazon prices unless they come from PA-API and are fresh
  - images only via PA-API or SiteStripe
- **[G]** Under the ACL (s18 misleading conduct), and following the ACCC's guidance on disclosing commercial relationships, paid placements must be clearly and prominently labelled "Sponsored"/"Advertisement". The label must be distinct from "Affiliate link" and must not be buried in a footer.
- **[G]** Google treats paid links as needing `rel="sponsored"`.
- **You need to check** all three against the current official text before M-F ships.

## 5. Proposed data model (Postgres/Supabase SQL sketch)

This design **evolves `gear` in place** and keeps `id`/`slug` so every `/go/<slug>` URL survives. All reads stay server-side, as today.

```sql
-- ── Identity: superadmin via Supabase Auth ───────────────────────────────
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('superadmin','editor')) default 'superadmin',
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ── Sponsors / brands ─────────────────────────────────────────────────────
create table public.sponsors (
  id bigint generated always as identity primary key,
  name text not null,
  kind text not null check (kind in ('amazon_affiliate','brand','retailer','butcher','other')),
  website_url text,
  logo_path text,                        -- storage: catalog/sponsors/<id>/logo.webp
  contact_email text,                    -- admin-only; never selected by public code
  contract_notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Products (evolve existing gear) ───────────────────────────────────────
alter table public.gear
  add column sponsor_id bigint references public.sponsors(id),
  add column kind text not null default 'gear' check (kind in ('gear','rub','fuel','service')),
  add column status text not null default 'published' check (status in ('draft','published','archived')),
  add column image_path text,            -- storage object path; replaces og-image scraping
  add column image_alt text,
  add column asin text,                  -- enables ASIN links + health checks
  add column retailer text not null default 'amazon_au',
  add column disclosure text not null default 'affiliate' check (disclosure in ('affiliate','sponsored','none')),
  add column badge text,                 -- 'Editor''s pick', 'Aussie made', …
  add column price_note text,            -- free text, NOT a scraped Amazon price
  add column methods text[] not null default '{}',   -- replaces comma text recommended_for
  add column cut_categories text[] not null default '{}',
  add column updated_at timestamptz not null default now(),
  add column updated_by uuid references auth.users(id);
alter table public.gear add constraint affiliate_url_https check (affiliate_url ~ '^https://');
-- Enforced in the API as well: amazon.com.au URLs must carry tag=bsbsbs0f-22.

create table public.categories (           -- replaces the hard-coded RUB_CATEGORIES / CAT_EMOJI
  slug text primary key, label text not null, store text not null check (store in ('gear','rubs')),
  emoji text, sort_order int not null default 0
);
alter table public.gear add column category_slug text references public.categories(slug);

-- ── Placements (slot = page + position) ───────────────────────────────────
create table public.placements (
  key text primary key,                  -- 'results.pitmaster_box', 'ideas.method_gear', 'cook.gear',
                                         -- 'gear.top_featured', 'rubs.top_featured', 'gallery.sidebar',
                                         -- 'email.cook_plan', 'home.banner', 'guide.inline'
  label text not null, page text not null,
  max_items int not null default 3,
  allows_sponsored boolean not null default true,
  allowed_in_email boolean not null default false   -- blocks Amazon links in email (C5)
);

create table public.placement_items (
  id bigint generated always as identity primary key,
  placement_key text not null references public.placements(key) on delete cascade,
  gear_id bigint references public.gear(id) on delete cascade,
  creative_id bigint,                    -- fk added below (banner instead of product)
  sponsor_id bigint references public.sponsors(id),
  label text not null default 'affiliate' check (label in ('affiliate','sponsored','editorial')),
  priority int not null default 100,     -- lower first; ties broken by weight
  weight int not null default 1,         -- rotation among equal priority
  starts_at timestamptz, ends_at timestamptz,
  targeting jsonb not null default '{}', -- {"methods":["smoker"],"cut_categories":["beef"]}
  status text not null default 'draft' check (status in ('draft','scheduled','live','paused','ended')),
  utm_campaign text,
  created_at timestamptz not null default now(),
  check (num_nonnulls(gear_id, creative_id) = 1),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index on public.placement_items (placement_key, status, starts_at, ends_at);

create table public.creatives (          -- banners / sponsored content cards
  id bigint generated always as identity primary key,
  sponsor_id bigint references public.sponsors(id),
  headline text not null, body text, cta_text text, target_url text not null,
  image_path text, image_alt text,
  created_at timestamptz not null default now()
);
alter table public.placement_items add foreign key (creative_id) references public.creatives(id) on delete cascade;

-- ── Tracking ─────────────────────────────────────────────────────────────
alter table public.gear_clicks
  add column placement_key text,
  add column page_path text,
  add column sponsor_id bigint,
  add column referrer_host text,
  add column ua_family text,             -- parsed; never store full UA with IP
  add column is_bot boolean not null default false,
  add column visitor_hash text,          -- sha256(ip + ua + daily salt): dedupe without PII
  add column country text;               -- from x-vercel-ip-country
create index on public.gear_clicks (clicked_at);
create unique index gear_clicks_dedupe on public.gear_clicks
  (gear_slug, coalesce(placement_key,''), visitor_hash, (date_trunc('hour', clicked_at at time zone 'UTC')))
  where visitor_hash is not null;        -- 1 click / visitor / slot / hour

create table public.impressions_daily (   -- aggregated; 1 upsert per (day, slot, item)
  day date not null, placement_key text not null, item_id bigint not null,
  views int not null default 0, primary key (day, placement_key, item_id)
);

-- ── Link health ──────────────────────────────────────────────────────────
create table public.link_checks (
  id bigint generated always as identity primary key,
  gear_id bigint not null references public.gear(id) on delete cascade,
  checked_at timestamptz not null default now(),
  http_status int, final_url text, has_tag boolean, ok boolean, note text
);

-- ── Audit log ────────────────────────────────────────────────────────────
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid references auth.users(id),
  entity text not null, entity_id text not null,
  action text not null check (action in ('create','update','delete','publish','unpublish')),
  before jsonb, after jsonb
);
-- A trigger on gear / placement_items / sponsors / creatives writes before/after rows.

-- ── RLS ──────────────────────────────────────────────────────────────────
-- Keep today's model: RLS on, no anon policies; public reads go through server code.
-- Admin writes use the *user's* JWT (not the service key) so RLS applies:
alter table public.sponsors enable row level security;         -- (repeat for each new table)
create policy admin_all on public.sponsors for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- Tables: gear, categories, placements, placement_items, creatives, link_checks, audit_log.
-- audit_log: select for is_admin(); no update/delete policy (append-only via trigger).
-- gear_clicks / impressions_daily: insert only from server (service key); select is_admin().

-- ── Storage ──────────────────────────────────────────────────────────────
-- New bucket 'catalog' (public read, 2 MB limit, image/webp|png|jpeg|avif),
-- write policy: bucket_id='catalog' and public.is_admin().
-- Today there are 2 buckets, both public and with no size/MIME limits [M]: gallery, deploy.
```

**Resolution rule for a slot [G, design]:**
1. Take the `live` items whose time window includes `now()` and whose targeting matches.
2. Order them by `priority`, then weighted random.
3. Cut to `max_items`.
4. If the slot comes up short, fill it from editorial products that match `methods`/`cut_categories`.

The label shown is the item's `label`. "Sponsored" can never be downgraded to "Affiliate" in the UI.

## 6. Options comparison

| Option | Effort [G] | Run cost [G] | Fit | Lock-in | Main cons |
|---|---|---|---|---|---|
| **(a) Extend the custom Next admin on Supabase** | M: ~4-6 sessions for M-A..M-E | $0 extra | Best. Data stays next to `gear_clicks`, with SQL joins for sponsor reports, and the `/go` redirect already exists | None | You build forms, image upload and preview yourself |
| (b1) **Payload CMS 3** in the same Next app (Postgres adapter pointed at Supabase) | M-L | $0 self-hosted | Good editor UX, drafts, versions, uploads and access control out of the box | Medium: Payload owns its own tables/migrations and its **own auth/users** (a second auth system beside Supabase Auth). Next 16 compatibility unverified [G] | Heavy dependency for one admin and ~60 rows; build time and bundle grow; the schema is duplicated or migrated |
| (b2) **Sanity** | M | Free tier likely enough [G] | Great preview/Presentation tool | High: content moves out of Supabase; clicks and sponsors are split across two systems | Joins for reporting need an export; a second vendor |
| (b3) **Directus** on Supabase Postgres | M | Needs a separate host (Docker/VPS or Directus Cloud) [G] | Introspects the existing tables and gives an instant admin | Low-medium | Another server to run and patch; its own auth; licence terms for larger orgs [G] |
| (b4) **Supabase Studio** as the admin | ~0 | $0 | Works today | None | No validation (tag, https), no preview, no audit, raw table editing; one wrong UPDATE breaks every link. Fine as an emergency tool, not a UX |
| (c) **Airtable/Google Sheets** as the source | S-M | Free to $ | The owner likes spreadsheets | Medium | Needs a sync job or runtime API calls (rate limits, latency); no referential integrity; secrets for another API; image hosting is awkward; the audit trail lives elsewhere |

**Recommendation: (a) [G, judgement].** The catalogue is small (52 rows [M]), there is a single admin, the data and the tracking already live in Supabase, and the missing features (placements, schedules, labels, link checks) are domain-specific. A CMS would still need custom code for all of those. Payload is the runner-up if the owner later wants rich editorial content (sponsored guides); it can be added then.

**How (a) should be done:**
- **Auth:** Supabase Auth with a magic link or passkey, a row in `admin_users`, and `is_admin()` checks in RLS **and** in a `requireAdmin()` server helper. Admin mutations run as Server Actions with the user's JWT. Retire `ADMIN_PASSWORD`/`admin_token`.
  - This aligns with blueprint D3 [M: `.planning/BLUEPRINT.md` §5].
  - It also gives per-person identity for the audit log, revocation (sign out all sessions) and MFA.
- **Rendering and cache:**
  - Move `/gear`, `/rubs`, `/ideas` gear picks, `/cook/*` gear and the results "Pitmaster Box" to **server components** reading a single `getPlacement(key, ctx)` / `getCatalog()` wrapped in Next's cache with tag `catalog`.
  - Each admin mutation calls `revalidateTag('catalog')`. In Next 16 the signature takes a cache-life profile, and `updateTag` gives read-your-writes inside Server Actions [G: from memory of Next 16 release notes; check the docs].
  - The 257 SSG cook pages pick up changes without a rebuild.
  - Scheduled start/end: either set the cache to `revalidate: 300`, or have a Vercel Cron call `revalidateTag` every 5 min so windows open and close on time.
- **Preview before publish:**
  - Rows have a `status` of `draft`/`published`.
  - A `/admin/preview?slot=results.pitmaster_box&method=smoker&cut=beef` route renders the real component with drafts included.
  - Alternatively, use Next Draft Mode (a cookie set by an admin-only route) so any public page shows drafts to the admin only.
- **Static files become a build-time snapshot only:**
  - Remove the `GEAR`/`RUBS` imports from pages.
  - `/go` keeps a JSON snapshot fallback, generated from the DB, for when the DB is down.
  - A deleted or archived product in the DB then 302s to `/gear`, which fixes C3.

## 7. Superadmin UX (screens)

| Screen | What it does |
|---|---|
| **Sign in** `/admin/login` | Supabase magic link or passkey; non-admins see "not authorised" |
| **Dashboard** `/admin` | Clicks today/7d/30d (bots excluded); top items; top placements; broken-link count; sponsor items ending in the next 7 days; recent audit entries |
| **Products** `/admin/products` | Table with search, filters (category, status, sponsor, disclosure, health) and inline status toggle; bulk publish/archive; drag to reorder within a category |
| **Product editor** `/admin/products/[id]` | Name, slug (locked after create), category (select, not free text), kind, description, badge, price note, methods/cut chips, retailer, ASIN, URL; the URL is validated live (https, Amazon host, tag present) and "Build link from ASIN" writes `https://www.amazon.com.au/dp/<ASIN>?tag=bsbsbs0f-22`; image upload (drag and drop, resized to WebP, alt text required); disclosure type; sponsor; a preview card of how it looks in each slot; save draft or publish |
| **Categories** `/admin/categories` | Label, emoji, store (gear/rubs), order. Removes the hard-coded category sets (C16) |
| **Placements** `/admin/placements` | One card per slot (Results "Pitmaster Box", Ideas method gear, Cook page gear, /gear featured, /rubs featured, Gallery, Home banner, Guide inline, Email). Each slot shows what is live now, what is scheduled next and what fills from editorial; add item or creative, set priority, weight, targeting (method/cut), start/end and label |
| **Sponsors** `/admin/sponsors` | Sponsor record with a logo upload; contract notes; its items and creatives; a report per date range (impressions, clicks, CTR by slot) with CSV export for invoicing |
| **Creatives** `/admin/creatives` | Banner and sponsored-content cards: image, headline, CTA, target URL with a UTM builder; preview |
| **Link health** `/admin/links` | Last check per product (status, redirect target, tag present); "check now"; history. Fed by a daily cron |
| **Clicks** `/admin/analytics` | By day × slug × placement × page; bot and dedupe toggles; which Amazon items get clicks versus which earn (the earnings figure is entered manually or imported from the Associates CSV, because there is no API [G]) |
| **Gallery moderation** `/admin/gallery` | Queue of reported and auto-hidden posts; hide, restore, dismiss reports, delete (also removes the images); ban uploader |
| **Audit log** `/admin/audit` | Who, when, entity, before→after diff; filter by entity |

## 8. Analytics: `gear_clicks` today and what's missing

**Records today [M]:**
- Columns: `id`, `gear_slug`, `clicked_at`. There are 7 rows in total: `meater-plus` ×4, `killer-hogs-bbq-rub` ×1, `killer-hogs-tx-brisket` ×1, `test-widget` ×1 (not a real product). The last click was 2026-07-17.
- The client-side `trackEvent('gear_clicked')` exists only in `GearRecommendation.tsx:66`, and PostHog is never initialised, so it goes nowhere [M: re-verified today. `grep "posthog.init\|posthog-js"` over app, components, lib and package.json returns 0 hits; `lib/posthog.ts` only calls `window.posthog` if it happens to exist].

**Missing:**

| Missing | Why it matters | Fix |
|---|---|---|
| placement / page / referrer | Can't tell a sponsor which slot performed, or whether the email or the results page drives revenue | Links become `/go/<slug>?p=<placement_key>`; the route reads `p` + `Referer` path |
| bot filtering | Crawlers follow `/go` links (the store pages use plain `<a>`) and would inflate sponsor reports [G] | UA regex plus the Vercel bot header; set `is_bot`, exclude it in reports; add `Disallow: /go/` in robots.txt |
| dedupe | Refreshes and double-taps count twice | `visitor_hash` (salted daily hash) + a unique index per hour |
| impressions | No CTR, which sponsors pay on | Server-rendered slots increment `impressions_daily` (batched), or an IntersectionObserver beacon to `/api/imp` |
| unknown-slug guard | `test-widget` was logged | Only insert when a product resolved |
| latency | The redirect waits on the insert | Use `after()` (Next 15+) or `waitUntil` so logging runs after the response |
| sponsor/UTM | Direct sponsors need their own UTM tags in their analytics | Append `utm_source=roughcutbbq&utm_medium=<placement>&utm_campaign=<placement_item.utm_campaign>` for non-Amazon targets only (never alter Amazon Special Links [G]) |

## 9. Proposed issues, grouped into milestones

These fit the blueprint as detail for **M6** (6.1 Pitmaster Box, 6.2 affiliate dashboard, 6.4 admin hardening and audit log) and **M1.4** (disclosures). **M0 must land first** (rotate the admin password, schema in migrations).

### M-A: One source of truth (quick win, do first)
1. **Backfill the 5 missing static items into `gear`** and set `methods`/`recommended_for` on all rows.
   - Acceptance: the diff script reports 0 missing; `/results` for kamado vs oven shows different picks; the email pick varies by method.
2. **Server-render the catalogue with cache tag `catalog`.** `/gear`, `/rubs`, `/ideas`, `/cook/*` and `GearRecommendation` all read `getCatalog()`; the `GEAR`/`RUBS` imports are removed from pages.
   - Acceptance: `grep "data/gear\|data/rubs" app components` only hits the snapshot generator; SSR HTML of `/gear` equals the DB; an admin edit appears on `/ideas` and on a cook page without a redeploy.
3. **Build-time snapshot for the `/go` fallback**, generated from the DB. Archived or deleted items redirect to `/gear`.
   - Acceptance: after deleting a slug, `/go/<slug>` returns a 302 to `/gear`.
4. **Fix the admin copy claim** (`app/admin/gear/page.tsx:188`), delete the dead `affiliateProducts` (`lib/bbqData.ts:177`), and fix the `Therapen` typo and the duplicate Plowboys URL.

### M-B: Superadmin auth
1. **Supabase Auth login** (magic link or passkey), `admin_users` + `is_admin()`, and a `requireAdmin()` helper; admin routes become Server Actions using the user's JWT.
   - Acceptance: the old password is rejected; a non-admin account gets 403; RLS denies writes without an admin row (tested with the anon key and a non-admin JWT, not the service role).
2. **Remove `ADMIN_PASSWORD`/`admin_token`**, protect `/admin/*` in middleware/proxy, and add a login rate limit.
   - Acceptance: `grep admin_token` returns 0; `/admin` redirects to login server-side.
3. **Audit log trigger** on the catalogue tables.
   - Acceptance: every create/update/delete writes a row with the actor and the before/after values.

### M-C: Catalogue v2 admin
1. **Schema migration:** new `gear` columns, `categories`, the `catalog` bucket with policies.
   - Acceptance: the migration is in `supabase/migrations/` and applies cleanly to a branch DB.
2. **Product editor:** image upload (resize to WebP, alt required), status draft/published, badge, price note, method/cut chips, disclosure, sponsor, ASIN link builder, URL validation (https, host, `tag=bsbsbs0f-22`).
   - Acceptance: saving an Amazon URL without the tag is blocked; an uploaded image renders on `/gear` from Storage.
3. **Retire `/api/og-image`,** or restrict it to an admin-only one-off import with a host allowlist.
   - Acceptance: a public request to `/api/og-image?url=http://example.com` returns 404/403; `/gear` makes 0 og-image calls.
4. **Ordering and categories:** drag reorder within a category; a categories screen; `/gear` and `/rubs` split by `categories.store`.
   - Acceptance: a new rub category typed in admin appears on `/rubs`, not `/gear`.
5. **Preview plus instant publish:** Draft Mode preview route; `revalidateTag('catalog')` on every mutation.
   - Acceptance: a draft is visible only to the admin in preview; publish is visible to the public within 5 s.

### M-D: Placements and sponsors
1. **`placements`, `placement_items`, `sponsors`, `creatives` tables** plus the slot registry, seeded with the 9 slot keys.
   - Acceptance: every commercial surface renders through `getPlacement(key, ctx)`.
2. **Scheduling:** start/end windows, status automation, and a cron to revalidate on window edges.
   - Acceptance: an item scheduled at T appears within 5 min of T and disappears within 5 min of its end.
3. **Disclosure labels:** a "Sponsored" chip on paid items, "Affiliate link" for Amazon, `rel="sponsored noopener"` on all outbound links, and an item-level disclosure the UI cannot drop.
   - Acceptance: a snapshot test shows every sponsored item carries a visible label.
4. **Copy changes:** remove the "No ads" and "ad-free" claims once sponsored slots exist (`app/layout.tsx:26`, `app/page.tsx:8`, `IdeasClient.tsx:181,338`).
5. **Results "Pitmaster Box"** (blueprint 6.1): rub + wood + gear matched to the cut and method via the placement resolver.
   - Acceptance: brisket on a smoker and chicken in the oven show different, relevant items.

### M-E: Tracking and link health
1. **`gear_clicks` v2:** columns for placement, page, referrer, UA family, bot flag, visitor hash and country; logged in `after()`; unknown slugs are not logged; dedupe index.
   - Acceptance: a curl with a bot UA is flagged; two clicks within the hour count as 1; the redirect p95 doesn't grow.
2. **Impressions:** `impressions_daily` via a server-slot counter or a beacon.
   - Acceptance: the sponsor report shows views, clicks and CTR per slot per day.
3. **Link-health cron:** daily GET of each URL (following redirects), checking for 200, `tag=` present and not a "dog page"; results go to `link_checks`; a dashboard badge; a Telegram or email alert on failure.
   - Acceptance: an injected broken URL shows red within 24 h.
4. **Analytics dashboard** in admin (blueprint 6.2), with CSV export per sponsor.
5. **`robots.txt` `Disallow: /go/`.**

### M-F: Compliance (check the official texts first)
1. **Email: remove the Amazon link** from the cook-plan email, or link to a RoughCut page, pending the Associates policy check. Add a disclosure line if any commercial link remains.
   - Acceptance: the rendered email contains no `/go/` link that resolves to amazon.* (or the policy has been verified to allow it, with the source cited).
2. **Disclosure audit:** consistent Amazon wording near every Amazon link; a "Sponsored" standard for paid slots; a `/disclosure` page linked from the footer.
   - Acceptance: a checklist is signed off against the Associates Operating Agreement and the ACCC guidance, with links.
3. **Images and prices:** only owner-uploaded or PA-API/SiteStripe images; no scraped prices.
4. **Gallery moderation v2** (blueprint M7.4 and M1.0/1.1): an admin-only flagged list, hide/restore/dismiss, per-reporter reports.
   - Acceptance: an anonymous `GET /api/gallery?flagged=true` returns 401.
