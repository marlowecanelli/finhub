"use client";

import { useState, useEffect } from "react";
import { CongressTradesFeed } from "@/components/research/CongressTradesFeed";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockCongressTrades } from "@/lib/api/research/congress";
import type { CongressTrade } from "@/lib/types/research";
import { TrendingUp } from "lucide-react";

export default function CongressTradesPage() {
  const [trades, setTrades] = useState<CongressTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTrades(mockCongressTrades(40));
    setLoading(false);
  }, []);

  const buys = trades.filter(t => t.transactionType === "Buy");
  const sells = trades.filter(t => t.transactionType === "Sell");
  const withCommitteeOverlap = trades.filter(t => t.committeeOverlap);
  const avgReturn = trades.filter(t => t.postTradeReturn !== undefined)
    .reduce((s, t) => s + (t.postTradeReturn ?? 0), 0) / Math.max(1, trades.filter(t => t.postTradeReturn !== undefined).length);

  const leaderboard = Object.entries(
    trades.reduce<Record<string, { name: string; returns: number[]; party: string }>>((acc, t) => {
      if (!acc[t.name]) acc[t.name] = { name: t.name, returns: [], party: t.party };
      if (t.postTradeReturn !== undefined) acc[t.name]!.returns.push(t.postTradeReturn);
      return acc;
    }, {})
  )
    .map(([, v]) => ({
      name: v.name,
      party: v.party,
      avgReturn: v.returns.length ? v.returns.reduce((s, r) => s + r, 0) / v.returns.length : 0,
      trades: v.returns.length,
    }))
    .sort((a, b) => b.avgReturn - a.avgReturn)
    .slice(0, 8);

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Congressional Trading Tracker</h1>
          <p className="text-xs text-[#717A94] mt-1">STOCK Act disclosures · disclosure lag shown for each trade</p>
        </div>
        <DataFreshnessIndicator cacheKey="congress:trades" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Trades",      value: trades.length.toString(),            color: "#00D4FF" },
          { label: "Buys",              value: buys.length.toString(),               color: "#00C896" },
          { label: "Sells",             value: sells.length.toString(),              color: "#FF5252" },
          { label: "Avg Return vs SPY", value: `${avgReturn > 0 ? "+" : ""}${avgReturn.toFixed(1)}%`, color: avgReturn > 0 ? "#00C896" : "#FF5252" },
        ].map(item => (
          <div key={item.label} className="rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">{item.label}</span>
            <span className="text-2xl font-mono font-bold mt-1 block" style={{ color: item.color }}>{item.value}</span>
          </div>
        ))}
      </div>

      {withCommitteeOverlap.length > 0 && (
        <div
          className="rounded-lg p-3 flex items-center gap-3"
          style={{ background: "#FFB34710", border: "1px solid #FFB34730" }}
        >
          <span className="text-[#FFB347] text-sm">⚠</span>
          <span className="text-xs text-[#FFB347] font-mono">
            {withCommitteeOverlap.length} trades with committee jurisdiction overlap — highlighted below
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main feed */}
        <div className="xl:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Recent Trades</h3>
          <CongressTradesFeed trades={trades} loading={loading} />
        </div>

        {/* Leaderboard */}
        <div
          className="rounded-xl p-4 space-y-3 h-fit"
          style={{ background: "#141720", border: "1px solid #1E2130" }}
        >
          <h3 className="text-xs font-semibold text-[#C8D0E7] flex items-center gap-2">
            <TrendingUp size={13} style={{ color: "#39FF14" }} />
            Top Performing Traders
          </h3>
          <div className="space-y-2">
            {leaderboard.map((member, i) => (
              <div
                key={member.name}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: "#0D0F14", border: "1px solid #1E2130" }}
              >
                <span className="text-[11px] font-mono text-[#3A3F52] w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#C8D0E7] block truncate">{member.name}</span>
                  <span className="text-[10px] text-[#717A94]">{member.trades} trades</span>
                </div>
                <span
                  className="text-[11px] font-mono font-bold"
                  style={{ color: member.avgReturn >= 0 ? "#00C896" : "#FF5252" }}
                >
                  {member.avgReturn > 0 ? "+" : ""}{member.avgReturn.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#3A3F52] font-mono">Average post-trade return vs SPY over same period</p>
        </div>
      </div>
    </div>
  );
}
