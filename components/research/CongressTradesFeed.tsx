"use client";

import { useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CongressTrade, Party } from "@/lib/types/research";

interface CongressTradesFeedProps {
  trades: CongressTrade[];
  loading?: boolean;
}

const PARTY_CONFIG: Record<Party, { color: string; bg: string }> = {
  D: { color: "#60A5FA", bg: "#60A5FA15" },
  R: { color: "#FF5252", bg: "#FF525215" },
  I: { color: "#A78BFA", bg: "#A78BFA15" },
};

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#00D4FF", Financials: "#39FF14", Energy: "#FFB347",
  Healthcare: "#FF4545", Industrials: "#A78BFA", Defense: "#F472B6",
  "Consumer Discretionary": "#F472B6", "Consumer Staples": "#34D399",
  "Real Estate": "#FB923C", Utilities: "#60A5FA", Materials: "#FBBF24",
  Communication: "#C084FC",
};

function formatAmount(min: number, max: number): string {
  function fmt(n: number): string {
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  }
  return `${fmt(min)} – ${fmt(max)}`;
}

function relativeDate(d: Date): string {
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function CongressTradesFeed({ trades, loading = false }: CongressTradesFeedProps) {
  const [filter, setFilter] = useState<"all" | "D" | "R">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "Buy" | "Sell">("all");

  const filtered = trades.filter(t => {
    if (filter !== "all" && t.party !== filter) return false;
    if (typeFilter !== "all" && t.transactionType !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg research-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["all", "D", "R"] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-mono transition-all",
                filter === p ? "text-[#C8D0E7]" : "text-[#717A94] hover:text-[#C8D0E7]"
              )}
              style={{
                background: filter === p ? (p === "D" ? "#60A5FA20" : p === "R" ? "#FF525220" : "#1E2130") : "transparent",
                border: `1px solid ${filter === p ? (p === "D" ? "#60A5FA40" : p === "R" ? "#FF525240" : "#2A2F42") : "transparent"}`,
              }}
            >
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["all", "Buy", "Sell"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-mono transition-all",
                typeFilter === t ? "text-[#C8D0E7] bg-[#1E2130] border border-[#2A2F42]" : "text-[#717A94]"
              )}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {filtered.map(trade => {
          const party = PARTY_CONFIG[trade.party];
          const sectorColor = SECTOR_COLORS[trade.sector] ?? "#717A94";

          return (
            <div
              key={trade.id}
              className="rounded-lg p-3.5 transition-colors hover:border-[#2A2F42]"
              style={{ background: "#141720", border: "1px solid #1E2130" }}
            >
              <div className="flex items-start gap-3">
                {/* Party badge */}
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded font-mono text-sm font-bold"
                  style={{ background: party.bg, color: party.color }}
                >
                  {trade.party}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Row 1 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[#C8D0E7]">{trade.name}</span>
                    <span className="text-[10px] text-[#717A94]">{trade.chamber} · {trade.state}</span>
                    <span
                      className={cn(
                        "ml-auto text-[10px] font-bold font-mono rounded px-1.5 py-0.5",
                        trade.transactionType === "Buy" ? "text-[#00C896] bg-[#00C896]/10" : "text-[#FF5252] bg-[#FF5252]/10"
                      )}
                    >
                      {trade.transactionType.toUpperCase()}
                    </span>
                  </div>

                  {/* Row 2: Ticker + Company */}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-xs font-mono font-bold rounded px-1.5 py-0.5"
                      style={{ background: `${sectorColor}15`, color: sectorColor, border: `1px solid ${sectorColor}25` }}
                    >
                      {trade.ticker}
                    </span>
                    <span className="text-xs text-[#717A94] truncate">{trade.companyName}</span>
                  </div>

                  {/* Row 3: Amount + Lag + Return */}
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="text-xs font-mono text-[#C8D0E7]">
                      {formatAmount(trade.amountMin, trade.amountMax)}
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <Clock size={9} className="text-[#717A94]" />
                      <span className="text-[#717A94]">Disclosed</span>
                      <span
                        className="font-mono"
                        style={{ color: trade.disclosureLagDays > 30 ? "#FF4545" : "#FFB347" }}
                      >
                        {trade.disclosureLagDays}d after trade
                      </span>
                    </div>
                    {trade.postTradeReturn !== undefined && (
                      <span
                        className="text-[11px] font-mono"
                        style={{ color: trade.postTradeReturn >= 0 ? "#00C896" : "#FF5252" }}
                      >
                        {trade.postTradeReturn > 0 ? "+" : ""}{trade.postTradeReturn.toFixed(1)}% after
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Committee overlap warning */}
              {trade.committeeOverlap && (
                <div
                  className="mt-2.5 flex items-center gap-2 rounded px-2.5 py-1.5"
                  style={{ background: "#FFB34712", border: "1px solid #FFB34730" }}
                >
                  <AlertTriangle size={11} style={{ color: "#FFB347" }} />
                  <span className="text-[10px] font-mono" style={{ color: "#FFB347" }}>
                    COMMITTEE OVERLAP — {trade.committeeNames.join(", ")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
