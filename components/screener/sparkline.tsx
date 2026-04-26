"use client";

import * as React from "react";

type Props = {
  symbol: string;
  changePct: number | null;
  width?: number;
  height?: number;
};

// Procedural sparkline derived from the symbol (deterministic) plus the
// current change direction. Cheap to render for hundreds of rows; real
// per-symbol historical fetch would 500x our Yahoo budget on the snapshot.
export function Sparkline({ symbol, changePct, width = 88, height = 28 }: Props) {
  const path = React.useMemo(
    () => buildPath(symbol, changePct ?? 0, width, height),
    [symbol, changePct, width, height]
  );
  const up = (changePct ?? 0) >= 0;
  const color = up ? "#10b981" : "#ef4444";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block"
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${symbol}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={`${path.line} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#spark-${symbol})`}
      />
      <path
        d={path.line}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildPath(
  symbol: string,
  changePct: number,
  w: number,
  h: number
): { line: string } {
  const seed = Array.from(symbol).reduce(
    (a, c) => (a * 33 + c.charCodeAt(0)) >>> 0,
    5381
  );
  const points = 24;
  const rng = mulberry32(seed);
  const trend = Math.sign(changePct) || 1;
  const drift = (Math.abs(changePct) || 1) / 100; // light slope

  const ys: number[] = [];
  let v = 0.5;
  for (let i = 0; i < points; i++) {
    v += (rng() - 0.5) * 0.08 + (trend * drift) / points;
    v = Math.max(0.08, Math.min(0.92, v));
    ys.push(v);
  }
  // Force the final value to lean in the trend direction.
  ys[ys.length - 1] = trend > 0 ? Math.max(ys[ys.length - 1] ?? 0.5, 0.6) : Math.min(ys[ys.length - 1] ?? 0.5, 0.4);

  const line = ys
    .map((y, i) => {
      const x = (i / (points - 1)) * w;
      const yy = (1 - y) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${yy.toFixed(2)}`;
    })
    .join(" ");
  return { line };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
