"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenerStock, ScreenerPreset } from "@/lib/types/research";
import { PRESET_FILTERS } from "@/lib/api/research/screener";

const PRESET_LABELS: Record<ScreenerPreset, string> = {
  "deep-value":           "Deep Value",
  "quality-compounder":  "Quality Compounder",
  "momentum-value":       "Momentum + Value",
  "dividend-aristocrats": "Dividend Aristocrats",
  "squeeze-candidates":   "Squeeze Candidates",
};

type SortKey = keyof Pick<ScreenerStock,
  "pe" | "pb" | "fcfYield" | "roe" | "revenueGrowth1y" | "dividendYield" |
  "shortInterestPct" | "momentum12m" | "marketCap" | "netMargin"
>;

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#00D4FF", Financials: "#39FF14", Energy: "#FFB347",
  Healthcare: "#FF4545", Industrials: "#A78BFA", "Consumer Discretionary": "#F472B6",
  "Consumer Staples": "#34D399", "Real Estate": "#FB923C", Utilities: "#60A5FA",
  Materials: "#FBBF24", Communication: "#C084FC",
};

function formatMktCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
}

interface ScreenerTableProps {
  stocks: ScreenerStock[];
  loading?: boolean;
}

export function ScreenerTable({ stocks, loading = false }: ScreenerTableProps) {
  const [preset, setPreset] = useState<ScreenerPreset | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("momentum12m");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = preset ? stocks.filter(PRESET_FILTERS[preset]) : stocks;
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDesc ? bv - av : av - bv;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(true); }
  }

  function SortTh({ k, label, className }: { k: SortKey; label: string; className?: string }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => handleSort(k)}
        className={cn("px-2.5 py-2.5 text-left cursor-pointer select-none whitespace-nowrap", className)}
      >
        <span className={cn("flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider", active ? "text-[#00D4FF]" : "text-[#717A94] hover:text-[#C8D0E7]")}>
          {label}
          {active ? (sortDesc ? <ArrowDown size={9} /> : <ArrowUp size={9} />) : <Minus size={9} className="opacity-20" />}
        </span>
      </th>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-32 rounded research-shimmer" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-10 rounded research-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preset tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setPreset(null)}
          className={cn(
            "px-3 py-1.5 rounded text-[11px] font-mono border transition-all",
            !preset ? "text-[#C8D0E7] bg-[#1E2130] border-[#2A2F42]" : "text-[#717A94] border-transparent hover:text-[#C8D0E7]"
          )}
        >
          All Stocks
        </button>
        {(Object.entries(PRESET_LABELS) as [ScreenerPreset, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPreset(key === preset ? null : key)}
            className={cn(
              "px-3 py-1.5 rounded text-[11px] font-mono border transition-all",
              preset === key ? "text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/30" : "text-[#717A94] border-transparent hover:text-[#C8D0E7]"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-[11px] text-[#717A94] font-mono">
        {sorted.length} results{preset ? ` · ${PRESET_LABELS[preset]}` : ""}
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-none rounded-lg" style={{ border: "1px solid #1E2130" }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: "#0D0F14", borderBottom: "1px solid #1E2130" }}>
              <th className="px-2.5 py-2.5 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94] sticky left-0" style={{ background: "#0D0F14" }}>Ticker</th>
              <SortTh k="marketCap" label="Mkt Cap" />
              <SortTh k="pe" label="P/E" />
              <SortTh k="pb" label="P/B" />
              <SortTh k="fcfYield" label="FCF Yld" />
              <SortTh k="roe" label="ROE" />
              <SortTh k="netMargin" label="Net Margin" />
              <SortTh k="revenueGrowth1y" label="Rev Grwth" />
              <SortTh k="dividendYield" label="Div Yld" />
              <SortTh k="shortInterestPct" label="SI%" />
              <SortTh k="momentum12m" label="12M Mom" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(stock => {
              const sectorColor = SECTOR_COLORS[stock.sector] ?? "#717A94";
              return (
                <tr
                  key={stock.ticker}
                  className="transition-colors hover:bg-[#141720] cursor-pointer"
                  style={{ borderBottom: "1px solid #1E213050" }}
                >
                  <td className="px-2.5 py-2.5 sticky left-0" style={{ background: "inherit" }}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[11px] font-mono font-bold"
                          style={{ color: sectorColor }}
                        >
                          {stock.ticker}
                        </span>
                        <span
                          className="text-[9px] font-mono rounded px-1 py-0.5"
                          style={{ background: `${sectorColor}12`, color: sectorColor }}
                        >
                          {stock.sector.slice(0, 4).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#717A94] truncate max-w-[110px]">{stock.companyName}</div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{formatMktCap(stock.marketCap)}</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{stock.pe.toFixed(1)}×</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{stock.pb.toFixed(1)}×</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono" style={{ color: stock.fcfYield > 5 ? "#00C896" : "#C8D0E7" }}>{stock.fcfYield.toFixed(1)}%</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono" style={{ color: stock.roe > 20 ? "#39FF14" : "#C8D0E7" }}>{stock.roe.toFixed(1)}%</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{stock.netMargin.toFixed(1)}%</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono" style={{ color: stock.revenueGrowth1y > 10 ? "#00C896" : stock.revenueGrowth1y < 0 ? "#FF5252" : "#C8D0E7" }}>
                    {stock.revenueGrowth1y > 0 ? "+" : ""}{stock.revenueGrowth1y.toFixed(1)}%
                  </td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{stock.dividendYield.toFixed(2)}%</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono" style={{ color: stock.shortInterestPct > 15 ? "#FF4545" : "#C8D0E7" }}>{stock.shortInterestPct.toFixed(1)}%</td>
                  <td className="px-2.5 py-2.5 text-[11px] font-mono" style={{ color: stock.momentum12m > 0 ? "#00C896" : "#FF5252" }}>
                    {stock.momentum12m > 0 ? "+" : ""}{stock.momentum12m.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
