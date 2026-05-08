import type { SupabaseClient } from "@supabase/supabase-js";
import type { StreakType } from "../types";

/**
 * Streak update logic.
 *
 * Why this is server-side and idempotent on the calendar date:
 *   - Multiple logins on the same day must NOT extend the streak.
 *   - A gap of exactly 1 day is "yesterday -> today" and extends.
 *   - A gap of >1 day breaks the streak unless we have a freeze available
 *     AND the gap is exactly 2 days (one missed day). We auto-apply the
 *     freeze; the user does not get to choose.
 *   - Timezone is per-user and stored on the row. Calendar comparisons use
 *     that TZ. We default to UTC for safety if not set.
 */

export type StreakUpdate = {
  type: StreakType;
  current: number;
  longest: number;
  lastActiveDate: string;
  freezesRemaining: number;
  /** True if this call extended the streak (or started a new one). */
  extended: boolean;
  /** True if a freeze was auto-applied to save the streak. */
  freezeUsed: boolean;
  /** True if the streak reset to 1 (gap too large or no freeze). */
  reset: boolean;
};

function localDate(d: Date, tz: string): string {
  // YYYY-MM-DD in the given timezone.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function daysBetween(a: string, b: string): number {
  // Both args YYYY-MM-DD. Returns b - a in calendar days.
  const ta = Date.parse(a + "T00:00:00Z");
  const tb = Date.parse(b + "T00:00:00Z");
  return Math.round((tb - ta) / 86400000);
}

export async function recordStreakActivity(
  db: SupabaseClient,
  userId: string,
  type: StreakType,
  now: Date = new Date()
): Promise<StreakUpdate> {
  const { data: existing } = await db
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();

  const tz = (existing?.timezone as string | undefined) ?? "UTC";
  const today = localDate(now, tz);

  if (!existing) {
    await db.from("user_streaks").insert({
      user_id: userId,
      type,
      current_count: 1,
      longest_count: 1,
      last_active_date: today,
      freezes_remaining: 1,
      timezone: tz,
    });
    return {
      type,
      current: 1,
      longest: 1,
      lastActiveDate: today,
      freezesRemaining: 1,
      extended: true,
      freezeUsed: false,
      reset: false,
    };
  }

  const last = existing.last_active_date as string | null;
  let current = (existing.current_count as number) ?? 0;
  let longest = (existing.longest_count as number) ?? 0;
  let freezes = (existing.freezes_remaining as number) ?? 0;
  const usedDates = (existing.freeze_used_dates as string[] | null) ?? [];

  let extended = false;
  let freezeUsed = false;
  let reset = false;

  if (!last) {
    current = 1;
    extended = true;
  } else {
    const gap = daysBetween(last, today);
    if (gap === 0) {
      // Same day re-entry. No change.
    } else if (gap === 1) {
      current += 1;
      extended = true;
    } else if (gap === 2 && freezes > 0) {
      // Auto-apply freeze: treat the missed day as covered.
      current += 1;
      freezes -= 1;
      usedDates.push(today);
      extended = true;
      freezeUsed = true;
    } else {
      current = 1;
      reset = true;
    }
  }

  if (current > longest) longest = current;

  await db
    .from("user_streaks")
    .update({
      current_count: current,
      longest_count: longest,
      last_active_date: today,
      freezes_remaining: freezes,
      freeze_used_dates: usedDates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("type", type);

  return {
    type,
    current,
    longest,
    lastActiveDate: today,
    freezesRemaining: freezes,
    extended,
    freezeUsed,
    reset,
  };
}

export async function getStreak(
  db: SupabaseClient,
  userId: string,
  type: StreakType
): Promise<{ current: number; longest: number } | null> {
  const { data } = await db
    .from("user_streaks")
    .select("current_count,longest_count")
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();
  if (!data) return null;
  return {
    current: (data.current_count as number) ?? 0,
    longest: (data.longest_count as number) ?? 0,
  };
}
