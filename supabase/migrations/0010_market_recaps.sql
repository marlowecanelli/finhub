create table if not exists public.market_recaps (
  id              uuid primary key default gen_random_uuid(),
  recap_date      date not null unique,
  headline        text not null,
  paragraph_movers   text not null,
  paragraph_why      text not null,
  paragraph_tomorrow text not null,
  indices_data    jsonb not null default '[]',
  top_movers      jsonb not null default '[]',
  sectors_data    jsonb not null default '[]',
  generated_at    timestamptz not null default now()
);

create index if not exists market_recaps_date_idx on public.market_recaps (recap_date desc);

alter table public.market_recaps enable row level security;

-- Everyone can read recaps (public content, no user data)
create policy "market_recaps_read" on public.market_recaps
  for select using (true);
