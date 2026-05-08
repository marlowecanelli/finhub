import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements/registry";
import { levelFromXp, progressToNext } from "@/lib/achievements/levels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [progressRes, statsRes, streakRes] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("achievement_id,unlocked_at,progress_current,progress_target,pinned")
      .eq("user_id", user.id),
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_streaks").select("*").eq("user_id", user.id),
  ]);

  const byId = new Map(
    (progressRes.data ?? []).map((r) => [r.achievement_id as string, r])
  );

  const items = ALL_ACHIEVEMENTS.map((a) => {
    const row = byId.get(a.id);
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      flavorText: a.flavorText,
      category: a.category,
      tier: a.tier,
      points: a.points,
      rarityTarget: a.rarityTarget,
      isHidden: a.isHidden,
      enabled: a.enabled,
      progressCurrent: (row?.progress_current as number | undefined) ?? 0,
      progressTarget:
        (row?.progress_target as number | undefined) ??
        (a.requirement.kind === "streak" ? a.requirement.target : a.requirement.target),
      unlockedAt: (row?.unlocked_at as string | undefined) ?? null,
      pinned: (row?.pinned as boolean | undefined) ?? false,
    };
  });

  const totalPoints = (statsRes.data?.total_points as number | undefined) ?? 0;
  const lvl = progressToNext(totalPoints);

  return NextResponse.json({
    items,
    stats: {
      totalPoints,
      level: lvl.current.level,
      levelTitle: lvl.current.title,
      nextLevelTitle: lvl.next?.title ?? null,
      nextLevelXp: lvl.next?.minXp ?? null,
      progressToNext: lvl.pct,
      badgesCount: (statsRes.data?.badges_count as number | undefined) ?? 0,
      rarestBadgeId: (statsRes.data?.rarest_badge_id as string | null | undefined) ?? null,
      archetype: (statsRes.data?.archetype as string | undefined) ?? "New Capital",
    },
    streaks: streakRes.data ?? [],
  });
}
