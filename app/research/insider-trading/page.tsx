"use client";

import { useState, useEffect, useCallback } from "react";
import { InsiderFeed } from "@/components/research/InsiderFeed";
import { InsiderDetailDrawer } from "@/components/research/InsiderDetailDrawer";
import { MetricCard } from "@/components/research/MetricCard";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockInsiderTransactions } from "@/lib/api/research/insider";
import { scoreTransactionBatch } from "@/lib/analysis/insiderAnomalies";
import type { InsiderTransaction, InsiderRole, TransactionType } from "@/lib/types/research";
import { Search, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES: InsiderRole[] = ["CEO", "CFO", "COO", "Director", "10%+ Owner"];

export default function InsiderTradingPage() {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InsiderTransaction | null>(null);

  // Filters
  const [tickerSearch, setTickerSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<InsiderRole[]>([]);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [minValue, setMinValue] = useState(0);
  const [anomalyThreshold, setAnomalyThreshold] = useState<"all" | "notable" | "significant" | "high-conviction">("all");

  useEffect(() => {
    const raw = mockInsiderTransactions(60);
    const scored = scoreTransactionBatch(raw);
    setTransactions(scored);
    setLoading(false);
  }, []);

  const filtered = transactions.filter(tx => {
    if (tickerSearch && !tx.ticker.toUpperCase().includes(tickerSearch.toUpperCase()) && !tx.companyName.toLowerCase().includes(tickerSearch.toLowerCase())) return false;
    if (roleFilter.length > 0 && !roleFilter.includes(tx.insiderRole as InsiderRole)) return false;
    if (typeFilter !== "all" && tx.transactionType !== typeFilter) return false;
    if (minValue > 0 && tx.totalValue < minValue) return false;
    if (anomalyThreshold !== "all") {
      const order = ["routine", "notable", "significant", "high-conviction"];
      const txLabel = tx.anomalyScore?.label ?? "routine";
      if (order.indexOf(txLabel) < order.indexOf(anomalyThreshold)) return false;
    }
    return true;
  });

  function handleRefresh() {
    setLoading(true);
    setTimeout(() => {
      const raw = mockInsiderTransactions(60);
      setTransactions(scoreTransactionBatch(raw));
      setLoading(false);
    }, 800);
  }

  // Summary stats
  const buys = transactions.filter(t => t.transactionType === "PURCHASE");
  const sells = transactions.filter(t => t.transactionType !== "PURCHASE");
  const totalBuyValue = buys.reduce((s, t) => s + t.totalValue, 0);
  const totalSellValue = sells.reduce((s, t) => s + t.totalValue, 0);
  const buyRatio = buys.length / Math.max(1, transactions.length);
  const convictionScore = buys
    .filter(t => t.anomalyScore?.score ?? 0 > 40)
    .reduce((s, t) => s + (t.anomalyScore?.score ?? 0), 0) / Math.max(1, buys.length);

  function formatMoney(n: number): string {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${(n / 1e3).toFixed(0)}K`;
  }

  return (
    <div className="space-y-5 animate-data-rise">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Insider Trading Tracker</h1>
          <p className="text-xs text-[#717A94] mt-1">SEC Form 4 filings — C-suite and significant owner transactions</p>
        </div>
        <DataFreshnessIndicator cacheKey="insider:all:30" onRefresh={handleRefresh} />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Insider Buys (30d)"
          value={buys.length.toString()}
          delta={12.4}
          deltaLabel="vs prior 30d"
          accentColor="#00C896"
          sparklineData={buys.slice(0, 20).map((_, i) => ({ value: Math.random() * 10 + 5 }))}
          sourceLabel="SEC EDGAR"
        />
        <MetricCard
          label="Insider Sells (30d)"
          value={sells.length.toString()}
          delta={-8.2}
          deltaLabel="vs prior 30d"
          accentColor="#FF5252"
          sparklineData={sells.slice(0, 20).map((_, i) => ({ value: Math.random() * 10 + 8 }))}
          sourceLabel="SEC EDGAR"
        />
        <div
          className="rounded-lg p-4 flex flex-col gap-3"
          style={{ background: "#141720", border: "1px solid #1E2130" }}
        >
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#717A94]">Buy/Sell Ratio</span>
          <span className="text-3xl font-mono font-bold text-[#00D4FF]">{(buyRatio * 100).toFixed(0)}%</span>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${buyRatio * 100}%`, background: buyRatio > 0.5 ? "#00C896" : "#FF5252" }}
            />
          </div>
          <span className="text-[10px] text-[#3A3F52] font-mono">{buys.length} buys / {sells.length} sells</span>
        </div>
        <MetricCard
          label="Conviction Score™"
          value={convictionScore.toFixed(0)}
          description="Weighted average anomaly score across all C-suite insider purchases in the period. Higher = stronger insider signal."
          accentColor="#FFB347"
          status={convictionScore > 50 ? "ABOVE_TARGET" : "AT_TARGET"}
          sourceLabel="FinHub Proprietary"
        />
      </div>

      {/* Main layout */}
      <div className="flex gap-4">
        {/* Filters sidebar */}
        <aside
          className="w-56 flex-shrink-0 rounded-lg p-4 space-y-5"
          style={{ background: "#141720", border: "1px solid #1E2130" }}
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block mb-2">Filters</span>
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3A3F52]" />
              <input
                value={tickerSearch}
                onChange={e => setTickerSearch(e.target.value)}
                placeholder="Ticker / Company..."
                className="w-full h-7 pl-7 pr-2 rounded text-[11px] font-mono outline-none text-[#C8D0E7] placeholder-[#3A3F52]"
                style={{ background: "#0D0F14", border: "1px solid #1E2130" }}
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block mb-2">Role</span>
            <div className="space-y-1.5">
              {ROLES.map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={roleFilter.includes(role)}
                    onChange={e => {
                      if (e.target.checked) setRoleFilter(r => [...r, role]);
                      else setRoleFilter(r => r.filter(x => x !== role));
                    }}
                    className="accent-[#00D4FF]"
                  />
                  <span className="text-[11px] font-mono text-[#717A94] group-hover:text-[#C8D0E7] transition-colors">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block mb-2">Transaction</span>
            <div className="space-y-1.5">
              {(["all", "PURCHASE", "SALE"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t as TransactionType | "all")}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-[11px] font-mono transition-all",
                    typeFilter === t ? "text-[#C8D0E7] bg-[#1E2130]" : "text-[#717A94] hover:text-[#C8D0E7]"
                  )}
                >
                  {t === "all" ? "All" : t === "PURCHASE" ? "Buys" : "Sells"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block mb-2">
              Min Value: {minValue === 0 ? "Any" : `$${(minValue / 1e6).toFixed(1)}M`}
            </span>
            <input
              type="range"
              min={0}
              max={10000000}
              step={100000}
              value={minValue}
              onChange={e => setMinValue(Number(e.target.value))}
              className="w-full accent-[#00D4FF]"
            />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block mb-2">Signal Level</span>
            <div className="space-y-1.5">
              {(["all", "notable", "significant", "high-conviction"] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setAnomalyThreshold(level)}
                  className={cn(
                    "w-full text-left px-2 py-1.5 rounded text-[11px] font-mono capitalize transition-all",
                    anomalyThreshold === level ? "text-[#C8D0E7] bg-[#1E2130]" : "text-[#717A94] hover:text-[#C8D0E7]"
                  )}
                >
                  {level}+
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-[#3A3F52] font-mono border-t pt-3" style={{ borderColor: "#1E2130" }}>
            {filtered.length} of {transactions.length} shown
          </div>
        </aside>

        {/* Feed */}
        <div className="flex-1 min-w-0 rounded-lg overflow-hidden" style={{ border: "1px solid #1E2130" }}>
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{ background: "#0D0F14", borderColor: "#1E2130" }}
          >
            <span className="text-[11px] font-mono text-[#717A94]">
              {filtered.length} transactions
            </span>
            <SlidersHorizontal size={12} className="text-[#3A3F52]" />
          </div>
          <InsiderFeed
            transactions={filtered}
            loading={loading}
            onSelect={setSelected}
            selectedId={selected?.id}
          />
        </div>
      </div>

      {/* Detail drawer */}
      <InsiderDetailDrawer
        transaction={selected}
        allTransactions={transactions}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
