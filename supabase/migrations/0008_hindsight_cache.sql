-- Hindsight historical price cache. Server-side writes only.
create table if not exists public.hindsight_cache (
  cache_key   text primary key,
  payload     jsonb not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz
);

create index if not exists hindsight_cache_expires_idx
  on public.hindsight_cache (expires_at);

alter table public.hindsight_cache enable row level security;

drop policy if exists hindsight_cache_read on public.hindsight_cache;
create policy hindsight_cache_read on public.hindsight_cache
  for select using (true);
