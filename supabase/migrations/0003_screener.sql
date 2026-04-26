-- Daily snapshot of screener data + per-user saved filter presets.
create extension if not exists "pgcrypto";

create table if not exists public.screener_snapshots (
  symbol           text primary key,
  name             text,
  sector           text,
  industry         text,
  price            numeric,
  change_pct       numeric,
  market_cap       numeric,
  pe_ratio         numeric,
  dividend_yield   numeric,
  fifty_two_high   numeric,
  fifty_two_low    numeric,
  fifty_two_change numeric,
  volume           numeric,
  prev_close       numeric,
  refreshed_at     timestamptz not null default now()
);

create index if not exists screener_snapshots_refreshed_at_idx
  on public.screener_snapshots (refreshed_at desc);

alter table public.screener_snapshots enable row level security;
drop policy if exists screener_snapshots_read on public.screener_snapshots;
create policy screener_snapshots_read on public.screener_snapshots
  for select using (true);

-- Per-user saved screen presets
create table if not exists public.screener_presets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  filters     jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists screener_presets_user_id_idx
  on public.screener_presets (user_id, created_at desc);

alter table public.screener_presets enable row level security;

drop policy if exists screener_presets_select on public.screener_presets;
create policy screener_presets_select on public.screener_presets
  for select using (auth.uid() = user_id);

drop policy if exists screener_presets_insert on public.screener_presets;
create policy screener_presets_insert on public.screener_presets
  for insert with check (auth.uid() = user_id);

drop policy if exists screener_presets_delete on public.screener_presets;
create policy screener_presets_delete on public.screener_presets
  for delete using (auth.uid() = user_id);
