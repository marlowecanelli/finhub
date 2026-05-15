import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { recordEvent } from "@/lib/achievements/engine";
import type { EventType } from "@/lib/achievements/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS: ReadonlySet<EventType> = new Set<EventType>([
  "ticker_viewed",
  "deep_dive_opened",
  "earnings_viewed",
  "advanced_chart_opened",
  "ai_pro_con_viewed",
  "calculator_used",
  "news_read",
  "watchlist_added",
  "watchlist_removed",
  "screen_run",
  "screen_saved",
  "ai_query_sent",
  "ai_screen_built",
  "claude_key_connected",
  "portfolio_created",
  "holding_added",
  "goal_created",
  "goal_hit",
  "achievement_shared",
  "login",
]);

const MIN_VIEW_MS = 5_000;

export async function POST(req: Request) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event?: string; payload?: Record<string, unknown>; durationMs?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as EventType | undefined;
  if (!event || !ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: "Disallowed event" }, { status: 400 });
  }

  // Anti-gaming: ticker_viewed requires a minimum dwell time.
  if (event === "ticker_viewed" && (body.durationMs ?? 0) < MIN_VIEW_MS) {
    return NextResponse.json({ unlocks: [], skipped: "min_duration" });
  }

  const unlocks = await recordEvent(user.id, event, body.payload ?? {});

  return NextResponse.json({
    unlocks: unlocks
      .filter((u) => u.isNew)
      .map((u) => ({
        id: u.achievement.id,
        title: u.achievement.title,
        description: u.achievement.description,
        flavorText: u.achievement.flavorText,
        tier: u.achievement.tier,
        points: u.achievement.points,
        category: u.achievement.category,
      })),
  });
}
