import type { Achievement, EventType } from "./types";
import { ONBOARDING } from "./catalog/onboarding";
import { RESEARCH } from "./catalog/research";
import { STREAKS } from "./catalog/streaks";
import { PORTFOLIO } from "./catalog/portfolio";
import { NEWS } from "./catalog/news";
import { AI_ACHIEVEMENTS } from "./catalog/ai";
import { GOALS } from "./catalog/goals";
import { HIDDEN } from "./catalog/hidden";

/**
 * Single source of truth for the catalog. Order here drives display order
 * within each category in the achievements grid.
 */
export const ALL_ACHIEVEMENTS: ReadonlyArray<Achievement> = [
  ...ONBOARDING,
  ...RESEARCH,
  ...STREAKS,
  ...PORTFOLIO,
  ...NEWS,
  ...AI_ACHIEVEMENTS,
  ...GOALS,
  ...HIDDEN,
];

const BY_ID: ReadonlyMap<string, Achievement> = new Map(
  ALL_ACHIEVEMENTS.map((a) => [a.id, a])
);

export function getAchievement(id: string): Achievement | undefined {
  return BY_ID.get(id);
}

/**
 * Quickly look up which achievements care about a given event type. Used by
 * the engine to avoid re-evaluating every badge on every event.
 */
const BY_EVENT: ReadonlyMap<EventType, ReadonlyArray<Achievement>> = (() => {
  const map = new Map<EventType, Achievement[]>();
  for (const a of ALL_ACHIEVEMENTS) {
    if (!a.enabled) continue;
    if (a.requirement.kind === "streak") continue;
    const list = map.get(a.requirement.event) ?? [];
    list.push(a);
    map.set(a.requirement.event, list);
  }
  return map;
})();

export function achievementsForEvent(event: EventType): ReadonlyArray<Achievement> {
  return BY_EVENT.get(event) ?? [];
}

const STREAK_BADGES: ReadonlyArray<Achievement> = ALL_ACHIEVEMENTS.filter(
  (a) => a.enabled && a.requirement.kind === "streak"
);

export function streakAchievements(): ReadonlyArray<Achievement> {
  return STREAK_BADGES;
}
