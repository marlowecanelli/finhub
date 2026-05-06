"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SectorPerformance, Timeframe } from "@/lib/types/research";

interface SectorHeatmapProps {
  data: SectorPerformance[];
  timeframe: Timeframe;
  onSectorClick?: (sector: SectorPerformance) => void;
}

function returnToColor(pct: number, min: number, max: number): string {
  const normalized = (pct - min) / Math.max(1, max - min);
  if (pct < 0) {
    const intensity = Math.abs(normalized);
    return `rgb(${Math.round(80 + intensity * 175)}, ${Math.round(20 + intensity * 10)}, ${Math.round(20 + intensity * 10)})`;
  }
  const intensity = normalized;
  return `rgb(${Math.round(10 + (1 - intensity) * 20)}, ${Math.round(80 + intensity * 175)}, ${Math.round(10 + (1 - intensity) * 20)})`;
}

function cellOpacity(pct: number, min: number, max: number): number {
  const range = Math.max(0.1, max - min);
  const abs = Math.abs(pct);
  const absMax = Math.max(Math.abs(min), Math.abs(max));
  return 0.25 + (abs / Math.max(0.1, absMax)) * 0.75;
}

export function SectorHeatmap({ data, timeframe, onSectorClick }: SectorHeatmapProps) {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [expandedSector, setExpandedSector] = useState<SectorPerformance | null>(null);

  const returns = data.map(d => d.returnPct);
  const min = Math.min(...returns);
  const max = Math.max(...returns);

  const sorted = [...data].sort((a, b) => b.returnPct - a.returnPct);

  function handleClick(s: SectorPerformance) {
    setExpandedSector(prev => prev?.etf.ticker === s.etf.ticker ? null : s);
    onSectorClick?.(s);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {sorted.map(sector => {
          const isHovered = hoveredSector === sector.etf.ticker;
          const isExpanded = expandedSector?.etf.ticker === sector.etf.ticker;
          const color = returnToColor(sector.returnPct, min, max);
          const opacity = cellOpacity(sector.returnPct, min, max);
          const textColor = sector.returnPct < 0 ? "#FF8080" : "#80FF80";

          return (
            <button
              key={sector.etf.ticker}
              onClick={() => handleClick(sector)}
              onMouseEnter={() => setHoveredSector(sector.etf.ticker)}
              onMouseLeave={() => setHoveredSector(null)}
              className={cn(
                "relative rounded-lg p-3 text-left transition-all duration-200 border",
                isExpanded ? "ring-1 ring-[#00D4FF]" : "",
                "hover:scale-[1.02]"
              )}
              style={{
                background: color,
                opacity: isHovered ? 1 : opacity,
                border: `1px solid ${isExpanded ? "#00D4FF" : "transparent"}`,
                minHeight: 72,
              }}
            >
              <span className="text-[10px] font-mono font-bold text-white/80 block">{sector.etf.ticker}</span>
              <span className="text-[9px] text-white/50 block truncate">{sector.etf.name}</span>
              <span
                className="text-lg font-mono font-bold block mt-1"
                style={{ color: textColor }}
              >
                {sector.returnPct > 0 ? "+" : ""}{sector.returnPct.toFixed(1)}%
              </span>

              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute left-0 top-full mt-1 z-50 w-52 rounded-lg p-3 shadow-2xl pointer-events-none"
                  style={{ background: "#0D0F14", border: "1px solid #1E2130" }}
                >
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-2">Top Holdings</div>
                  {sector.topHoldings.slice(0, 3).map(h => (
                    <div key={h} className="text-[11px] text-[#C8D0E7] font-mono">{h}</div>
                  ))}
                  <div className="mt-2 text-[10px] text-[#717A94]">
                    Vol vs 20d avg: <span className="text-[#C8D0E7] font-mono">{sector.volumeVs20dAvg.toFixed(2)}×</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Scale legend */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-[#717A94]">{min.toFixed(1)}%</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{ background: "linear-gradient(to right, #AF2020, #333, #20AF20)" }}
        />
        <span className="text-[10px] font-mono text-[#717A94]">+{max.toFixed(1)}%</span>
      </div>

      {/* Expanded sector sub-heatmap */}
      {expandedSector && (
        <div
          className="rounded-lg p-4 space-y-3 mt-2 animate-data-rise"
          style={{ background: "#141720", border: "1px solid #1E2130" }}
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-[#C8D0E7]">{expandedSector.etf.name} — Top Constituents</h4>
            <button onClick={() => setExpandedSector(null)} className="text-[#3A3F52] hover:text-[#717A94] text-xs">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {expandedSector.constituents.map(c => (
              <div
                key={c.ticker}
                className="flex items-center justify-between rounded px-2.5 py-1.5"
                style={{
                  background: c.returnPct >= 0 ? "#00C89610" : "#FF525210",
                  border: `1px solid ${c.returnPct >= 0 ? "#00C89620" : "#FF525220"}`,
                }}
              >
                <span className="text-[11px] font-mono font-bold text-[#C8D0E7]">{c.ticker}</span>
                <span
                  className="text-[11px] font-mono"
                  style={{ color: c.returnPct >= 0 ? "#00C896" : "#FF5252" }}
                >
                  {c.returnPct > 0 ? "+" : ""}{c.returnPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
