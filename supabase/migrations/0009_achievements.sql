-- Achievement & retention system. Phase 1 schema.
--
-- Catalog (achievement definitions) lives in code under lib/achievements/catalog/*.
-- This file is for per-user state only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- achievement_events
-- The spine of the engine. Every meaningful user action writes one row here.
-- Evaluators read this table to compute badge progress.
-- ---------------------------------------------------------------------------

create table if not exists public.achievement_events (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists achievement_events_user_type_idx
  on public.achievement_events (user_id, event_type, created_at desc);

create index if not exists achievement_events_user_created_idx
  on public.achievement_events (user_id, created_at desc);

alter table public.achievement_events enable row level security;

drop policy if exists ach_events_select on public.achievement_events;
create policy ach_events_select on public.achievement_events
  for select using (auth.uid() = user_id);

-- Inserts are server-only via service role. No client insert policy on purpose.

-- ---------------------------------------------------------------------------
-- user_achievements
-- One row per (user, achievement) once any progress exists.
-- unlocked_at null => still locked but progress > 0.
-- ---------------------------------------------------------------------------

create table if not exists public.user_achievements (
  user_id          uuid not null references auth.users(id) on delete cascade,
  achievement_id   text not null,
  unlocked_at      timestamptz,
  progress_current int not null default 0,
  progress_target  int not null,
  metadata         jsonb not null default '{}'::jsonb,
  shared_at        timestamptz,
  pinned           boolean not null default false,
  primary key (user_id, achievement_id)
);

create index if not exists user_achievements_user_unlocked_idx
  on public.user_achievements (user_id, unlocked_at desc nulls last);

alter table public.user_achievements enable row level security;

drop policy if exists user_achievements_select on public.user_achievements;
create policy user_achievements_select on public.user_achievements
  for select using (auth.uid() = user_id);

-- Pinning is the only client-mutable field. Phase 2 adds an UPDATE policy
-- restricted to pinned/shared_at columns via a trigger; Phase 1 keeps it
-- server-side via the API route.

-- ---------------------------------------------------------------------------
-- user_streaks
-- Per-user streak counters. Type discriminates login vs research vs news.
-- freezes_remaining auto-replenishes via cron in Phase 2; Phase 1 starts at 1.
-- ---------------------------------------------------------------------------

create table if not exists public.user_streaks (
  user_id            uuid not null references auth.users(id) on delete cascade,
  type               text not null,
  current_count      int not null default 0,
  longest_count      int not null default 0,
  last_active_date   date,
  freezes_remaining  int not null default 1,
  freeze_used_dates  date[] not null default '{}',
  timezone           text not null default 'UTC',
  updated_at         timestamptz not null default now(),
  primary key (user_id, type)
);

alter table public.user_streaks enable row level security;

drop policy if exists user_streaks_select on public.user_streaks;
create policy user_streaks_select on public.user_streaks
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- user_stats
-- Denormalized roll-up so profile/header reads stay cheap.
-- Updated by the engine after every unlock.
-- ---------------------------------------------------------------------------

create table if not exists public.user_stats (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  total_points     int not null default 0,
  level            int not null default 1,
  level_title      text not null default 'Trader-in-Training',
  badges_count     int not null default 0,
  rarest_badge_id  text,
  archetype        text not null default 'New Capital',
  updated_at       timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists user_stats_select on public.user_stats;
create policy user_stats_select on public.user_stats
  for select using (auth.uid() = user_id);
