"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, TrendingUp, TrendingDown, Building2, Globe, Users, ExternalLink } from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts";

interface DeepDive {
  ticker: string;
  found: boolean;
  profile: { name: string; sector: string; industry: string; employees: number | null; website: string; description: string };
  quote: { price: number; change: number; changePct: number; open: number; high: number; low: number; volume: number; marketCap: number | null; fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number };
  valuation: Record<string, number | null>;
  analyst: { targetMean: number | null; targetHigh: number | null; targetLow: number | null; recommendation: string | null; numberOfAnalysts: number | null; upside: number | null };
  earnings: { epsTrailing: number | null; epsForward: number | null; earningsGrowth: number | null; revenueGrowth: number | null; nextEarningsDate: string | null };
  chart: { date: string; close: number }[];
  insiders: { name: string; role: string; type: string; shares: number; value: number; date: string | null }[];
}

const QUICK_TICKERS = ["AAPL", "NVDA", "MSFT", "TSLA", "META", "GOOGL", "AMZN", "JPM"];

function fmtMoney(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  return "$" + n.toFixed(2);
}
function fmtPct(n: number | null | undefined, mult = 1) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return (n * mult).toFixed(2) + "%";
}
function fmtNum(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

const RECCOLOR: Record<string, string> = {
  strong_buy: "#00C896", buy: "#39FF14", hold: "#FFB347", underperform: "#FF8C42", sell: "#FF5252",
};

function DeepDiveContent() {
  const params = useSearchParams();
  const router = useRouter();
  const ticker = (params.get("ticker") ?? "AAPL").toUpperCase();

  const [input, setInput] = useState(ticker);
  const [data, setData] = useState<DeepDive | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setInput(ticker); }, [ticker]);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/research/deep-dive?ticker=${encodeURIComponent(sym)}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(ticker); }, [ticker, load]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim().toUpperCase();
    if (!t) return;
    router.push(`/research/deep-dive?ticker=${encodeURIComponent(t)}`);
  }

  const up = (data?.quote?.changePct ?? 0) >= 0;
  const priceColor = up ? "#00C896" : "#FF5252";

  return (
    <div className="space-y-5 animate-data-rise">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Stock Deep Dive</h1>
          <p className="text-xs text-[#717A94] mt-1">Unified per-ticker research: fundamentals, valuation, analyst targets, insiders</p>
        </div>
        <form onSubmit={submit} className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717A94]" />
            <input
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
              placeholder="Search ticker..."
              className="pl-8 pr-3 py-2 text-xs font-mono rounded-md bg-[#141720] border border-[#1E2130] text-[#C8D0E7] focus:outline-none focus:border-[#00D4FF] w-44"
            />
          </div>
          <button type="submit" className="px-3 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest text-[#0D0F14]"
            style={{ background: "#00D4FF" }}>
            Load
          </button>
        </form>
      </div>

      {/* Quick tickers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Quick:</span>
        {QUICK_TICKERS.map(t => (
          <button
            key={t}
            onClick={() => router.push(`/research/deep-dive?ticker=${t}`)}
            className={`px-2 py-1 rounded-sm text-[11px] font-mono transition-colors ${
              ticker === t ? "text-[#0D0F14] bg-[#00D4FF]" : "text-[#717A94] bg-[#141720] border border-[#1E2130] hover:text-[#C8D0E7]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div className="h-96 rounded-lg research-shimmer" />}

      {!loading && data && !data.found && (
        <div className="rounded-lg p-6 text-center text-sm text-[#FFB347]" style={{ background: "#FFB34710", border: "1px solid #FFB34730" }}>
          No data found for <span className="font-mono">{ticker}</span>. Try another ticker.
        </div>
      )}

      {!loading && data?.found && (
        <>
          {/* Top: name + price + chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 rounded-lg p-5" style={{ background: "#141720", border: "1px solid #1E2130" }}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">{data.profile.sector}</div>
              <div className="font-mono text-2xl font-bold text-[#C8D0E7] mt-1">{data.ticker}</div>
              <div className="text-xs text-[#717A94] truncate">{data.profile.name}</div>

              <div className="mt-4 flex items-baseline gap-3">
                <div className="font-mono text-3xl font-bold" style={{ color: priceColor }}>
                  ${data.quote.price.toFixed(2)}
                </div>
                <div className="font-mono text-sm" style={{ color: priceColor }}>
                  {up ? "+" : ""}{data.quote.change.toFixed(2)} ({up ? "+" : ""}{data.quote.changePct.toFixed(2)}%)
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <Stat label="Market Cap" value={fmtMoney(data.quote.marketCap)} />
                <Stat label="Volume" value={fmtNum(data.quote.volume / 1e6, 2) + "M"} />
                <Stat label="Day Range" value={`${data.quote.low.toFixed(2)} – ${data.quote.high.toFixed(2)}`} />
                <Stat label="52W Range" value={`${data.quote.fiftyTwoWeekLow.toFixed(2)} – ${data.quote.fiftyTwoWeekHigh.toFixed(2)}`} />
                <Stat label="Beta" value={fmtNum(data.valuation.beta)} />
                <Stat label="Dividend" value={fmtPct(data.valuation.dividendYield, 100)} />
              </div>
            </div>

            <div className="lg:col-span-2 rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">1 Year Price · Daily Close</span>
                {data.analyst.targetMean && (
                  <span className="text-[10px] font-mono text-[#A78BFA]">
                    Analyst Target: ${data.analyst.targetMean.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={priceColor} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={priceColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#717A94", fontSize: 9 }} stroke="#1E2130" minTickGap={40} />
                    <YAxis tick={{ fill: "#717A94", fontSize: 9 }} stroke="#1E2130" domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      contentStyle={{ background: "#0D0F14", border: "1px solid #1E2130", fontSize: 11 }}
                      labelStyle={{ color: "#717A94" }}
                      itemStyle={{ color: "#C8D0E7" }}
                      formatter={(v: number) => "$" + v.toFixed(2)}
                    />
                    {data.analyst.targetMean && (
                      <ReferenceLine y={data.analyst.targetMean} stroke="#A78BFA" strokeDasharray="3 3" />
                    )}
                    <Area type="monotone" dataKey="close" stroke={priceColor} strokeWidth={1.5} fill="url(#priceGrad)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Valuation + Analyst */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Valuation & Profitability</h3>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="P/E (TTM)"      value={fmtNum(data.valuation.peRatio)} />
                <Stat label="Forward P/E"    value={fmtNum(data.valuation.forwardPE)} />
                <Stat label="PEG"            value={fmtNum(data.valuation.pegRatio)} />
                <Stat label="P/B"            value={fmtNum(data.valuation.priceToBook)} />
                <Stat label="P/S"            value={fmtNum(data.valuation.priceToSales)} />
                <Stat label="EV/EBITDA"      value={fmtNum(data.valuation.evToEbitda)} />
                <Stat label="Profit Margin"  value={fmtPct(data.valuation.profitMargin, 100)} accent={(data.valuation.profitMargin ?? 0) > 0 ? "#00C896" : undefined} />
                <Stat label="Op. Margin"     value={fmtPct(data.valuation.operatingMargin, 100)} />
                <Stat label="ROE"            value={fmtPct(data.valuation.returnOnEquity, 100)} />
                <Stat label="ROA"            value={fmtPct(data.valuation.returnOnAssets, 100)} />
                <Stat label="Debt/Equity"    value={fmtNum(data.valuation.debtToEquity)} />
                <Stat label="Current Ratio"  value={fmtNum(data.valuation.currentRatio)} />
              </div>
            </div>

            <div className="rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Wall Street Consensus</h3>
              {data.analyst.recommendation && (
                <div className="mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Recommendation</span>
                  <div className="mt-1 inline-flex items-center gap-2 rounded px-3 py-1.5 font-mono text-sm font-bold uppercase"
                    style={{
                      background: `${RECCOLOR[data.analyst.recommendation] ?? "#717A94"}15`,
                      color: RECCOLOR[data.analyst.recommendation] ?? "#C8D0E7",
                      border: `1px solid ${RECCOLOR[data.analyst.recommendation] ?? "#717A94"}30`,
                    }}>
                    {data.analyst.recommendation.replace(/_/g, " ")}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <Stat label="Target Low"  value={data.analyst.targetLow ? "$" + data.analyst.targetLow.toFixed(2) : "—"} />
                <Stat label="Target Mean" value={data.analyst.targetMean ? "$" + data.analyst.targetMean.toFixed(2) : "—"} accent="#A78BFA" />
                <Stat label="Target High" value={data.analyst.targetHigh ? "$" + data.analyst.targetHigh.toFixed(2) : "—"} />
              </div>

              {data.analyst.upside !== null && (
                <div className="rounded-md p-3" style={{
                  background: data.analyst.upside >= 0 ? "#00C89610" : "#FF525210",
                  border: `1px solid ${data.analyst.upside >= 0 ? "#00C89630" : "#FF525230"}`,
                }}>
                  <div className="flex items-center gap-2">
                    {data.analyst.upside >= 0 ? <TrendingUp size={14} color="#00C896" /> : <TrendingDown size={14} color="#FF5252" />}
                    <span className="text-xs text-[#C8D0E7]">
                      Implied upside: <span className="font-mono font-bold" style={{ color: data.analyst.upside >= 0 ? "#00C896" : "#FF5252" }}>
                        {data.analyst.upside >= 0 ? "+" : ""}{data.analyst.upside.toFixed(2)}%
                      </span>
                      <span className="text-[#717A94]"> · {data.analyst.numberOfAnalysts ?? "?"} analysts</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t" style={{ borderColor: "#1E2130" }}>
                <Stat label="EPS (TTM)"        value={fmtNum(data.earnings.epsTrailing)} />
                <Stat label="EPS (Fwd)"        value={fmtNum(data.earnings.epsForward)} />
                <Stat label="Earnings Growth"  value={fmtPct(data.earnings.earningsGrowth, 100)} accent={(data.earnings.earningsGrowth ?? 0) >= 0 ? "#00C896" : "#FF5252"} />
                <Stat label="Revenue Growth"   value={fmtPct(data.earnings.revenueGrowth, 100)} accent={(data.earnings.revenueGrowth ?? 0) >= 0 ? "#00C896" : "#FF5252"} />
              </div>

              {data.earnings.nextEarningsDate && (
                <div className="mt-3 text-[11px] text-[#717A94]">
                  Next earnings: <span className="text-[#C8D0E7] font-mono">
                    {new Date(data.earnings.nextEarningsDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Insiders + Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-lg overflow-hidden" style={{ background: "#141720", border: "1px solid #1E2130" }}>
              <div className="px-4 py-2.5 border-b" style={{ borderColor: "#1E2130" }}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Recent Insider Transactions</span>
              </div>
              {data.insiders.length === 0 ? (
                <div className="p-6 text-xs text-[#717A94]">No recent insider transactions reported.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">
                      <th className="text-left px-4 py-2">Insider</th>
                      <th className="text-left px-4 py-2">Action</th>
                      <th className="text-right px-4 py-2">Shares</th>
                      <th className="text-right px-4 py-2">Value</th>
                      <th className="text-right px-4 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.insiders.slice(0, 10).map((t, i) => {
                      const isSale = t.type.toLowerCase().includes("sale") || t.type.toLowerCase().includes("disposition");
                      const c = isSale ? "#FF5252" : "#00C896";
                      return (
                        <tr key={i} className="border-t" style={{ borderColor: "#1E2130" }}>
                          <td className="px-4 py-2">
                            <div className="text-[#C8D0E7]">{t.name}</div>
                            <div className="text-[10px] text-[#717A94]">{t.role}</div>
                          </td>
                          <td className="px-4 py-2 font-mono" style={{ color: c }}>{t.type}</td>
                          <td className="px-4 py-2 text-right font-mono text-[#C8D0E7]">{t.shares.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-mono text-[#C8D0E7]">{fmtMoney(t.value)}</td>
                          <td className="px-4 py-2 text-right font-mono text-[#717A94]">
                            {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Company Profile</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-[#C8D0E7]">
                  <Building2 size={12} className="mt-0.5 text-[#717A94]" />
                  <span>{data.profile.industry}</span>
                </div>
                {data.profile.employees && (
                  <div className="flex items-start gap-2 text-[#C8D0E7]">
                    <Users size={12} className="mt-0.5 text-[#717A94]" />
                    <span>{data.profile.employees.toLocaleString()} employees</span>
                  </div>
                )}
                {data.profile.website && (
                  <a href={data.profile.website} target="_blank" rel="noopener noreferrer"
                     className="flex items-start gap-2 text-[#00D4FF] hover:underline">
                    <Globe size={12} className="mt-0.5" />
                    <span className="truncate">{data.profile.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
              {data.profile.description && (
                <p className="mt-3 text-[11px] leading-relaxed text-[#717A94] line-clamp-[12]">
                  {data.profile.description}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">{label}</div>
      <div className="font-mono text-sm mt-0.5" style={{ color: accent ?? "#C8D0E7" }}>{value}</div>
    </div>
  );
}

export default function DeepDivePage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg research-shimmer" />}>
      <DeepDiveContent />
    </Suspense>
  );
}
