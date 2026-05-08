import * as React from "react";
import { AchievementBadge } from "./AchievementBadge";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/achievements/types";

export type AchievementCardProps = {
  id: string;
  title: string;
  description: string;
  flavorText: string;
  tier: Tier;
  points: number;
  rarityTarget: number;
  progressCurrent: number;
  progressTarget: number;
  unlockedAt: string | null;
  isHidden: boolean;
};

export function AchievementCard(p: AchievementCardProps) {
  const unlocked = !!p.unlockedAt;
  const pct = p.progressTarget > 0 ? Math.min(1, p.progressCurrent / p.progressTarget) : 0;
  const showSilhouette = p.isHidden && !unlocked;

  return (
    <div
      className={cn(
        "group relative flex gap-4 rounded-xl border p-4 transition-colors",
        unlocked
          ? "border-border/80 bg-popover/60"
          : "border-border/40 bg-popover/30 hover:bg-popover/50"
      )}
    >
      <AchievementBadge
        id={p.id}
        tier={p.tier}
        title={p.title}
        size="md"
        locked={!unlocked}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={cn(
              "font-serif text-base leading-tight",
              !unlocked && "text-muted-foreground"
            )}
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            {showSilhouette ? "???" : p.title}
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            +{p.points} XP
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {showSilhouette
            ? "A hidden achievement awaits."
            : unlocked
            ? <em>{p.flavorText}</em>
            : p.description}
        </p>
        {!unlocked && !showSilhouette && (
          <div className="mt-3">
            <div className="h-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-foreground/70 transition-all"
                style={{ width: `${Math.max(2, pct * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>
                {p.progressCurrent} / {p.progressTarget}
              </span>
              {pct >= 0.8 && pct < 1 && <span>{Math.round(pct * 100)}%</span>}
            </div>
          </div>
        )}
        {unlocked && (
          <div className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="font-mono">
              Earned {new Date(p.unlockedAt!).toLocaleDateString()}
            </span>
            {p.rarityTarget < 0.1 && (
              <span className="font-mono">
                · Top {Math.round(p.rarityTarget * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
