-- Portfolios + holdings owned by Supabase auth users.
create extension if not exists "pgcrypto";

create table if not exists public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists portfolios_user_id_idx
  on public.portfolios (user_id);

create table if not exists public.holdings (
  id            uuid primary key default gen_random_uuid(),
  portfolio_id  uuid not null references public.portfolios(id) on delete cascade,
  ticker        text not null,
  shares        numeric not null check (shares > 0),
  cost_basis    numeric not null check (cost_basis >= 0),
  purchase_date date not null,
  created_at    timestamptz not null default now()
);

create index if not exists holdings_portfolio_id_idx
  on public.holdings (portfolio_id);

alter table public.portfolios enable row level security;
alter table public.holdings   enable row level security;

-- portfolios: owner-only CRUD
drop policy if exists portfolios_select on public.portfolios;
create policy portfolios_select on public.portfolios
  for select using (auth.uid() = user_id);

drop policy if exists portfolios_insert on public.portfolios;
create policy portfolios_insert on public.portfolios
  for insert with check (auth.uid() = user_id);

drop policy if exists portfolios_update on public.portfolios;
create policy portfolios_update on public.portfolios
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists portfolios_delete on public.portfolios;
create policy portfolios_delete on public.portfolios
  for delete using (auth.uid() = user_id);

-- holdings: must belong to a portfolio owned by auth.uid()
drop policy if exists holdings_select on public.holdings;
create policy holdings_select on public.holdings
  for select using (
    exists (
      select 1 from public.portfolios p
      where p.id = holdings.portfolio_id and p.user_id = auth.uid()
    )
  );

drop policy if exists holdings_insert on public.holdings;
create policy holdings_insert on public.holdings
  for insert with check (
    exists (
      select 1 from public.portfolios p
      where p.id = portfolio_id and p.user_id = auth.uid()
    )
  );

drop policy if exists holdings_update on public.holdings;
create policy holdings_update on public.holdings
  for update using (
    exists (
      select 1 from public.portfolios p
      where p.id = holdings.portfolio_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.portfolios p
      where p.id = portfolio_id and p.user_id = auth.uid()
    )
  );

drop policy if exists holdings_delete on public.holdings;
create policy holdings_delete on public.holdings
  for delete using (
    exists (
      select 1 from public.portfolios p
      where p.id = holdings.portfolio_id and p.user_id = auth.uid()
    )
  );
