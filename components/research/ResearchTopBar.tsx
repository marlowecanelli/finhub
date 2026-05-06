"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MarketStatus, QuickTicker } from "@/lib/types/research";

function getMarketStatus(): MarketStatus {
  const now = new Date();
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const weekday = et.find(p => p.type === "weekday")?.value ?? "";
  const hour = parseInt(et.find(p => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(et.find(p => p.type === "minute")?.value ?? "0", 10);
  const timeNum = hour * 100 + minute;

  if (weekday === "Sat" || weekday === "Sun") return "CLOSED";
  if (timeNum >= 930 && timeNum < 1600) return "OPEN";
  if ((timeNum >= 400 && timeNum < 930) || (timeNum >= 1600 && timeNum < 2000)) return "AFTER_HOURS";
  return "CLOSED";
}

const MOCK_TICKERS: QuickTicker[] = [
  { symbol: "SPY",  price: 524.38, delta: 3.21,  deltaPct: 0.62 },
  { symbol: "QQQ",  price: 448.15, delta: -1.84, deltaPct: -0.41 },
  { symbol: "IWM",  price: 210.72, delta: 0.94,  deltaPct: 0.45 },
  { symbol: "DXY",  price: 104.28, delta: -0.31, deltaPct: -0.30 },
  { symbol: "10Y",  price: 4.33,   delta: 0.03,  deltaPct: 0.70 },
];

const STATUS_CONFIG = {
  OPEN:        { label: "MARKET OPEN",  color: "#39FF14", pulse: true },
  AFTER_HOURS: { label: "AFTER HOURS", color: "#FFB347", pulse: false },
  CLOSED:      { label: "CLOSED",       color: "#3A3F52", pulse: false },
};

export function ResearchTopBar() {
  const [status, setStatus] = useState<MarketStatus>("CLOSED");
  const [tickers, setTickers] = useState(MOCK_TICKERS);
  const [flashMap, setFlashMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setStatus(getMarketStatus());
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
      setLastUpdated(new Date());

      setTickers(prev => prev.map(t => {
        const delta = t.delta + (Math.random() - 0.5) * 0.2;
        const deltaPct = (delta / (t.price - delta)) * 100;
        return { ...t, price: parseFloat((t.price + (Math.random() - 0.5) * 0.3).toFixed(2)), delta: parseFloat(delta.toFixed(2)), deltaPct: parseFloat(deltaPct.toFixed(2)) };
      }));

      const newFlash: Record<string, boolean> = {};
      MOCK_TICKERS.forEach(t => { newFlash[t.symbol] = Math.random() > 0.5; });
      setFlashMap(newFlash);
      setTimeout(() => setFlashMap({}), 600);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sc = STATUS_CONFIG[status];

  function formatUpdated(d: Date): string {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  }

  return (
    <header
      className="flex items-center gap-4 px-4 h-11 flex-shrink-0 border-b"
      style={{ background: "#0D0F14", borderColor: "#1E2130" }}
    >
      {/* Market status */}
      <div
        className="flex items-center gap-1.5 rounded-sm px-2 py-0.5 flex-shrink-0"
        style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}25` }}
      >
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", { "animate-pulse-dot": sc.pulse })}
          style={{ background: sc.color }}
        />
        <span className="text-[10px] font-mono font-semibold tracking-widest" style={{ color: sc.color }}>
          {sc.label}
        </span>
      </div>

      {/* Tickers */}
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none flex-1">
        {tickers.map(t => (
          <div
            key={t.symbol}
            className={cn("flex items-center gap-1.5 flex-shrink-0 transition-opacity", {
              "number-flash": flashMap[t.symbol],
            })}
          >
            <span className="text-[11px] font-mono font-semibold text-[#717A94]">{t.symbol}</span>
            <span className="text-[12px] font-mono font-semibold text-[#C8D0E7]">
              {t.symbol === "10Y" ? `${t.price.toFixed(2)}%` : t.price.toFixed(2)}
            </span>
            <span
              className="text-[10px] font-mono"
              style={{ color: t.delta >= 0 ? "#00C896" : "#FF5252" }}
            >
              {t.delta >= 0 ? "+" : ""}{t.deltaPct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-shrink-0">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3A3F52]" />
        <input
          ref={searchRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search symbol..."
          className="h-7 w-36 rounded pl-7 pr-3 text-[11px] font-mono outline-none placeholder-[#3A3F52] focus:ring-1 text-[#C8D0E7]"
          style={{ background: "#141720", border: "1px solid #1E2130", "--tw-ring-color": "#00D4FF" } as React.CSSProperties}
        />
      </div>

      {/* Last updated */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Clock size={10} className="text-[#3A3F52]" />
        <span className="text-[10px] font-mono text-[#3A3F52]">{formatUpdated(lastUpdated)}</span>
      </div>
    </header>
  );
}
