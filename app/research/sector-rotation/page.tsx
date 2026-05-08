"use client";

import { useState, useEffect } from "react";
import { SectorHeatmap } from "@/components/research/SectorHeatmap";
import { RRGChart } from "@/components/research/RRGChart";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { narrativeEngine } from "@/lib/analysis/sectorNarrativeEngine";
import type { SectorPerformance, Timeframe } from "@/lib/types/research";
import { cn } from "@/lib/utils";

const TIMEFRAMES: Timeframe[] = ["1W", "1M", "3M", "6M", "YTD", "1Y"];

export default function SectorRotationPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [data, setData] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/research/sectors?timeframe=${encodeURIComponent(timeframe)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as { data: SectorPerformance[] };
        if (cancelled) return;
        setData(json.data);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [timeframe]);

  const narrative = data.length ? narrativeEngine(data) : "";

  return (
    <div className="space-y-5 animate-data-rise">
      {/* Header + timeframe */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Sector Rotation Tracker</h1>
          <p className="text-xs text-[#717A94] mt-1">SPDR sector ETFs — relative strength and institutional flows</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#0D0F14" }}>
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-mono transition-all",
                  timeframe === tf ? "text-[#C8D0E7] bg-[#1E2130]" : "text-[#717A94] hover:text-[#C8D0E7]"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <DataFreshnessIndicator cacheKey={`sectors:${timeframe}`} />
        </div>
      </div>

      {/* 2×2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Heatmap */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Performance Heatmap ({timeframe})</h3>
          {loading
            ? <div className="h-48 research-shimmer rounded" />
            : <SectorHeatmap data={data} timeframe={timeframe} />
          }
        </div>

        {/* RRG */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Relative Rotation Graph</h3>
          {loading
            ? <div className="h-48 research-shimmer rounded" />
            : <RRGChart data={data} />
          }
        </div>

        {/* Top constituents */}
        <div className="rounded-xl p-4 space-y-3 lg:col-span-2" style={{ background: "#141720", border: "1px solid #1E2130" }}>
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Top Holdings — Today's Move</h3>
          {loading ? (
            <div className="h-32 research-shimmer rounded" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {data.map(sector => (
                <div key={sector.etf.ticker} className="rounded-lg p-3" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold" style={{ color: sector.etf.color }}>{sector.etf.ticker}</span>
                    <span className="text-[10px] font-mono" style={{ color: sector.returnPct >= 0 ? "#00C896" : "#FF5252" }}>
                      {sector.returnPct >= 0 ? "+" : ""}{sector.returnPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sector.constituents.slice(0, 5).map(c => (
                      <div key={c.ticker} className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#C8D0E7]">{c.ticker}</span>
                        <span style={{ color: c.returnPct >= 0 ? "#00C896" : "#FF5252" }}>
                          {c.returnPct >= 0 ? "+" : ""}{c.returnPct.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.length > 0 && (
            <p className="text-[11px] text-[#717A94] leading-relaxed pt-2 border-t" style={{ borderColor: "#1E2130" }}>{narrative}</p>
          )}
        </div>
      </div>
    </div>
  );
}
