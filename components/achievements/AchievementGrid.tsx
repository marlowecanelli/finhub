"use client";

import * as React from "react";
import { AchievementCard, type AchievementCardProps } from "./AchievementCard";
import type { Category } from "@/lib/achievements/types";
import { cn } from "@/lib/utils";

type Item = AchievementCardProps & { category: Category; enabled: boolean };

type Filter = "all" | "earned" | "in_progress" | "locked";

const CATEGORY_LABEL: Record<Category, string> = {
  onboarding: "Onboarding",
  research: "Research",
  portfolio: "Portfolio",
  goals: "Goals",
  ai: "AI & Power User",
  streaks: "Streaks",
  news: "News",
  hidden: "Hidden",
  meta: "Meta",
  social: "Social",
  seasonal: "Seasonal",
};

const CATEGORY_ICON: Partial<Record<Category, string>> = {
  onboarding: "◈",
  research: "⌖",
  portfolio: "◑",
  goals: "◎",
  ai: "◆",
  streaks: "▲",
  news: "◻",
  hidden: "◬",
  meta: "◇",
  social: "◯",
  seasonal: "✦",
};

export function AchievementGrid({ items }: { items: Item[] }) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const counts = React.useMemo(() => {
    const earned = items.filter((i) => i.enabled && i.unlockedAt).length;
    const inProgress = items.filter(
      (i) => i.enabled && !i.unlockedAt && i.progressCurrent > 0 && i.progressCurrent < i.progressTarget
    ).length;
    const locked = items.filter(
      (i) => i.enabled && !i.isHidden && !i.unlockedAt && i.progressCurrent === 0
    ).length;
    return { earned, inProgress, locked };
  }, [items]);

  const filtered = React.useMemo(() => {
    return items.filter((it) => {
      if (!it.enabled) return false;
      if (filter === "all") return true;
      if (filter === "earned") return !!it.unlockedAt;
      if (filter === "locked") return !it.unlockedAt && it.progressCurrent === 0;
      if (filter === "in_progress")
        return !it.unlockedAt && it.progressCurrent > 0 && it.progressCurrent < it.progressTarget;
      return true;
    });
  }, [items, filter]);

  const grouped = React.useMemo(() => {
    const map = new Map<Category, Item[]>();
    for (const it of filtered) {
      if (it.isHidden && !it.unlockedAt) continue;
      const list = map.get(it.category) ?? [];
      list.push(it);
      map.set(it.category, list);
    }
    return map;
  }, [filtered]);

  const filters: { id: Filter; label: string; count?: number }[] = [
    { id: "all", label: "All" },
    { id: "earned", label: "Earned", count: counts.earned },
    { id: "in_progress", label: "In Progress", count: counts.inProgress },
    { id: "locked", label: "Locked", count: counts.locked },
  ];

  return (
    <div>
      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-all duration-150",
              filter === f.id
                ? "border-foreground bg-foreground text-background shadow-sm"
                : "border-border/50 text-muted-foreground hover:border-border hover:bg-popover/60"
            )}
          >
            {f.label}
            {f.count !== undefined && f.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 font-mono text-[9px]",
                  filter === f.id ? "bg-background/20 text-background" : "bg-muted/60 text-muted-foreground"
                )}
              >
                {f.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Category sections */}
      {Array.from(grouped.entries()).map(([cat, list]) => {
        const earnedCount = items.filter((i) => i.category === cat && i.unlockedAt).length;
        const total = items.filter((i) => i.category === cat && i.enabled && !i.isHidden).length;
        const pct = total > 0 ? earnedCount / total : 0;
        const icon = CATEGORY_ICON[cat];

        return (
          <section key={cat} className="mb-10">
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon && (
                  <span className="font-mono text-xs text-muted-foreground/60">{icon}</span>
                )}
                <h2
                  className="text-lg"
                  style={{ fontFamily: "var(--font-instrument-serif), serif" }}
                >
                  {CATEGORY_LABEL[cat]}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {/* Mini completion bar */}
                <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-muted/40 sm:block">
                  <div
                    className="h-full rounded-full bg-foreground/40 transition-all"
                    style={{ width: `${Math.max(pct > 0 ? 4 : 0, pct * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {earnedCount} / {total}
                </span>
              </div>
            </header>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {list.map((it) => (
                <AchievementCard key={it.id} {...it} />
              ))}
            </div>
          </section>
        );
      })}

      {grouped.size === 0 && (
        <div className="rounded-xl border border-border/30 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nothing matches this filter yet.</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground/50">
            {filter === "in_progress" && "Start using FinHub to make progress on achievements."}
            {filter === "earned" && "Earn your first badge by completing any task in the app."}
            {filter === "locked" && "All achievements are either earned or in progress."}
          </p>
        </div>
      )}
    </div>
  );
}
