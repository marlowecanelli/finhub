-- AI ticker analysis cache. One row per symbol, overwritten on refresh.
create table if not exists public.ai_analyses_cache (
  ticker      text primary key,
  analysis    jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists ai_analyses_cache_created_at_idx
  on public.ai_analyses_cache (created_at);

-- RLS: server-side only. Public role has no read/write; service role bypasses RLS.
alter table public.ai_analyses_cache enable row level security;
