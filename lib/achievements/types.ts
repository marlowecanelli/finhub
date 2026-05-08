/**
 * Achievement system types. The Requirement union is the contract between
 * catalog definitions and evaluators. Adding a new evaluator means adding
 * a variant here AND a handler in engine.ts.
 */

export type Tier = "bronze" | "silver" | "gold" | "platinum" | "mythic";

export type Category =
  | "onboarding"
  | "research"
  | "portfolio"
  | "goals"
  | "ai"
  | "streaks"
  | "news"
  | "hidden"
  | "meta"
  | "social"
  | "seasonal";

export type EventType =
  | "account_created"
  | "ticker_viewed"
  | "deep_dive_opened"
  | "earnings_viewed"
  | "advanced_chart_opened"
  | "ai_pro_con_viewed"
  | "portfolio_created"
  | "holding_added"
  | "watchlist_added"
  | "watchlist_removed"
  | "screen_run"
  | "screen_saved"
  | "calculator_used"
  | "news_read"
  | "ai_query_sent"
  | "ai_screen_built"
  | "claude_key_connected"
  | "goal_created"
  | "goal_hit"
  | "achievement_shared"
  | "login";

export type StreakType = "login" | "research" | "news_read";

export type Requirement =
  // Count N occurrences of an event type, optionally filtered by payload predicate.
  | {
      kind: "count";
      event: EventType;
      target: number;
      where?: Record<string, unknown>;
    }
  // Count distinct values of a payload key.
  | {
      kind: "distinct";
      event: EventType;
      key: string;
      target: number;
      where?: Record<string, unknown>;
    }
  // Hit a streak length on a streak type.
  | {
      kind: "streak";
      streak: StreakType;
      target: number;
    };

export type Achievement = {
  id: string;
  title: string;
  description: string;
  flavorText: string;
  category: Category;
  tier: Tier;
  points: number;
  rarityTarget: number; // 0..1, advisory only
  isHidden: boolean;
  isSeasonal: boolean;
  enabled: boolean; // false = catalog entry parked until feature ships
  requirement: Requirement;
  prerequisiteId?: string;
};

export type UnlockedAchievement = {
  achievementId: string;
  unlockedAt: string | null;
  progressCurrent: number;
  progressTarget: number;
  pinned: boolean;
};

export type UserStats = {
  totalPoints: number;
  level: number;
  levelTitle: string;
  badgesCount: number;
  rarestBadgeId: string | null;
  archetype: string;
};

export type UserStreak = {
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastActiveDate: string | null;
  freezesRemaining: number;
};

export type UnlockResult = {
  achievement: Achievement;
  isNew: boolean;
  progressCurrent: number;
  progressTarget: number;
};

export const TIER_POINTS: Record<Tier, number> = {
  bronze: 10,
  silver: 25,
  gold: 75,
  platinum: 200,
  mythic: 500,
};

export const TIER_RANK: Record<Tier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  mythic: 5,
};
