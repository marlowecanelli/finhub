"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Activity, ArrowRight, Eye, Star,
  Calendar, RefreshCw, BarChart2, Filter, CalendarDays, Search, FileText,
} from "lucide-react";

interface IndexQuote {
  symbol: string; label: string; short: string;
  price: number; change: number; changePct: number;
}
interface MoverQuote {
  symbol: string; name: string; price: number; changePct: number; volume: number;
}
interface OverviewData {
  indices: IndexQuote[];
  gainers: MoverQuote[];
  losers: MoverQuote[];
  mostActive: MoverQuote[];
  asOf: string;
  marketStatus: "OPEN" | "CLOSED" | "PRE" | "POST";
}

const SECTIONS = [
  { label: "Stock Deep Dive",    href: "/research/deep-dive",        icon: Search,      color: "#A78BFA",
    desc: "Search any ticker — analyst targets, fundamentals, insiders, all in one view." },
  { label: "Earnings Intelligence", href: "/research/earnings",      icon: Calendar,    color: "#FFB347",
    desc: "Upcoming earnings, expected moves, surprise history." },
  { label: "Analyst Ratings",       href: "/research/analyst-ratings", icon: Star,      color: "#00D4FF",
    desc: "Wall Street consensus, target price, upgrades and downgrades." },
  { label: "Insider Activity",      href: "/research/insider-trading", icon: Eye,       color: "#39FF14",
    desc: "Live SEC Form 4 filings from C-suite and 10%+ owners." },
  { label: "SEC Filings",           href: "/research/filings",         icon: FileText,  color: "#FFB347",
    desc: "Live 8-K, 10-Q, 10-K filings firehose from EDGAR." },
  { label: "Sector Rotation",       href: "/research/sector-rotation", icon: RefreshCw, color: "#00C896",
    desc: "RRG quadrants, sector heatmap, leaders and laggards." },
  { label: "Valuation Screener",    href: "/research/screener",        icon: Filter,    color: "#FF6B9D",
    desc: "Find under- or overvalued names across 8 valuation factors." },
  { label: "Macro Dashboard",       href: "/research/macro",           icon: BarChart2, color: "#FF4545",
    desc: "FRED indicators, regime classifier, yield curve." },
  { label: "Economic Calendar",     href: "/research/calendar",        icon: CalendarDays, color: "#FFB347",
    desc: "Upcoming CPI, NFP, FOMC and other macro releases." },
];

function fmtPrice(n: number, digits = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(0);
}

export default function ResearchOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/research/overview");
        const json = await res.json();
        if (!cancelled) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  const statusColor =
    data?.marketStatus === "OPEN" ? "#39FF14"
    : data?.marketStatus === "PRE" || data?.marketStatus === "POST" ? "#FFB347"
    : "#FF4545";
  const statusLabel =
    data?.marketStatus === "OPEN" ? "MARKET OPEN"
    : data?.marketStatus === "PRE" ? "PRE-MARKET"
    : data?.marketStatus === "POST" ? "AFTER HOURS"
    : "MARKET CLOSED";

  return (
    <div className="space-y-6 animate-data-rise">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#C8D0E7] tracking-tight">Research Hub</h1>
          <p className="text-xs text-[#717A94] mt-1">
            Institutional-grade market intelligence, real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest"
            style={{ background: `${statusColor}10`, border: `1px solid ${statusColor}30`, color: statusColor }}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ background: statusColor }} />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Indices ticker row */}
      <div className="rounded-lg overflow-hidden" style={{ background: "#141720", border: "1px solid #1E2130" }}>
        <div className="px-4 py-2 border-b" style={{ borderColor: "#1E2130" }}>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Global Markets · Live</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 divide-x divide-y md:divide-y-0" style={{ borderColor: "#1E2130" }}>
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-3 h-20 research-shimmer" />
              ))
            : data?.indices.map(idx => {
                const up = idx.changePct >= 0;
                const color = up ? "#00C896" : "#FF5252";
                return (
                  <div key={idx.symbol} className="p-3" style={{ borderColor: "#1E2130" }}>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">{idx.short}</div>
                    <div className="font-mono text-sm font-semibold text-[#C8D0E7] mt-1">
                      {fmtPrice(idx.price, idx.price < 100 ? 2 : 2)}
                    </div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color }}>
                      {up ? "+" : ""}{idx.changePct.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Top movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <MoverCard title="Top Gainers" icon={TrendingUp} color="#00C896" movers={data?.gainers} loading={loading} />
        <MoverCard title="Top Losers"  icon={TrendingDown} color="#FF5252" movers={data?.losers} loading={loading} />
        <MoverCard title="Most Active" icon={Activity} color="#00D4FF" movers={data?.mostActive} loading={loading} showVol />
      </div>

      {/* Section grid */}
      <div>
        <h2 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-3">Explore Research</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="group rounded-lg p-4 transition-all hover:-translate-y-0.5"
                style={{ background: "#141720", border: "1px solid #1E2130" }}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-md"
                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}
                  >
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <ArrowRight size={14} className="text-[#3A3F52] group-hover:text-[#C8D0E7] transition-colors" />
                </div>
                <div className="text-sm font-semibold text-[#C8D0E7] mt-3">{s.label}</div>
                <div className="text-[11px] text-[#717A94] mt-1 leading-relaxed">{s.desc}</div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-[#3A3F52] font-mono">
        {data?.asOf && <>As of {new Date(data.asOf).toLocaleString()} · Yahoo Finance, FRED, SEC EDGAR</>}
      </div>
    </div>
  );
}

function MoverCard({
  title, icon: Icon, color, movers, loading, showVol,
}: {
  title: string; icon: React.ElementType; color: string;
  movers: MoverQuote[] | undefined; loading: boolean; showVol?: boolean;
}) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#141720", border: "1px solid #1E2130" }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: "#1E2130" }}>
        <Icon size={13} style={{ color }} />
        <span className="text-[11px] font-semibold text-[#C8D0E7] tracking-wide">{title}</span>
      </div>
      <div className="divide-y" style={{ borderColor: "#1E2130" }}>
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 research-shimmer" />)
          : (movers ?? []).slice(0, 8).map(m => {
              const up = m.changePct >= 0;
              const pctColor = up ? "#00C896" : "#FF5252";
              return (
                <Link
                  key={m.symbol}
                  href={`/research/deep-dive?ticker=${m.symbol}`}
                  className="flex items-center justify-between px-4 py-2 hover:bg-[#1E2130] transition-colors"
                  style={{ borderColor: "#1E2130" }}
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[12px] font-semibold text-[#C8D0E7]">{m.symbol}</div>
                    <div className="text-[10px] text-[#717A94] truncate max-w-[140px]">{m.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] text-[#C8D0E7]">${fmtPrice(m.price)}</div>
                    <div className="text-[10px] font-mono" style={{ color: showVol ? "#717A94" : pctColor }}>
                      {showVol ? fmtVol(m.volume) : `${up ? "+" : ""}${m.changePct.toFixed(2)}%`}
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
