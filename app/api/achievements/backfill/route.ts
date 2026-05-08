import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { backfillUser } from "@/lib/achievements/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Per-user backfill. Re-evaluates the entire catalog against the user's
 * event history. Safe to call repeatedly. Used by the welcome-back modal
 * sequence after a deploy that adds new achievements.
 */
export async function POST() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unlocks = await backfillUser(user.id);
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
