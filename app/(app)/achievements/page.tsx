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
  const currentStreak = (streak?.current_count as number | undefined) ?? 0;
  const longestStreak = (streak?.longest_count as number | undefined) ?? 0;

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

        {/* Stats grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Level"
            value={String(lvl.current.level)}
            sub={lvl.current.title}
            accent="#c997ff"
          />
          <StatCard
            label="Total XP"
            value={totalPoints.toLocaleString()}
            sub={lvl.next ? `${(lvl.next.minXp - totalPoints).toLocaleString()} to ${lvl.next.title}` : "Max level"}
            accent="#e3b341"
          />
          <StatCard
            label="Badges"
            value={`${earnedCount} / ${totalEnabled}`}
            sub="Visible catalog"
            accent="#9ad7e7"
          />
          <StatCard
            label="Streak"
            value={`${currentStreak}d`}
            sub={`Best ${longestStreak}d`}
            accent="#f97316"
            hot={currentStreak >= 7}
          />
        </div>

        {/* XP progress bar */}
        {lvl.next && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>Lvl {lvl.current.level} · {lvl.current.title}</span>
              <span>{Math.round(lvl.pct * 100)}% to Lvl {lvl.next.level}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(2, lvl.pct * 100)}%`,
                  background: "linear-gradient(90deg, #c997ff88, #c997ff)",
                  boxShadow: "0 0 8px #c997ff44",
                }}
              />
            </div>
          </div>
        )}
      </header>

      <AchievementGrid items={items} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  hot,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
  hot?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border/50 bg-popover/40 p-4 transition-colors hover:bg-popover/60"
      style={accent ? { borderColor: `${accent}22` } : undefined}
    >
      {accent && (
        <div
          className="pointer-events-none absolute right-0 top-0 h-16 w-16 opacity-15"
          style={{
            background: `radial-gradient(circle at top right, ${accent}, transparent 70%)`,
          }}
        />
      )}
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className="mt-1 flex items-baseline gap-1.5 text-2xl"
        style={{ fontFamily: "var(--font-instrument-serif), serif" }}
      >
        {value}
        {hot && (
          <span className="text-base" aria-label="on fire">🔥</span>
        )}
      </div>
      {sub && (
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}
