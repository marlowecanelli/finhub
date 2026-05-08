import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  achievementsForEvent,
  getAchievement,
  streakAchievements,
  ALL_ACHIEVEMENTS,
} from "./registry";
import type {
  Achievement,
  EventType,
  UnlockResult,
  UserStats,
} from "./types";
import { TIER_RANK } from "./types";
import { countProgress } from "./evaluators/count";
import { distinctProgress } from "./evaluators/distinct";
import { recordStreakActivity } from "./evaluators/streak";
import { levelFromXp } from "./levels";

/**
 * Anti-gaming rate limit. We track ticker_viewed counts per minute and drop
 * events past the threshold. Cheap in-memory map per server instance is fine
 * for v1 because we evaluate server-side anyway.
 */
const RATE_BUCKET = new Map<string, { windowStart: number; count: number }>();
const RATE_LIMITS: Partial<Record<EventType, number>> = {
  ticker_viewed: 30, // per 60s
};

function rateLimit(userId: string, event: EventType): boolean {
  const cap = RATE_LIMITS[event];
  if (!cap) return true;
  const key = `${userId}:${event}`;
  const now = Date.now();
  const entry = RATE_BUCKET.get(key);
  if (!entry || now - entry.windowStart > 60_000) {
    RATE_BUCKET.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= cap) return false;
  entry.count += 1;
  return true;
}

/**
 * Record a user event and run achievement evaluation. Returns any newly
 * unlocked achievements so the caller can stream them to the client.
 *
 * Idempotency: this function is safe to call repeatedly with the same logical
 * event. Unlocks are gated by `unlocked_at IS NULL` so we never re-grant.
 * Replaying the entire event log produces the same final user_achievements.
 */
export async function recordEvent(
  userId: string,
  eventType: EventType,
  payload: Record<string, unknown> = {}
): Promise<UnlockResult[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  if (!rateLimit(userId, eventType)) return [];

  // Normalize ticker for distinct counts.
  const normalized = { ...payload };
  if (typeof normalized.ticker === "string") {
    normalized.ticker = normalized.ticker.toUpperCase();
  }

  await db.from("achievement_events").insert({
    user_id: userId,
    event_type: eventType,
    payload: normalized,
  });

  const unlocks: UnlockResult[] = [];

  // Streak side-effect: any login event drives the login streak.
  if (eventType === "login" || eventType === "account_created") {
    const update = await recordStreakActivity(db, userId, "login");
    if (update.extended) {
      const streakUnlocks = await evaluateStreaks(db, userId, update.current);
      unlocks.push(...streakUnlocks);
    }
  }
  if (eventType === "news_read") {
    const update = await recordStreakActivity(db, userId, "news_read");
    if (update.extended) {
      const streakUnlocks = await evaluateStreaks(db, userId, update.current, "news_read");
      unlocks.push(...streakUnlocks);
    }
  }
  if (eventType === "ticker_viewed" || eventType === "deep_dive_opened") {
    await recordStreakActivity(db, userId, "research");
  }

  // Evaluate every achievement that listens to this event type.
  const candidates = achievementsForEvent(eventType);
  for (const a of candidates) {
    const result = await evaluateOne(db, userId, a);
    if (result) unlocks.push(result);
  }

  if (unlocks.some((u) => u.isNew)) {
    await refreshStats(db, userId);
  }

  return unlocks;
}

async function evaluateStreaks(
  db: SupabaseClient,
  userId: string,
  currentLength: number,
  streakType: "login" | "research" | "news_read" = "login"
): Promise<UnlockResult[]> {
  const out: UnlockResult[] = [];
  for (const a of streakAchievements()) {
    if (a.requirement.kind !== "streak") continue;
    if (a.requirement.streak !== streakType) continue;
    const target = a.requirement.target;
    const progress = Math.min(currentLength, target);
    const written = await upsertProgress(db, userId, a, progress);
    if (written) out.push(written);
  }
  return out;
}

async function evaluateOne(
  db: SupabaseClient,
  userId: string,
  a: Achievement
): Promise<UnlockResult | null> {
  let progress = 0;
  let target = 0;
  if (a.requirement.kind === "count") {
    target = a.requirement.target;
    progress = await countProgress(db, userId, a.requirement);
  } else if (a.requirement.kind === "distinct") {
    target = a.requirement.target;
    progress = await distinctProgress(db, userId, a.requirement);
  } else {
    return null;
  }
  return upsertProgress(db, userId, a, progress, target);
}

async function upsertProgress(
  db: SupabaseClient,
  userId: string,
  a: Achievement,
  progress: number,
  targetOverride?: number
): Promise<UnlockResult | null> {
  const target =
    targetOverride ??
    (a.requirement.kind === "streak" ? a.requirement.target : (a.requirement as { target: number }).target);

  const { data: existing } = await db
    .from("user_achievements")
    .select("unlocked_at,progress_current")
    .eq("user_id", userId)
    .eq("achievement_id", a.id)
    .maybeSingle();

  // Already unlocked: idempotent, do not regrant.
  if (existing?.unlocked_at) {
    return { achievement: a, isNew: false, progressCurrent: target, progressTarget: target };
  }

  const reachedGoal = progress >= target;
  const now = new Date().toISOString();

  await db
    .from("user_achievements")
    .upsert(
      {
        user_id: userId,
        achievement_id: a.id,
        progress_current: progress,
        progress_target: target,
        unlocked_at: reachedGoal ? now : null,
      },
      { onConflict: "user_id,achievement_id" }
    );

  if (reachedGoal && !existing?.unlocked_at) {
    return { achievement: a, isNew: true, progressCurrent: target, progressTarget: target };
  }
  return null;
}

/**
 * Recompute user_stats from current user_achievements. Cheap because
 * Phase 1 has at most ~17 unlock rows per user.
 */
export async function refreshStats(db: SupabaseClient, userId: string): Promise<UserStats> {
  const { data } = await db
    .from("user_achievements")
    .select("achievement_id,unlocked_at")
    .eq("user_id", userId)
    .not("unlocked_at", "is", null);

  let totalPoints = 0;
  let badgesCount = 0;
  let rarestId: string | null = null;
  let rarestRank = -1;

  for (const row of data ?? []) {
    const a = getAchievement(row.achievement_id as string);
    if (!a) continue;
    badgesCount += 1;
    totalPoints += a.points;
    const rank = TIER_RANK[a.tier];
    if (rank > rarestRank) {
      rarestRank = rank;
      rarestId = a.id;
    }
  }

  const lvl = levelFromXp(totalPoints);
  const stats = {
    user_id: userId,
    total_points: totalPoints,
    level: lvl.level,
    level_title: lvl.title,
    badges_count: badgesCount,
    rarest_badge_id: rarestId,
    archetype: "New Capital",
    updated_at: new Date().toISOString(),
  };
  await db.from("user_stats").upsert(stats, { onConflict: "user_id" });

  return {
    totalPoints,
    level: lvl.level,
    levelTitle: lvl.title,
    badgesCount,
    rarestBadgeId: rarestId,
    archetype: "New Capital",
  };
}

/**
 * Replays the entire event history for a user and (re)evaluates every
 * achievement in the catalog. Safe to run repeatedly. Used by:
 *   - Backfill on first deploy.
 *   - Admin-triggered re-evaluation after catalog changes.
 */
export async function backfillUser(userId: string): Promise<UnlockResult[]> {
  const db = getSupabaseAdmin();
  if (!db) return [];

  const unlocks: UnlockResult[] = [];

  for (const a of ALL_ACHIEVEMENTS) {
    if (!a.enabled) continue;
    if (a.requirement.kind === "streak") {
      // Streaks are rebuilt by re-derivation from login events ordered by date.
      // We approximate by trusting the live user_streaks row built up by
      // recordEvent. The very first backfill seeds it from the event log.
      continue;
    }
    const result = await evaluateOne(db, userId, a);
    if (result) unlocks.push(result);
  }

  // Streak rebuild: walk distinct local-day login events in order.
  await rebuildLoginStreak(db, userId);
  await refreshStats(db, userId);
  return unlocks;
}

async function rebuildLoginStreak(db: SupabaseClient, userId: string): Promise<void> {
  const { data } = await db
    .from("achievement_events")
    .select("created_at")
    .eq("user_id", userId)
    .in("event_type", ["login", "account_created"])
    .order("created_at", { ascending: true })
    .limit(2000);

  if (!data || data.length === 0) return;

  const tz = "UTC";
  const seen = new Set<string>();
  let current = 0;
  let longest = 0;
  let lastDate: string | null = null;

  for (const row of data) {
    const d = new Date(row.created_at as string);
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    if (seen.has(day)) continue;
    seen.add(day);
    if (lastDate === null) {
      current = 1;
    } else {
      const gap = Math.round((Date.parse(day + "T00:00:00Z") - Date.parse(lastDate + "T00:00:00Z")) / 86400000);
      current = gap === 1 ? current + 1 : 1;
    }
    if (current > longest) longest = current;
    lastDate = day;
  }

  await db.from("user_streaks").upsert(
    {
      user_id: userId,
      type: "login",
      current_count: current,
      longest_count: longest,
      last_active_date: lastDate,
      freezes_remaining: 1,
      timezone: tz,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,type" }
  );

  // Evaluate streak badges against rebuilt length.
  for (const a of streakAchievements()) {
    if (a.requirement.kind !== "streak" || a.requirement.streak !== "login") continue;
    await upsertProgress(db, userId, a, Math.min(current, a.requirement.target), a.requirement.target);
  }
}
