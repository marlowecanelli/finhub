import * as React from "react";
import { BadgeFrame, TIER_ACCENT } from "./badges/BadgeFrame";
import { GLYPHS } from "./badges/glyphs";
import type { Tier } from "@/lib/achievements/types";

const SIZES = { sm: 32, md: 56, lg: 96 } as const;

export function AchievementBadge({
  id,
  tier,
  title,
  size = "md",
  locked = false,
  className,
}: {
  id: string;
  tier: Tier;
  title: string;
  size?: keyof typeof SIZES;
  locked?: boolean;
  className?: string;
}) {
  const px = SIZES[size];
  const Glyph = GLYPHS[id];
  const accent = TIER_ACCENT[tier];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      role="img"
      aria-label={`${title} (${accent.label} tier${locked ? ", locked" : ""})`}
      className={className}
      style={{ color: locked ? "hsl(var(--muted-foreground) / 0.5)" : accent.stroke }}
    >
      <BadgeFrame tier={tier} locked={locked}>
        {Glyph ? <Glyph /> : null}
      </BadgeFrame>
    </svg>
  );
}
