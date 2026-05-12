"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ScreenerRow, BuffettLabel } from "@/lib/buffett/types";
import { ScreenerFilters, type FilterState } from "./ScreenerFilters";

interface ScreenerTableProps {
  rows: ScreenerRow[];
  updatedAt: string | null;
}

type SortKey = "rank" | "ticker" | "sector" | "market_cap" | "dividend_yield" | "overall";

const LABEL_COLOR: Record<BuffettLabel, string> = {
  "Highly Buffett-Worthy": "text-[#2F6B43] bg-[#2F6B43]/10",
  "Buffett-Worthy": "text-[#3A7D55] bg-[#3A7D55]/10",
  Neutral: "text-[#B8862B] bg-[#B8862B]/10",
  Avoid: "text-[#8C4A2A] bg-[#8C4A2A]/10",
  "Strongly Avoid": "text-[#8C2A2A] bg-[#8C2A2A]/10",
};

function MiniMedal({ score, label }: { score: number; label: BuffettLabel }) {
  const color =
    label === "Highly Buffett-Worthy" || label === "Buffett-Worthy"
      ? "#B08A3E"
      : label === "Neutral"
      ? "#8A8070"
      : "#8A4040";
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-[0.75rem] font-bold"
      style={{ borderColor: color, color }}
      title={label}
    >
      {score.toFixed(1)}
    </span>
  );
}

function getMarketCapBucket(cap: number | null): string {
  if (cap == null) return "";
  if (cap < 2e9) return "Small";
  if (cap < 10e9) return "Mid";
  if (cap < 200e9) return "Large";
  return "Mega";
}

function formatMarketCap(cap: number | null): string {
  if (cap == null) return "—";
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  return `$${(cap / 1e6).toFixed(0)}M`;
}

export function ScreenerTable({ rows, updatedAt }: ScreenerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<FilterState>({
    sectors: [],
    marketCapBucket: "",
    dividendFilter: "",
    minScore: 1,
  });

  const availableSectors = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.sector).filter((s): s is string => !!s))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (r.overall < filters.minScore) return false;
      if (filters.sectors.length > 0 && !filters.sectors.includes(r.sector ?? "")) return false;
      if (filters.marketCapBucket) {
        if (getMarketCapBucket(r.market_cap) !== filters.marketCapBucket) return false;
      }
      if (filters.dividendFilter === "any" && (r.dividend_yield == null || r.dividend_yield <= 0))
        return false;
      if (filters.dividendFilter === "above2" && (r.dividend_yield == null || r.dividend_yield < 0.02))
        return false;
      if (filters.dividendFilter === "above4" && (r.dividend_yield == null || r.dividend_yield < 0.04))
        return false;
      return true;
    });
  }, [rows, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av: number | string | null = null;
      let bv: number | string | null = null;
      if (sortKey === "ticker") { av = a.ticker; bv = b.ticker; }
      else if (sortKey === "sector") { av = a.sector ?? ""; bv = b.sector ?? ""; }
      else if (sortKey === "market_cap") { av = a.market_cap ?? -1; bv = b.market_cap ?? -1; }
      else if (sortKey === "dividend_yield") { av = a.dividend_yield ?? -1; bv = b.dividend_yield ?? -1; }
      else if (sortKey === "overall") { av = a.overall; bv = b.overall; }
      else { return 0; }

      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const na = av as number;
      const nb = bv as number;
      return sortDir === "asc" ? na - nb : nb - na;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "ticker" || key === "sector" ? "asc" : "desc");
    }
  }

  function SortIndicator({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="opacity-20">⇅</span>;
    return <span className="text-[#B08A3E]">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const headerCls =
    "py-3 px-4 text-left font-sans text-[0.68rem] uppercase tracking-wider text-[#1A1814]/50 dark:text-[#F7F3EC]/40 cursor-pointer select-none hover:text-[#B08A3E] transition-colors whitespace-nowrap";

  return (
    <div>
      {/* Filters */}
      <ScreenerFilters
        filters={filters}
        availableSectors={availableSectors}
        onChange={setFilters}
      />

      {/* Meta */}
      <div className="mx-auto max-w-7xl px-4 md:px-0">
        <div className="mt-4 mb-2 flex items-center justify-between">
          <p className="font-sans text-[0.78rem] text-[#1A1814]/50 dark:text-[#F7F3EC]/40">
            Showing <span className="font-semibold text-[#1A1814] dark:text-[#F7F3EC]">{sorted.length}</span> of {rows.length} stocks
          </p>
          {updatedAt && (
            <p className="font-sans text-[0.7rem] text-[#1A1814]/35 dark:text-[#F7F3EC]/25">
              Last updated: {new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-base italic text-[#1A1814]/40 dark:text-[#F7F3EC]/30">
              No stocks match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#D9D2C2]/60 dark:border-[#2A2520]">
            <table className="w-full min-w-[640px] border-collapse">
              <thead className="bg-[#F0EBE0]/80 dark:bg-[#1A1610]">
                <tr>
                  <th className={`${headerCls} w-12`} onClick={() => handleSort("rank")}>
                    # <SortIndicator col="rank" />
                  </th>
                  <th className={headerCls} onClick={() => handleSort("ticker")}>
                    Ticker <SortIndicator col="ticker" />
                  </th>
                  <th className={headerCls}>Company</th>
                  <th className={headerCls} onClick={() => handleSort("sector")}>
                    Sector <SortIndicator col="sector" />
                  </th>
                  <th className={headerCls} onClick={() => handleSort("market_cap")}>
                    Mkt Cap <SortIndicator col="market_cap" />
                  </th>
                  <th className={headerCls} onClick={() => handleSort("dividend_yield")}>
                    Div Yield <SortIndicator col="dividend_yield" />
                  </th>
                  <th className={headerCls} onClick={() => handleSort("overall")}>
                    Score <SortIndicator col="overall" />
                  </th>
                  <th className={headerCls}>Label</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D2C2]/40 dark:divide-[#2A2520]">
                {sorted.map((row, idx) => (
                  <tr
                    key={row.ticker}
                    className="group bg-[#F7F3EC] transition-colors hover:bg-[#F0EAD8] dark:bg-[#100E0C] dark:hover:bg-[#1A1610] cursor-pointer"
                    onClick={() => {
                      window.location.href = `/ticker/${row.ticker}#buffett-score`;
                    }}
                  >
                    <td className="py-3 px-4 font-mono text-[0.75rem] text-[#1A1814]/35 dark:text-[#F7F3EC]/30 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/ticker/${row.ticker}#buffett-score`}
                        className="font-mono text-[0.85rem] font-semibold text-[#1A1814] hover:text-[#B08A3E] dark:text-[#F7F3EC] dark:hover:text-[#C8A050] transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {row.ticker}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-serif text-[0.83rem] text-[#1A1814]/75 dark:text-[#F7F3EC]/65 max-w-[180px] truncate">
                      {row.company_name}
                    </td>
                    <td className="py-3 px-4 font-sans text-[0.75rem] text-[#1A1814]/55 dark:text-[#F7F3EC]/45">
                      {row.sector ?? "—"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[0.78rem] tabular-nums text-[#1A1814]/60 dark:text-[#F7F3EC]/50">
                      {formatMarketCap(row.market_cap)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[0.78rem] tabular-nums text-[#1A1814]/60 dark:text-[#F7F3EC]/50">
                      {row.dividend_yield != null && row.dividend_yield > 0
                        ? `${(row.dividend_yield * 100).toFixed(2)}%`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <MiniMedal score={row.overall} label={row.label} />
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`rounded-full px-2 py-0.5 font-sans text-[0.65rem] font-semibold uppercase tracking-wide ${LABEL_COLOR[row.label]}`}
                      >
                        {row.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
