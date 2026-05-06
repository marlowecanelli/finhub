"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useCallback } from "react";
import { Linkedin, ExternalLink, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnomalyBadge } from "./AnomalyBadge";
import type { InsiderTransaction, AnomalyLabel, InsiderRole } from "@/lib/types/research";
import type { AnomalyScore } from "@/lib/types/research";

function formatMoney(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatShares(n: number): string {
  return n.toLocaleString();
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

const ROLE_COLORS: Partial<Record<InsiderRole, string>> = {
  CEO:         "#00D4FF",
  CFO:         "#39FF14",
  COO:         "#FFB347",
  Director:    "#A78BFA",
  "10%+ Owner":"#F472B6",
  President:   "#00D4FF",
  CTO:         "#60A5FA",
};

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#00D4FF", Financials: "#39FF14", Energy: "#FFB347",
  Healthcare: "#FF4545", Industrials: "#A78BFA", "Consumer Discretionary": "#F472B6",
  "Consumer Staples": "#34D399", "Real Estate": "#FB923C", Utilities: "#60A5FA",
  Materials: "#FBBF24", Communication: "#C084FC",
};

function anomalyToSeverity(score: AnomalyScore | undefined): "info" | "notable" | "significant" | "critical" {
  if (!score) return "info";
  const map: Record<AnomalyLabel, "info" | "notable" | "significant" | "critical"> = {
    routine: "info", notable: "notable", significant: "significant", "high-conviction": "critical",
  };
  return map[score.label];
}

function LetterAvatar({ ticker }: { ticker: string }) {
  const color = SECTOR_COLORS[ticker] ?? "#00D4FF";
  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded text-xs font-bold font-mono"
      style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
    >
      {ticker.slice(0, 2)}
    </div>
  );
}

interface InsiderFeedProps {
  transactions: InsiderTransaction[];
  loading?: boolean;
  onSelect?: (tx: InsiderTransaction) => void;
  selectedId?: string;
}

export function InsiderFeed({ transactions, loading = false, onSelect, selectedId }: InsiderFeedProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 8,
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg research-shimmer" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="text-4xl text-[#3A3F52]">◌</span>
        <span className="text-sm text-[#717A94]">No insider transactions found for this filter</span>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto scrollbar-none"
      style={{ height: "calc(100vh - 220px)" }}
    >
      <div
        style={{ height: rowVirtualizer.getTotalSize(), position: "relative" }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const tx = transactions[virtualItem.index];
          if (!tx) return null;
          const isSelected = tx.id === selectedId;
          const isHighConviction =
            tx.transactionType === "PURCHASE" &&
            tx.totalValue > 1_000_000 &&
            (tx.insiderRole === "CEO" || tx.insiderRole === "CFO" || tx.insiderRole === "COO" || tx.insiderRole === "President");
          const sectorColor = SECTOR_COLORS[tx.sector] ?? "#717A94";
          const roleColor = ROLE_COLORS[tx.insiderRole] ?? "#717A94";

          return (
            <div
              key={tx.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className="px-3 py-1"
            >
              <button
                onClick={() => onSelect?.(tx)}
                className={cn(
                  "w-full text-left rounded-lg p-3 transition-all duration-200 group border",
                  isSelected
                    ? "border-[#00D4FF]/40 bg-[#00D4FF]/5"
                    : "border-[#1E2130] bg-[#141720] hover:border-[#2A2F42] hover:bg-[#1A1F2E]"
                )}
              >
                <div className="flex items-start gap-3">
                  <LetterAvatar ticker={tx.ticker} />

                  <div className="flex-1 min-w-0">
                    {/* Row 1: Ticker + Company + Type */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-mono font-bold rounded px-1.5 py-0.5"
                        style={{ background: `${sectorColor}15`, color: sectorColor, border: `1px solid ${sectorColor}25` }}
                      >
                        {tx.ticker}
                      </span>
                      <span className="text-xs text-[#C8D0E7] truncate">{tx.companyName}</span>
                      <span
                        className={cn(
                          "ml-auto text-[10px] font-bold font-mono uppercase tracking-wider rounded px-1.5 py-0.5",
                          tx.transactionType === "PURCHASE"
                            ? "text-[#00C896] bg-[#00C896]/10"
                            : tx.transactionType === "SALE_10B5_1"
                            ? "text-[#FFB347] bg-[#FFB347]/10"
                            : "text-[#FF5252] bg-[#FF5252]/10"
                        )}
                      >
                        {tx.transactionType === "SALE_10B5_1" ? "SALE (10b5-1)" : tx.transactionType}
                      </span>
                    </div>

                    {/* Row 2: Insider */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#C8D0E7]">{tx.insiderName}</span>
                      <span
                        className="text-[10px] font-mono rounded px-1 py-0.5"
                        style={{ background: `${roleColor}12`, color: roleColor, border: `1px solid ${roleColor}20` }}
                      >
                        {tx.insiderRole}
                      </span>
                      <Linkedin size={10} className="text-[#3A3F52]" />
                    </div>

                    {/* Row 3: Metrics */}
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#717A94]">Shares</span>
                        <span className="text-[11px] font-mono text-[#C8D0E7]">{formatShares(tx.shares)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#717A94]">@ </span>
                        <span className="text-[11px] font-mono text-[#C8D0E7]">${tx.pricePerShare.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-mono font-bold" style={{ color: tx.transactionType === "PURCHASE" ? "#00C896" : "#FF5252" }}>
                          {formatMoney(tx.totalValue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[11px] font-mono"
                          style={{ color: tx.ownershipChangePct > 0 ? "#00C896" : "#FF5252" }}
                        >
                          {tx.ownershipChangePct > 0 ? "+" : ""}{tx.ownershipChangePct.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-[#3A3F52]">holdings</span>
                      </div>
                      <span className="ml-auto text-[10px] text-[#717A94] font-mono">
                        {relativeTime(tx.filingDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anomaly / High Conviction badge */}
                {(isHighConviction || (tx.anomalyScore && tx.anomalyScore.label !== "routine")) && (
                  <div className="mt-2 flex items-center gap-2">
                    {isHighConviction && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={11} style={{ color: "#FFB347" }} />
                        <AnomalyBadge severity="critical" />
                      </div>
                    )}
                    {tx.anomalyScore && tx.anomalyScore.label !== "routine" && !isHighConviction && (
                      <AnomalyBadge severity={anomalyToSeverity(tx.anomalyScore)} />
                    )}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
