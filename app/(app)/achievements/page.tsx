import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { ALL_ACHIEVEMENTS } from "@/lib/achievements/registry";
import { progressToNext } from "@/lib/achievements/levels";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Achievements",
  description: "Track your investing milestones, streaks, and badges on FinHub.",
};

export default async function AchievementsPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/achievements");

  const [progressRes, statsRes, streakRes] = await Promise.all([
    supabase
      .from("user_achievements")
      .select("achievement_id,unlocked_at,progress_current,progress_target,pinned")
      .eq("user_id", user.id),
    supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "login")
      .maybeSingle(),
  ]);

  const byId = new Map(
    (progressRes.data ?? []).map((r) => [r.achievement_id as string, r])
  );

  const items = ALL_ACHIEVEMENTS.map((a) => {
    const row = byId.get(a.id);
    const progressTarget =
      (row?.progress_target as number | undefined) ??
      (a.requirement.kind === "streak" ? a.requirement.target : a.requirement.target);
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
      progressTarget,
      unlockedAt: (row?.unlocked_at as string | undefined) ?? null,
    };
  });

  const totalPoints = (statsRes.data?.total_points as number | undefined) ?? 0;
  const lvl = progressToNext(totalPoints);
  const earnedCount = items.filter((i) => i.unlockedAt).length;
  const totalEnabled = items.filter((i) => i.enabled && !i.isHidden).length;
  const streak = streakRes.data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Profile
        </p>
        <h1
          className="mt-2 text-4xl"
          style={{ fontFamily: "var(--font-instrument-serif), serif" }}
        >
          Achievements
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Every line item, every screen, every streak. The work shows up here.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Level" value={String(lvl.current.level)} sub={lvl.current.title} />
          <Stat label="Total XP" value={totalPoints.toLocaleString()} sub={lvl.next ? `${lvl.next.minXp - totalPoints} to ${lvl.next.title}` : "Max level"} />
          <Stat label="Badges" value={`${earnedCount} / ${totalEnabled}`} sub="Visible catalog" />
          <Stat
            label="Streak"
            value={String((streak?.current_count as number | undefined) ?? 0)}
            sub={`Longest ${(streak?.longest_count as number | undefined) ?? 0}`}
          />
        </div>

        {lvl.next && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{ width: `${Math.max(2, lvl.pct * 100)}%` }}
            />
          </div>
        )}
      </header>

      <AchievementGrid items={items} />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-popover/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-1 text-2xl"
        style={{ fontFamily: "var(--font-instrument-serif), serif" }}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}
