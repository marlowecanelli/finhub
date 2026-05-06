"use client";

import { useState, useEffect } from "react";
import { OptionsFlowFeed } from "@/components/research/OptionsFlowFeed";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockOptionsOrders } from "@/lib/api/research/optionsFlow";
import type { OptionsOrder } from "@/lib/types/research";
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";

export default function OptionsFlowPage() {
  const [orders, setOrders] = useState<OptionsOrder[]>([]);

  useEffect(() => {
    setOrders(mockOptionsOrders(50));
  }, []);

  const calls = orders.filter(o => o.optionType === "CALL");
  const puts = orders.filter(o => o.optionType === "PUT");
  const pcRatio = calls.length > 0 ? (puts.length / calls.length).toFixed(2) : "0.00";
  const totalPremium = orders.reduce((s, o) => s + o.premium, 0);
  const unusual = orders.filter(o => o.isUnusual);

  const topCallTickers = Object.entries(
    calls.reduce<Record<string, number>>((acc, o) => {
      acc[o.ticker] = (acc[o.ticker] ?? 0) + o.premium;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const topPutTickers = Object.entries(
    puts.reduce<Record<string, number>>((acc, o) => {
      acc[o.ticker] = (acc[o.ticker] ?? 0) + o.premium;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 6);

  function fmt(n: number) {
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${(n / 1e3).toFixed(0)}K`;
  }

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Options Flow Monitor</h1>
          <p className="text-xs text-[#717A94] mt-1">Unusual Whales · real-time unusual options activity · sweeps and blocks</p>
        </div>
        <DataFreshnessIndicator cacheKey="optionsflow:live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Live feed — 60% */}
        <div className="lg:col-span-3 rounded-xl p-4 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#C8D0E7]">Live Options Activity</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#39FF14]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] animate-pulse-dot" />LIVE
            </span>
          </div>
          <OptionsFlowFeed live />
        </div>

        {/* Analytics — 40% */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "P/C Ratio",       value: pcRatio,       color: parseFloat(pcRatio) > 1 ? "#FF5252" : "#00C896" },
              { label: "Unusual Trades",  value: unusual.length.toString(), color: "#FFB347" },
              { label: "Total Premium",   value: fmt(totalPremium),      color: "#00D4FF" },
              { label: "Call Flow",       value: fmt(calls.reduce((s, o) => s + o.premium, 0)), color: "#00C896" },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">{item.label}</span>
                <span className="text-lg font-mono font-bold mt-1 block" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Top call tickers */}
          <div className="rounded-xl p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Top Call Flow</h4>
            <div className="space-y-2">
              {topCallTickers.map(([ticker, val]) => (
                <div key={ticker} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#00C896] w-12">{ticker}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(val / Math.max(1, topCallTickers[0]?.[1] ?? 1)) * 100}%`, background: "#00C896" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#717A94]">{fmt(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top put tickers */}
          <div className="rounded-xl p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Top Put Flow</h4>
            <div className="space-y-2">
              {topPutTickers.map(([ticker, val]) => (
                <div key={ticker} className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#FF5252] w-12">{ticker}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(val / Math.max(1, topPutTickers[0]?.[1] ?? 1)) * 100}%`, background: "#FF5252" }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-[#717A94]">{fmt(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
