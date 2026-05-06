"use client";

import { useState, useEffect } from "react";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockAnalystConsensus } from "@/lib/api/research/analysts";
import type { AnalystConsensus, AnalystRating } from "@/lib/types/research";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid,
} from "recharts";

const TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMZN", "TSLA", "JPM", "GS", "UNH"];

const RATING_ORDER: AnalystRating[] = ["Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
const RATING_COLORS: Record<AnalystRating, string> = {
  "Strong Buy": "#39FF14", "Buy": "#00C896", "Hold": "#717A94", "Sell": "#FF5252", "Strong Sell": "#FF4545",
};

export default function AnalystRatingsPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [search, setSearch] = useState("AAPL");
  const [data, setData] = useState<AnalystConsensus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(mockAnalystConsensus(ticker));
      setLoading(false);
    }, 200);
  }, [ticker]);

  const totalAnalysts = data ? Object.values(data.distribution).reduce((s, v) => s + v, 0) : 0;
  const upside = data ? ((data.medianTarget - data.currentPrice) / data.currentPrice * 100).toFixed(1) : "0";

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Analyst Ratings</h1>
          <p className="text-xs text-[#717A94] mt-1">Consensus ratings, price targets, and firm accuracy scores</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3A3F52]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === "Enter" && search) setTicker(search); }}
              placeholder="Ticker..."
              className="h-8 w-28 pl-7 pr-2 rounded text-[11px] font-mono outline-none text-[#C8D0E7] placeholder-[#3A3F52]"
              style={{ background: "#141720", border: "1px solid #1E2130" }}
            />
          </div>
          <div className="flex gap-1">
            {TICKERS.slice(0, 6).map(t => (
              <button
                key={t}
                onClick={() => { setTicker(t); setSearch(t); }}
                className="px-2 py-1 rounded text-[10px] font-mono transition-all"
                style={{
                  background: ticker === t ? "#00D4FF15" : "transparent",
                  color: ticker === t ? "#00D4FF" : "#717A94",
                  border: `1px solid ${ticker === t ? "#00D4FF30" : "transparent"}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <DataFreshnessIndicator cacheKey={`analysts:${ticker}`} />
        </div>
      </div>

      {loading || !data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl research-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Consensus */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <h3 className="text-xs font-semibold text-[#C8D0E7]">{ticker} — Consensus</h3>
            <div className="text-center py-3">
              <div
                className="text-3xl font-bold font-mono"
                style={{ color: RATING_COLORS[data.consensus] }}
              >
                {data.consensus}
              </div>
              <div className="text-xs text-[#717A94] mt-1">{totalAnalysts} analysts</div>
            </div>

            {/* Distribution bars */}
            <div className="space-y-2">
              {RATING_ORDER.map(rating => {
                const count = data.distribution[rating] ?? 0;
                const pct = totalAnalysts ? (count / totalAnalysts) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono w-20 flex-shrink-0" style={{ color: RATING_COLORS[rating] }}>
                      {rating}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: RATING_COLORS[rating] }} />
                    </div>
                    <span className="text-[10px] font-mono text-[#717A94] w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Price targets */}
            <div className="space-y-1.5 pt-3 border-t" style={{ borderColor: "#1E2130" }}>
              {[
                { label: "Low Target",    value: `$${data.lowTarget.toFixed(0)}`,    color: "#FF5252" },
                { label: "Median Target", value: `$${data.medianTarget.toFixed(0)}`, color: "#00D4FF" },
                { label: "High Target",   value: `$${data.highTarget.toFixed(0)}`,   color: "#39FF14" },
                { label: "Current Price", value: `$${data.currentPrice.toFixed(2)}`, color: "#C8D0E7" },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-[10px] text-[#717A94]">{item.label}</span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 border-t" style={{ borderColor: "#1E2130" }}>
                <span className="text-[10px] text-[#717A94]">Upside to Median</span>
                <span className="text-[11px] font-mono font-bold" style={{ color: parseFloat(upside) > 0 ? "#00C896" : "#FF5252" }}>
                  {parseFloat(upside) > 0 ? "+" : ""}{upside}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent changes */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <h3 className="text-xs font-semibold text-[#C8D0E7]">Recent Rating Changes</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-none">
              {data.recentChanges.map(change => {
                const isUpgrade = RATING_ORDER.indexOf(change.newRating) < RATING_ORDER.indexOf(change.previousRating);
                const isDowngrade = RATING_ORDER.indexOf(change.newRating) > RATING_ORDER.indexOf(change.previousRating);
                const color = isUpgrade ? "#00C896" : isDowngrade ? "#FF5252" : "#00D4FF";
                const Icon = isUpgrade ? TrendingUp : isDowngrade ? TrendingDown : Minus;

                return (
                  <div key={change.id} className="rounded-lg p-2.5 space-y-1" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#C8D0E7]">{change.firm}</span>
                      <Icon size={11} style={{ color }} />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span style={{ color: RATING_COLORS[change.previousRating] }}>{change.previousRating}</span>
                      <span className="text-[#3A3F52]">→</span>
                      <span style={{ color: RATING_COLORS[change.newRating] }}>{change.newRating}</span>
                      {change.newPriceTarget && (
                        <span className="ml-auto text-[#717A94]">PT ${change.newPriceTarget}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-[#3A3F52]">{change.changeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <span style={{ color: change.firmAccuracyScore > 65 ? "#39FF14" : "#717A94" }}>
                        Accuracy: {change.firmAccuracyScore}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EPS revisions trend */}
          <div className="rounded-xl p-5 space-y-3" style={{ background: "#141720", border: "1px solid #1E2130" }}>
            <h3 className="text-xs font-semibold text-[#C8D0E7]">EPS Estimate Revisions (12M)</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.epsRevisions} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: "#717A94", fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={d => d.slice(5, 7) + "/" + d.slice(2, 4)} interval={2} />
                  <YAxis tick={{ fill: "#717A94", fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v.toFixed(1)}`} />
                  <Tooltip
                    contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", borderRadius: 6, fontSize: 10 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "EPS Est."]}
                  />
                  <Line type="monotone" dataKey="estimate" stroke="#00D4FF" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-[#3A3F52] font-mono">
              {(data.epsRevisions[data.epsRevisions.length - 1]?.estimate ?? 0) > (data.epsRevisions[0]?.estimate ?? 0)
                ? "↑ Estimates trending higher — historically positive signal"
                : "↓ Estimates declining — watch for further downside revisions"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
