-- Stripe subscription state per user. Written exclusively by the Stripe webhook
-- via the service role. Clients read their own row to check Pro entitlement.

create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  status                 text not null default 'inactive',
  price_id               text,
  plan                   text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select using (auth.uid() = user_id);

-- Inserts/updates only via service role from the Stripe webhook. No client policy.
