"use client";

import { useState, useEffect } from "react";
import { ShortInterestLeaderboard } from "@/components/research/ShortInterestLeaderboard";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockShortData } from "@/lib/api/research/shortInterest";
import type { ShortData } from "@/lib/types/research";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  BarChart, Bar,
} from "recharts";

export default function ShortInterestPage() {
  const [data, setData] = useState<ShortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ShortData | null>(null);
  const [showReddit, setShowReddit] = useState(false);

  useEffect(() => {
    setData(mockShortData());
    setLoading(false);
  }, []);

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Short Interest Dashboard</h1>
          <p className="text-xs text-[#717A94] mt-1">FINRA short sale data · biweekly reporting · ranked by Squeeze Score</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReddit(r => !r)}
            className="text-[11px] font-mono px-2.5 py-1 rounded border transition-all"
            style={{
              background: showReddit ? "#FF454510" : "transparent",
              color: showReddit ? "#FF4545" : "#717A94",
              borderColor: showReddit ? "#FF454530" : "transparent",
            }}
          >
            Reddit Heat
          </button>
          <DataFreshnessIndicator cacheKey="short:all" />
        </div>
      </div>

      {/* Leaderboard */}
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1E2130", background: "#141720" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "#1E2130", background: "#0D0F14" }}>
          <span className="text-xs font-semibold text-[#C8D0E7]">Most Shorted Stocks — Ranked by Squeeze Score</span>
        </div>
        <ShortInterestLeaderboard
          data={data}
          loading={loading}
          onSelect={setSelected}
          selectedTicker={selected?.ticker}
          showRedditHeat={showReddit}
        />
      </div>

      {/* Selected deep-dive */}
      {selected && (
        <div
          className="rounded-xl p-5 space-y-5 animate-data-rise"
          style={{ border: "1px solid #1E2130", background: "#141720" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#C8D0E7]">{selected.ticker} — Deep Dive</h2>
              <p className="text-xs text-[#717A94]">{selected.companyName}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-[#3A3F52] hover:text-[#717A94]">✕</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SI over time */}
            <div>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Short Interest Over Time (90d)</h4>
              <div className="rounded-lg p-3" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={selected.sparklineData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="siGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4545" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF4545" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#717A94", fontSize: 9 }} axisLine={false} tickLine={false} interval={6} />
                    <YAxis tick={{ fill: "#717A94", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", borderRadius: 6, fontSize: 10 }}
                      itemStyle={{ color: "#FF4545" }}
                      formatter={(v: number) => [`${v.toFixed(2)}%`, "SI%"]}
                    />
                    <Area type="monotone" dataKey="siPct" stroke="#FF4545" strokeWidth={1.5} fill="url(#siGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Short Interest", value: `${(selected.shortInterestShares / 1e6).toFixed(1)}M shares`, color: "#FF4545" },
                { label: "SI % Float", value: `${selected.shortInterestPct.toFixed(1)}%`, color: selected.shortInterestPct > 40 ? "#FF4545" : selected.shortInterestPct > 20 ? "#FFB347" : "#39FF14" },
                { label: "Days to Cover", value: `${selected.daysToCover.toFixed(1)}d`, color: selected.daysToCover > 5 ? "#FF4545" : selected.daysToCover > 2 ? "#FFB347" : "#39FF14" },
                { label: "Borrow Rate", value: `${selected.borrowRate.toFixed(0)}%`, color: selected.borrowRate > 50 ? "#FF4545" : "#C8D0E7" },
                { label: "SI Change", value: `${selected.siChangePct > 0 ? "+" : ""}${selected.siChangePct.toFixed(1)}%`, color: selected.siChangePct > 0 ? "#FF5252" : "#00C896" },
                { label: "Float", value: `${(selected.floatShares / 1e6).toFixed(0)}M`, color: "#C8D0E7" },
              ].map(item => (
                <div key={item.label} className="rounded-lg p-3" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">{item.label}</span>
                  <span className="text-lg font-mono font-bold mt-1 block" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
