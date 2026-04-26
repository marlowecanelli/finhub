-- Per-user savings goals.
create extension if not exists "pgcrypto";

create table if not exists public.goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  target_amount   numeric not null check (target_amount > 0),
  current_amount  numeric not null default 0 check (current_amount >= 0),
  target_date     date not null,
  created_at      timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals (user_id, created_at desc);

alter table public.goals enable row level security;

drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals
  for select using (auth.uid() = user_id);

drop policy if exists goals_insert on public.goals;
create policy goals_insert on public.goals
  for insert with check (auth.uid() = user_id);

drop policy if exists goals_update on public.goals;
create policy goals_update on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists goals_delete on public.goals;
create policy goals_delete on public.goals
  for delete using (auth.uid() = user_id);
