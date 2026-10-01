-- RC-1.7: one report per reporter per post.
-- reporter_key = user id, or salted SHA-256 of client IP + user-agent.
create table if not exists public.post_reports (
  post_id      text not null,
  reporter_key text not null,
  created_at   timestamptz not null default now(),
  constraint post_reports_pkey primary key (post_id, reporter_key),
  constraint post_reports_post_id_fkey foreign key (post_id) references public.gallery_posts (id) on delete cascade
);

-- RLS on, no policies: only the service key (server) can touch it.
alter table public.post_reports enable row level security;
