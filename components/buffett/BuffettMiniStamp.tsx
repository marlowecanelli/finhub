"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { BuffettScoreResponse, BuffettLabel } from "@/lib/buffett/types";

const COLOR: Record<BuffettLabel, string> = {
  "Highly Buffett-Worthy": "#B08A3E",
  "Buffett-Worthy":        "#B08A3E",
  "Neutral":               "#f59e0b",
  "Avoid":                 "#ef4444",
  "Strongly Avoid":        "#ef4444",
};

// Two-line abbreviated label that fits in the small stamp
const SHORT: Record<BuffettLabel, [string, string?]> = {
  "Highly Buffett-Worthy": ["Highly",  "Worthy"],
  "Buffett-Worthy":        ["Buffett", "Worthy"],
  "Neutral":               ["Neutral", undefined],
  "Avoid":                 ["Avoid",   undefined],
  "Strongly Avoid":        ["Strong",  "Avoid"],
};

export function BuffettMiniStamp({ ticker }: { ticker: string }) {
  const [data, setData] = useState<BuffettScoreResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/buffett-score?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: BuffettScoreResponse | null) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [ticker]);

  if (!data) return null;

  const color  = COLOR[data.label];
  const [line1, line2] = SHORT[data.label];

  const size   = 72;
  const cx     = size / 2;    // 36
  const cy     = size / 2;    // 36
  const outerR = size / 2 - 2; // 34 — dashed border ring
  const midR   = size / 2 - 7; // 29 — mid decorative ring
  const innerR = size / 2 - 11; // 25 — filled background

  // Score vertical split: score numerals slightly above center, label below
  const scoreY = line2 ? cy - 4 : cy + 1;
  const label1Y = line2 ? cy + 11 : cy + 14;
  const label2Y = cy + 19;

  return (
    <motion.a
      href="#buffett-score"
      initial={{ opacity: 0, scale: 0.65, rotate: -8 }}
      animate={{ opacity: 1, scale: 1,    rotate:  0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      className="shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95"
      aria-label={`Buffett Score ${data.overall.toFixed(1)}/10 — ${data.label}. View full analysis.`}
      title={`Buffett Score: ${data.overall.toFixed(1)} / 10 — ${data.label}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        overflow="visible"
        aria-hidden="true"
        style={{
          filter: `drop-shadow(0 0 5px ${color}66) drop-shadow(0 1px 3px rgba(0,0,0,0.4))`,
        }}
      >
        {/* Outer dashed perforation ring — the "stamp" edge */}
        <circle
          cx={cx} cy={cy} r={outerR}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="3 2.2"
          opacity={0.55}
        />

        {/* Mid decorative ring */}
        <circle
          cx={cx} cy={cy} r={midR}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          opacity={0.45}
        />

        {/* Inner background disc */}
        <circle
          cx={cx} cy={cy} r={innerR}
          fill={color}
          fillOpacity={0.12}
        />
        <circle
          cx={cx} cy={cy} r={innerR}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.7}
        />

        {/* Score numeral */}
        <text
          x={cx}
          y={scoreY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={19}
          fontWeight="700"
          fill={color}
          fontFamily="'JetBrains Mono', 'Courier New', monospace"
        >
          {data.overall.toFixed(1)}
        </text>

        {/* Label line 1 */}
        <text
          x={cx}
          y={label1Y}
          textAnchor="middle"
          fontSize={5.5}
          fontWeight="700"
          fill={color}
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          opacity={0.9}
          style={{ textTransform: "uppercase", letterSpacing: "0.7px" }}
        >
          {line1}
        </text>

        {/* Label line 2 (optional) */}
        {line2 && (
          <text
            x={cx}
            y={label2Y}
            textAnchor="middle"
            fontSize={5.5}
            fontWeight="700"
            fill={color}
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            opacity={0.9}
            style={{ textTransform: "uppercase", letterSpacing: "0.7px" }}
          >
            {line2}
          </text>
        )}
      </svg>
    </motion.a>
  );
}
