import * as React from "react";
import { AchievementBadge } from "./AchievementBadge";
import { TIER_ACCENT } from "./badges/BadgeFrame";
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

const TIER_LABEL: Record<Tier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  mythic: "Mythic",
};

function ProgressBar({ pct, tier }: { pct: number; tier: Tier }) {
  const accent = TIER_ACCENT[tier];
  const isNearDone = pct >= 0.75 && pct < 1;
  return (
    <div className="mt-3">
      <div className="h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(2, pct * 100)}%`,
            background: isNearDone
              ? `linear-gradient(90deg, ${accent.stroke}88, ${accent.glow})`
              : `${accent.stroke}88`,
            boxShadow: isNearDone ? `0 0 6px ${accent.glow}66` : undefined,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>
          {Math.round(pct * 100)}%
        </span>
        {isNearDone && (
          <span style={{ color: accent.stroke }}>almost there</span>
        )}
      </div>
    </div>
  );
}

export function AchievementCard(p: AchievementCardProps) {
  const unlocked = !!p.unlockedAt;
  const pct = p.progressTarget > 0 ? Math.min(1, p.progressCurrent / p.progressTarget) : 0;
  const showSilhouette = p.isHidden && !unlocked;
  const accent = TIER_ACCENT[p.tier];

  return (
    <div
      className={cn(
        "group relative flex gap-4 overflow-hidden rounded-xl border p-4 transition-all duration-200",
        unlocked
          ? "border-border/60 bg-popover/70 hover:bg-popover/90"
          : "border-border/30 bg-popover/20 hover:bg-popover/40 hover:border-border/50"
      )}
      style={
        unlocked
          ? {
              borderColor: `${accent.stroke}44`,
              boxShadow: `inset 0 0 0 1px ${accent.stroke}11, 0 0 20px ${accent.glow}08`,
            }
          : undefined
      }
    >
      {/* Tier accent stripe */}
      {unlocked && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
          style={{ background: `linear-gradient(180deg, ${accent.stroke}cc, ${accent.stroke}44)` }}
        />
      )}

      {/* Subtle tier glow in corner for gold+ */}
      {unlocked && (p.tier === "gold" || p.tier === "platinum" || p.tier === "mythic") && (
        <div
          className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-xl opacity-20"
          style={{
            background: `radial-gradient(circle at top right, ${accent.glow}, transparent 70%)`,
          }}
        />
      )}

      <AchievementBadge
        id={p.id}
        tier={p.tier}
        title={p.title}
        size="md"
        locked={!unlocked}
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        {/* Title row */}
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className={cn(
              "font-serif text-base leading-tight",
              unlocked ? "text-foreground" : "text-muted-foreground"
            )}
            style={{ fontFamily: "var(--font-instrument-serif), serif" }}
          >
            {showSilhouette ? "???" : p.title}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {unlocked && (
              <span
                className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                style={{ color: accent.stroke, background: `${accent.stroke}18` }}
              >
                {TIER_LABEL[p.tier]}
              </span>
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              +{p.points} XP
            </span>
          </div>
        </div>

        {/* Description / flavor text */}
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {showSilhouette ? (
            "A hidden achievement awaits."
          ) : unlocked ? (
            <em>{p.flavorText}</em>
          ) : (
            p.description
          )}
        </p>

        {/* Progress */}
        {!unlocked && !showSilhouette && pct > 0 && (
          <ProgressBar pct={pct} tier={p.tier} />
        )}

        {/* Locked with zero progress — tiny tier hint */}
        {!unlocked && !showSilhouette && pct === 0 && (
          <div className="mt-2 font-mono text-[10px] text-muted-foreground/50">
            0 / {p.progressTarget}
          </div>
        )}

        {/* Unlocked metadata */}
        {unlocked && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              Earned {new Date(p.unlockedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {p.rarityTarget < 0.1 && (
              <span
                className="font-mono text-[10px]"
                style={{ color: accent.stroke }}
              >
                · Top {Math.round(p.rarityTarget * 100)}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
