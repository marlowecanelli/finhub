"use client";

import { useState, useEffect } from "react";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockDarkPoolPrints } from "@/lib/api/research/darkPool";
import type { DarkPoolPrint } from "@/lib/types/research";
import { Info, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

function fmt(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
}

export default function DarkPoolPage() {
  const [prints, setPrints] = useState<DarkPoolPrint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExplainer, setShowExplainer] = useState(true);

  useEffect(() => {
    setPrints(mockDarkPoolPrints(30));
    setLoading(false);
  }, []);

  const avgDPPct = prints.length ? prints.reduce((s, p) => s + p.darkPoolPct, 0) / prints.length : 0;
  const accumSignals = prints.filter(p => p.accumulationSignal).length;

  const chartData = Array.from({ length: 14 }, (_, i) => ({
    day: `D-${13 - i}`,
    darkPool: Math.floor(Math.random() * 800 + 200) * 1e6,
    exchange: Math.floor(Math.random() * 2000 + 800) * 1e6,
  }));

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Dark Pool Activity</h1>
          <p className="text-xs text-[#717A94] mt-1">FINRA OTC/ATS transparency data · off-exchange institutional block trades</p>
        </div>
        <DataFreshnessIndicator cacheKey="darkpool:all" />
      </div>

      {/* Explainer */}
      {showExplainer && (
        <div className="rounded-lg p-3.5 flex items-start gap-3" style={{ background: "#141720", border: "1px solid #00D4FF20" }}>
          <Info size={13} style={{ color: "#00D4FF", flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-xs text-[#C8D0E7]">
              <strong className="text-[#00D4FF]">Dark pools</strong> are private trading venues where large institutional orders are executed away from public exchanges to minimize price impact.
              When dark pool volume as a percentage of total volume is sustained above 30% for 5+ consecutive days, it may indicate institutional accumulation.
            </p>
          </div>
          <button onClick={() => setShowExplainer(false)} className="text-[#3A3F52] hover:text-[#717A94] text-xs flex-shrink-0">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Avg DP% Volume", value: `${avgDPPct.toFixed(1)}%`, color: "#00D4FF" },
          { label: "Prints Today", value: prints.length.toString(), color: "#C8D0E7" },
          { label: "Accum. Signals", value: accumSignals.toString(), color: "#39FF14" },
          { label: "Large Prints (>$10M)", value: prints.filter(p => p.totalValue > 10e6).length.toString(), color: "#FFB347" },
        ].map(item => (
          <div key={item.label} className="rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">{item.label}</span>
            <span className="text-2xl font-mono font-bold mt-1 block" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Volume chart */}
      <div className="rounded-xl p-5" style={{ background: "#141720", border: "1px solid #1E2130" }}>
        <h3 className="text-xs font-semibold text-[#C8D0E7] mb-4">Dark Pool vs Exchange Volume (14d)</h3>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="exGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#717A94" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#717A94" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#717A94", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", borderRadius: 6, fontSize: 10 }}
                formatter={(v: number, name: string) => [fmt(v), name === "darkPool" ? "Dark Pool" : "Exchange"]}
              />
              <Area type="monotone" dataKey="exchange" stroke="#3A3F52" strokeWidth={1} fill="url(#exGrad)" dot={false} name="exchange" />
              <Area type="monotone" dataKey="darkPool" stroke="#00D4FF" strokeWidth={1.5} fill="url(#dpGrad)" dot={false} name="darkPool" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prints feed */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1E2130" }}>
        <div className="px-4 py-3" style={{ background: "#0D0F14" }}>
          <span className="text-xs font-semibold text-[#C8D0E7]">Block Trade Prints</span>
        </div>
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1E2130", background: "#0D0F14" }}>
                {["Ticker", "Shares", "Price", "Value", "DP %", "vs Midpoint", "Signal", "Time"].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prints.map(print => (
                <tr key={print.id} className="hover:bg-[#141720] transition-colors" style={{ borderBottom: "1px solid #1E213050" }}>
                  <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-[#00D4FF]">{print.ticker}</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{(print.shares / 1e3).toFixed(0)}K</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono text-[#C8D0E7]">${print.price.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono font-bold text-[#C8D0E7]">{fmt(print.totalValue)}</td>
                  <td className="px-3 py-2.5 text-[11px] font-mono" style={{ color: print.darkPoolPct > 30 ? "#FFB347" : "#717A94" }}>
                    {print.darkPoolPct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-mono" style={{ color: print.aboveMidpoint ? "#00C896" : "#FF5252" }}>
                    {print.aboveMidpoint ? "Above" : "Below"}
                  </td>
                  <td className="px-3 py-2.5">
                    {print.accumulationSignal && (
                      <span className="text-[9px] font-mono text-[#39FF14] bg-[#39FF1415] rounded px-1.5 py-0.5">ACCUM</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[10px] font-mono text-[#3A3F52]">
                    {print.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
