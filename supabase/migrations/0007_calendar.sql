-- ─────────────────────────────────────────────────────────────────────────────
-- Calendar: aggregated market events + user personal events + per-user settings
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── calendar_events ──────────────────────────────────────────────────────────
-- Aggregated market events from upstream sources. Public read, service-role write.
create table if not exists public.calendar_events (
  id            uuid primary key default gen_random_uuid(),
  event_type    text not null check (event_type in (
                  'earnings','dividend','economic','ipo','split',
                  'opex','holiday','conference','crypto','treasury','lockup'
                )),
  ticker        text,
  title         text not null,
  description   text,
  event_date    timestamptz not null,
  timing        text not null default 'all_day' check (timing in (
                  'bmo','amc','dmh','all_day'
                )),
  importance    text not null default 'medium' check (importance in (
                  'low','medium','high','critical'
                )),
  metadata      jsonb not null default '{}'::jsonb,
  source        text not null,
  external_id   text,
  ai_brief      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists calendar_events_event_date_idx
  on public.calendar_events (event_date);
create index if not exists calendar_events_ticker_date_idx
  on public.calendar_events (ticker, event_date) where ticker is not null;
create index if not exists calendar_events_type_date_idx
  on public.calendar_events (event_type, event_date);
create index if not exists calendar_events_high_importance_idx
  on public.calendar_events (event_date)
  where importance in ('high','critical');

alter table public.calendar_events enable row level security;

drop policy if exists calendar_events_select on public.calendar_events;
create policy calendar_events_select on public.calendar_events
  for select using (true);

-- ── user_calendar_events ─────────────────────────────────────────────────────
create table if not exists public.user_calendar_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  ticker       text,
  event_date   timestamptz not null,
  created_at   timestamptz not null default now()
);

create index if not exists user_calendar_events_user_date_idx
  on public.user_calendar_events (user_id, event_date);

alter table public.user_calendar_events enable row level security;

drop policy if exists uce_select on public.user_calendar_events;
create policy uce_select on public.user_calendar_events
  for select using (auth.uid() = user_id);

drop policy if exists uce_insert on public.user_calendar_events;
create policy uce_insert on public.user_calendar_events
  for insert with check (auth.uid() = user_id);

drop policy if exists uce_update on public.user_calendar_events;
create policy uce_update on public.user_calendar_events
  for update using (auth.uid() = user_id);

drop policy if exists uce_delete on public.user_calendar_events;
create policy uce_delete on public.user_calendar_events
  for delete using (auth.uid() = user_id);

-- ── user_calendar_settings ───────────────────────────────────────────────────
create table if not exists public.user_calendar_settings (
  user_id                       uuid primary key references auth.users(id) on delete cascade,
  visible_event_types           jsonb not null default '["earnings","dividend","economic","ipo","split","opex","holiday","conference","crypto","treasury","lockup","custom"]'::jsonb,
  watchlist_only                boolean not null default false,
  timezone                      text not null default 'America/New_York',
  default_view                  text not null default 'month' check (default_view in ('month','week','agenda','heatmap')),
  email_digest_enabled          boolean not null default false,
  email_digest_hour             integer not null default 7 check (email_digest_hour between 0 and 23),
  push_notifications_enabled    boolean not null default false,
  alert_lead_time_minutes       integer not null default 60,
  feed_token                    text not null default encode(gen_random_bytes(24), 'hex'),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  unique (feed_token)
);

create index if not exists ucs_feed_token_idx
  on public.user_calendar_settings (feed_token);

alter table public.user_calendar_settings enable row level security;

drop policy if exists ucs_select on public.user_calendar_settings;
create policy ucs_select on public.user_calendar_settings
  for select using (auth.uid() = user_id);

drop policy if exists ucs_insert on public.user_calendar_settings;
create policy ucs_insert on public.user_calendar_settings
  for insert with check (auth.uid() = user_id);

drop policy if exists ucs_update on public.user_calendar_settings;
create policy ucs_update on public.user_calendar_settings
  for update using (auth.uid() = user_id);

-- ── calendar_briefs ──────────────────────────────────────────────────────────
-- Cached AI daily briefings, keyed by (user_id, brief_date).
create table if not exists public.calendar_briefs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  brief_date   date not null,
  content      text not null,
  created_at   timestamptz not null default now(),
  unique (user_id, brief_date)
);

alter table public.calendar_briefs enable row level security;

drop policy if exists briefs_select on public.calendar_briefs;
create policy briefs_select on public.calendar_briefs
  for select using (auth.uid() = user_id);
