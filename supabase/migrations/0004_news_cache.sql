-- Cache AI one-line summaries per article URL for 24h. Server-side writes only.
create table if not exists public.news_summaries_cache (
  article_url   text primary key,
  summary       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists news_summaries_cache_created_at_idx
  on public.news_summaries_cache (created_at desc);

alter table public.news_summaries_cache enable row level security;

drop policy if exists news_summaries_cache_read on public.news_summaries_cache;
create policy news_summaries_cache_read on public.news_summaries_cache
  for select using (true);
