"use client";

import { useState, useEffect } from "react";
import { SectorHeatmap } from "@/components/research/SectorHeatmap";
import { RRGChart } from "@/components/research/RRGChart";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockSectorPerformance } from "@/lib/api/research/sectors";
import { narrativeEngine } from "@/lib/analysis/sectorNarrativeEngine";
import type { SectorPerformance, Timeframe } from "@/lib/types/research";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

const TIMEFRAMES: Timeframe[] = ["1W", "1M", "3M", "6M", "YTD", "1Y"];

export default function SectorRotationPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [data, setData] = useState<SectorPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(mockSectorPerformance(timeframe));
      setLoading(false);
    }, 200);
  }, [timeframe]);

  const narrative = data.length ? narrativeEngine(data) : "";
  const flowData = [...data].sort((a, b) => b.netFlow - a.netFlow);

  const currentMonth = new Date().getMonth();
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const SECTORS_SHORT = ["XLK","XLF","XLE","XLV","XLI","XLY","XLP","XLRE","XLU","XLB","XLC"];

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

        {/* Flow timeline */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Estimated Net Flows</h3>
          {loading
            ? <div className="h-48 research-shimmer rounded" />
            : <>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flowData} margin={{ top: 4, right: 4, bottom: 20, left: 0 }}>
                    <XAxis
                      dataKey="etf.ticker"
                      tick={{ fill: "#717A94", fontSize: 9, fontFamily: "JetBrains Mono" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", borderRadius: 6, fontSize: 10 }}
                      formatter={(v: number) => [`$${(v / 1e9).toFixed(2)}B`, "Net Flow"]}
                    />
                    <Bar dataKey="netFlow" radius={[3, 3, 0, 0]}>
                      {flowData.map((entry, i) => (
                        <Cell key={i} fill={entry.etf.color} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-[#717A94] leading-relaxed">{narrative}</p>
            </>
          }
        </div>

        {/* Seasonality calendar */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Sector Seasonality (20Y Avg)</h3>
          <div className="overflow-x-auto scrollbar-none">
            <table className="text-[9px] font-mono">
              <thead>
                <tr>
                  <th className="px-1 py-1 text-left text-[#717A94]">Sector</th>
                  {MONTHS.map((m, mi) => (
                    <th
                      key={m}
                      className={cn("px-1 py-1 text-center font-bold", mi === currentMonth ? "text-[#00D4FF]" : "text-[#3A3F52]")}
                      style={mi === currentMonth ? { border: "1px solid #00D4FF30" } : {}}
                    >
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.length ? data : SECTORS_SHORT.map(t => ({ etf: { ticker: t, name: t, color: "#717A94" }, historicalReturns: {} } as unknown as SectorPerformance))).map(sector => (
                  <tr key={sector.etf.ticker}>
                    <td className="px-1 py-1 text-[#717A94]" style={{ color: sector.etf.color }}>{sector.etf.ticker}</td>
                    {MONTHS.map((_, mi) => {
                      const monthReturns = sector.historicalReturns?.[String(mi + 1)] ?? [];
                      const avg = monthReturns.length ? monthReturns.reduce((s: number, v: number) => s + v, 0) / monthReturns.length : 0;
                      const color = avg > 2 ? "#00C896" : avg > 0 ? "#00C89660" : avg > -2 ? "#FF525260" : "#FF5252";
                      const bgOpacity = Math.min(0.5, Math.abs(avg) / 5);
                      return (
                        <td
                          key={mi}
                          className="px-1 py-1 text-center"
                          style={{
                            color,
                            background: `rgba(${avg > 0 ? "0,200,150" : "255,82,82"},${bgOpacity})`,
                            border: mi === currentMonth ? "1px solid #00D4FF30" : undefined,
                          }}
                        >
                          {avg > 0 ? "+" : ""}{avg.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-[#3A3F52] font-mono">Average monthly returns over 20 years · Current month highlighted</p>
        </div>
      </div>
    </div>
  );
}
