"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SqueezeScoreBadge } from "./SqueezeScoreBadge";
import { computeSqueezeScore } from "@/lib/analysis/squeezeScore";
import type { ShortData } from "@/lib/types/research";

interface ShortInterestLeaderboardProps {
  data: ShortData[];
  loading?: boolean;
  onSelect?: (item: ShortData) => void;
  selectedTicker?: string;
  showRedditHeat?: boolean;
}

type SortKey = "squeezeScore" | "shortInterestPct" | "daysToCover" | "siChangePct" | "borrowRate";

function SIBar({ pct }: { pct: number }) {
  const color = pct > 40 ? "#FF4545" : pct > 20 ? "#FFB347" : "#39FF14";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct * 2)}%`, background: color }} />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function DTCBadge({ dtc }: { dtc: number }) {
  const color = dtc > 5 ? "#FF4545" : dtc > 2 ? "#FFB347" : "#39FF14";
  return (
    <span className="text-[11px] font-mono" style={{ color }}>{dtc.toFixed(1)}d</span>
  );
}

function Sparkline({ data }: { data: { siPct: number }[] }) {
  if (!data.length) return null;
  const vals = data.map(d => d.siPct);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const isUp = (vals[vals.length - 1] ?? 0) > (vals[0] ?? 0);

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={isUp ? "#FF5252" : "#00C896"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ShortInterestLeaderboard({
  data,
  loading = false,
  onSelect,
  selectedTicker,
  showRedditHeat = false,
}: ShortInterestLeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("squeezeScore");
  const [sortDesc, setSortDesc] = useState(true);

  const enriched = data.map(d => {
    const { score, breakdown } = computeSqueezeScore(d);
    return { ...d, squeezeScore: score, squeezeBreakdown: breakdown };
  });

  const sorted = [...enriched].sort((a, b) => {
    const av = sortKey === "squeezeScore" ? a.squeezeScore : (a[sortKey as keyof typeof a] as number) ?? 0;
    const bv = sortKey === "squeezeScore" ? b.squeezeScore : (b[sortKey as keyof typeof b] as number) ?? 0;
    return sortDesc ? bv - av : av - bv;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <Minus size={9} className="opacity-30" />;
    return sortDesc ? <ArrowDown size={9} /> : <ArrowUp size={9} />;
  }

  function SortTh({ k, label }: { k: SortKey; label: string }) {
    return (
      <th
        onClick={() => handleSort(k)}
        className="px-3 py-2.5 text-left cursor-pointer hover:text-[#C8D0E7] transition-colors select-none"
      >
        <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#717A94] whitespace-nowrap">
          {label} <SortIcon k={k} />
        </span>
      </th>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-10 rounded research-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid #1E2130" }}>
            <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94] w-8">#</th>
            <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94]">Ticker</th>
            <SortTh k="shortInterestPct" label="SI % Float" />
            <SortTh k="daysToCover" label="Days to Cover" />
            <SortTh k="siChangePct" label="SI Change" />
            <SortTh k="borrowRate" label="Borrow Rate" />
            <SortTh k="squeezeScore" label="Squeeze Score" />
            <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94]">90D Trend</th>
            {showRedditHeat && (
              <th className="px-3 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94]">Reddit</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => {
            const isSelected = item.ticker === selectedTicker;
            const changeColor = item.siChangePct > 0 ? "#FF5252" : "#00C896";

            return (
              <tr
                key={item.ticker}
                onClick={() => onSelect?.(item)}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected ? "bg-[#00D4FF]/5" : "hover:bg-[#141720]"
                )}
                style={{ borderBottom: "1px solid #1E213050" }}
              >
                <td className="px-3 py-3 text-[11px] font-mono text-[#3A3F52]">{idx + 1}</td>
                <td className="px-3 py-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#C8D0E7]">{item.ticker}</span>
                    <div className="text-[10px] text-[#717A94] truncate max-w-[120px]">{item.companyName}</div>
                  </div>
                </td>
                <td className="px-3 py-3"><SIBar pct={item.shortInterestPct} /></td>
                <td className="px-3 py-3"><DTCBadge dtc={item.daysToCover} /></td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-0.5 text-[11px] font-mono" style={{ color: changeColor }}>
                    {item.siChangePct > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                    {Math.abs(item.siChangePct).toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-3 text-[11px] font-mono text-[#C8D0E7]">
                  {item.borrowRate.toFixed(0)}%
                </td>
                <td className="px-3 py-3">
                  <SqueezeScoreBadge
                    score={item.squeezeScore ?? 0}
                    breakdown={item.squeezeBreakdown}
                  />
                </td>
                <td className="px-3 py-3">
                  <Sparkline data={item.sparklineData} />
                </td>
                {showRedditHeat && (
                  <td className="px-3 py-3">
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: (item.redditMentions7d ?? 0) > 500 ? "#FF4545" : (item.redditMentions7d ?? 0) > 100 ? "#FFB347" : "#717A94" }}
                    >
                      {(item.redditMentions7d ?? 0).toLocaleString()}
                    </span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
