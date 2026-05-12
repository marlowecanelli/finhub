-- Buffett Score cache (per-ticker, 24h TTL enforced in application)
create table if not exists public.buffett_score_cache (
  ticker        text primary key,
  payload       jsonb not null,
  computed_at   timestamptz not null default now()
);

-- Nightly screener results (S&P 500 pre-computed scores)
create table if not exists public.buffett_screener_results (
  ticker        text primary key,
  company_name  text not null,
  sector        text,
  market_cap    numeric,
  dividend_yield numeric,
  overall       numeric not null,
  label         text not null,
  payload       jsonb not null,
  updated_at    timestamptz not null default now()
);

create index if not exists buffett_screener_overall_desc
  on public.buffett_screener_results (overall desc);

create index if not exists buffett_screener_sector
  on public.buffett_screener_results (sector);

-- RLS: readable by authenticated users, writable only by service role
alter table public.buffett_score_cache enable row level security;
alter table public.buffett_screener_results enable row level security;

create policy "buffett_cache_read" on public.buffett_score_cache
  for select using (auth.role() = 'authenticated');

create policy "buffett_screener_read" on public.buffett_screener_results
  for select using (auth.role() = 'authenticated');
