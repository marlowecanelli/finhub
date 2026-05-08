import * as React from "react";
import type { Tier } from "@/lib/achievements/types";

/**
 * Shared geometric frame for every achievement badge. Consistent 64x64
 * viewBox, a tier-tinted ring, and a centered glyph slot for the badge's
 * unique mark. Think challenge coin: hex outer, circular inner field,
 * tiny corner notches.
 */

export const TIER_ACCENT: Record<Tier, { stroke: string; fill: string; glow: string; label: string }> = {
  bronze:   { stroke: "#a86b3c", fill: "#3a2412", glow: "#b8794a", label: "Bronze" },
  silver:   { stroke: "#c8cdd4", fill: "#1c2026", glow: "#d8dde4", label: "Silver" },
  gold:     { stroke: "#e3b341", fill: "#2a200a", glow: "#f0c860", label: "Gold" },
  platinum: { stroke: "#9ad7e7", fill: "#0e2630", glow: "#bce6f0", label: "Platinum" },
  mythic:   { stroke: "#c997ff", fill: "#1d0f33", glow: "#dab8ff", label: "Mythic" },
};

export function BadgeFrame({
  tier,
  locked,
  children,
}: {
  tier: Tier;
  locked?: boolean;
  children: React.ReactNode;
}) {
  const accent = TIER_ACCENT[tier];
  const stroke = locked ? "hsl(var(--muted-foreground) / 0.4)" : accent.stroke;
  const fill = locked ? "hsl(var(--muted) / 0.15)" : accent.fill;
  return (
    <g>
      <defs>
        <radialGradient id={`bg-${tier}-${locked ? "l" : "u"}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={fill} stopOpacity={locked ? 0.2 : 0.95} />
          <stop offset="100%" stopColor={fill} stopOpacity={locked ? 0.05 : 0.6} />
        </radialGradient>
      </defs>
      {/* Hex outer */}
      <path
        d="M32 2 L58 18 L58 46 L32 62 L6 46 L6 18 Z"
        fill={`url(#bg-${tier}-${locked ? "l" : "u"})`}
        stroke={stroke}
        strokeWidth={1.4}
      />
      {/* Inner ring */}
      <circle cx={32} cy={32} r={20} fill="none" stroke={stroke} strokeWidth={0.8} opacity={0.55} />
      {/* Corner notches */}
      <path d="M32 4 L34 7 L30 7 Z M32 60 L34 57 L30 57 Z" fill={stroke} opacity={0.7} />
      {!locked && children}
      {locked && (
        <g>
          <circle cx={32} cy={30} r={5} fill="none" stroke={stroke} strokeWidth={1.2} />
          <rect x={28} y={30} width={8} height={9} rx={1} fill="none" stroke={stroke} strokeWidth={1.2} />
        </g>
      )}
    </g>
  );
}
