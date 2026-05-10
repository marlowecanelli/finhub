create table if not exists public.ticker_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  note        text not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists ticker_notes_user_id_idx
  on public.ticker_notes (user_id, ticker);

alter table public.ticker_notes enable row level security;

drop policy if exists notes_select on public.ticker_notes;
create policy notes_select on public.ticker_notes
  for select using (auth.uid() = user_id);

drop policy if exists notes_insert on public.ticker_notes;
create policy notes_insert on public.ticker_notes
  for insert with check (auth.uid() = user_id);

drop policy if exists notes_update on public.ticker_notes;
create policy notes_update on public.ticker_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notes_delete on public.ticker_notes;
create policy notes_delete on public.ticker_notes
  for delete using (auth.uid() = user_id);
