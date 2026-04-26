create extension if not exists "pgcrypto";

create table if not exists public.watchlist_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists watchlist_items_user_id_idx
  on public.watchlist_items (user_id, created_at desc);

alter table public.watchlist_items enable row level security;

drop policy if exists watchlist_select on public.watchlist_items;
create policy watchlist_select on public.watchlist_items
  for select using (auth.uid() = user_id);

drop policy if exists watchlist_insert on public.watchlist_items;
create policy watchlist_insert on public.watchlist_items
  for insert with check (auth.uid() = user_id);

drop policy if exists watchlist_delete on public.watchlist_items;
create policy watchlist_delete on public.watchlist_items
  for delete using (auth.uid() = user_id);
