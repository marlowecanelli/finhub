"use client";

import type { BuffettLabel } from "@/lib/buffett/types";

interface BuffettBadgeProps {
  score: number;
  label: BuffettLabel;
  size?: number;
}

const TIER_COLORS: Record<BuffettLabel, { ring: string; innerRing: string; text: string; label: string }> = {
  "Highly Buffett-Worthy": {
    ring: "#B08A3E",
    innerRing: "#8A6A26",
    text: "#1A1814",
    label: "#2F6B43",
  },
  "Buffett-Worthy": {
    ring: "#B08A3E",
    innerRing: "#8A6A26",
    text: "#1A1814",
    label: "#3A7D55",
  },
  Neutral: {
    ring: "#8A8070",
    innerRing: "#6A6050",
    text: "#1A1814",
    label: "#B8862B",
  },
  Avoid: {
    ring: "#8A6050",
    innerRing: "#6A4040",
    text: "#1A1814",
    label: "#8C4A2A",
  },
  "Strongly Avoid": {
    ring: "#8A4040",
    innerRing: "#6A2020",
    text: "#1A1814",
    label: "#8C2A2A",
  },
};

export function BuffettBadge({ score, label, size = 200 }: BuffettBadgeProps) {
  const colors = TIER_COLORS[label];
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  const innerR = r - size * 0.03;
  const textR = r - size * 0.055;

  // Arc path for "BUFFETT SCORE" text
  const arcD = describeArc(cx, cy, textR, -145, -35);
  const scoreText = score.toFixed(1);
  const fontSize = size * 0.22;
  const subFontSize = size * 0.065;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Buffett Score: ${score} out of 10 — ${label}`}
      role="img"
    >
      <defs>
        {/* Emboss gradient */}
        <radialGradient id="bg-grad" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F7F3EC" />
          <stop offset="100%" stopColor="#E8E0D0" />
        </radialGradient>
        {/* Inner shadow */}
        <filter id="inner-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={size * 0.012} result="blur" />
          <feOffset dx={size * 0.01} dy={size * 0.015} result="offsetBlur" />
          <feComposite in="offsetBlur" in2="SourceAlpha" operator="in" result="shadow" />
          <feFlood floodColor="rgba(0,0,0,0.25)" result="color" />
          <feComposite in="color" in2="shadow" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Text path ID */}
        <path id="score-arc" d={arcD} />
      </defs>

      {/* Outer hairline gold ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r + size * 0.015}
        fill="none"
        stroke={colors.ring}
        strokeWidth={size * 0.008}
        opacity={0.6}
      />

      {/* Main cream disk */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="url(#bg-grad)"
        filter="url(#inner-shadow)"
      />

      {/* Inner decorative ring */}
      <circle
        cx={cx}
        cy={cy}
        r={innerR}
        fill="none"
        stroke={colors.innerRing}
        strokeWidth={size * 0.005}
        opacity={0.5}
      />

      {/* Tick marks around inner ring */}
      {Array.from({ length: 40 }, (_, i) => {
        const angle = (i / 40) * 360;
        const rad = (angle * Math.PI) / 180;
        const isLong = i % 5 === 0;
        const r1 = innerR;
        const r2 = innerR - (isLong ? size * 0.025 : size * 0.012);
        return (
          <line
            key={i}
            x1={cx + r1 * Math.cos(rad)}
            y1={cy + r1 * Math.sin(rad)}
            x2={cx + r2 * Math.cos(rad)}
            y2={cy + r2 * Math.sin(rad)}
            stroke={colors.innerRing}
            strokeWidth={size * 0.003}
            opacity={0.35}
          />
        );
      })}

      {/* "BUFFETT SCORE" text along top arc */}
      <text
        fontSize={subFontSize * 0.85}
        fill={colors.innerRing}
        fontFamily="var(--font-inter), ui-sans-serif, sans-serif"
        fontWeight="600"
        letterSpacing={size * 0.012}
        style={{ textTransform: "uppercase" }}
      >
        <textPath href="#score-arc" startOffset="50%" textAnchor="middle">
          BUFFETT SCORE
        </textPath>
      </text>

      {/* Score numeral */}
      <text
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fill={colors.text}
        fontFamily="var(--font-fraunces), 'Fraunces', serif"
        fontWeight="700"
      >
        {scoreText}
      </text>

      {/* "/ 10" sub text */}
      <text
        x={cx + size * 0.185}
        y={cy + fontSize * 0.1}
        textAnchor="start"
        fontSize={subFontSize * 0.85}
        fill={colors.innerRing}
        fontFamily="var(--font-inter), ui-sans-serif, sans-serif"
      >
        / 10
      </text>

      {/* Label */}
      <text
        x={cx}
        y={cy + size * 0.22}
        textAnchor="middle"
        fontSize={subFontSize * 0.9}
        fill={colors.label}
        fontFamily="var(--font-inter), ui-sans-serif, sans-serif"
        fontWeight="700"
        letterSpacing={size * 0.006}
        style={{ textTransform: "uppercase" }}
      >
        {label}
      </text>
    </svg>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
