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

export function AchievementGrid({ items }: { items: Item[] }) {
  const [filter, setFilter] = React.useState<Filter>("all");

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
      // Hide unrevealed hidden badges from grid entirely.
      if (it.isHidden && !it.unlockedAt) continue;
      const list = map.get(it.category) ?? [];
      list.push(it);
      map.set(it.category, list);
    }
    return map;
  }, [filtered]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "earned", label: "Earned" },
    { id: "in_progress", label: "In progress" },
    { id: "locked", label: "Locked" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors",
              filter === f.id
                ? "border-foreground bg-foreground text-background"
                : "border-border/60 text-muted-foreground hover:bg-popover/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {Array.from(grouped.entries()).map(([cat, list]) => {
        const earnedCount = items.filter((i) => i.category === cat && i.unlockedAt).length;
        const total = items.filter((i) => i.category === cat && i.enabled && !i.isHidden).length;
        return (
          <section key={cat} className="mb-8">
            <header className="mb-3 flex items-baseline justify-between">
              <h2
                className="text-lg"
                style={{ fontFamily: "var(--font-instrument-serif), serif" }}
              >
                {CATEGORY_LABEL[cat]}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {earnedCount} / {total}
              </span>
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
        <div className="rounded-xl border border-border/40 p-10 text-center text-sm text-muted-foreground">
          Nothing matches this filter yet.
        </div>
      )}
    </div>
  );
}
