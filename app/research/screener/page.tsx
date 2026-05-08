"use client";

import { useState, useEffect } from "react";
import { ScreenerTable } from "@/components/research/ScreenerTable";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import type { ScreenerStock } from "@/lib/types/research";

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/research/screener");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as { stocks: ScreenerStock[] };
        if (!cancelled) setStocks(json.stocks);
      } catch {
        if (!cancelled) setStocks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Valuation Screener</h1>
          <p className="text-xs text-[#717A94] mt-1">Multi-factor stock screener with pre-built institutional strategies</p>
        </div>
        <DataFreshnessIndicator cacheKey="screener:universe" />
      </div>
      <ScreenerTable stocks={stocks} loading={loading} />
    </div>
  );
}
