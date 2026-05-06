"use client";

import { useState, useEffect } from "react";
import { MacroWidget } from "@/components/research/MacroWidget";
import { YieldCurveVisualizer } from "@/components/research/YieldCurveVisualizer";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockMacroSeries } from "@/lib/api/research/macro";
import { classifyMacroRegime } from "@/lib/analysis/regimeClassifier";
import type { MacroSeries } from "@/lib/types/research";

export default function MacroDashboardPage() {
  const [series, setSeries] = useState<MacroSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeries, setExpandedSeries] = useState<MacroSeries | null>(null);

  useEffect(() => {
    setSeries(mockMacroSeries());
    setLoading(false);
  }, []);

  const regime = series.length ? classifyMacroRegime(series) : null;

  const REGIME_COLORS: Record<string, string> = {
    Goldilocks: "#39FF14", Overheating: "#FFB347", "Stagflation Risk": "#FF4545",
    "Recession Risk": "#FF4545", Recovery: "#00C896", Disinflation: "#00D4FF",
    "Deflation Risk": "#A78BFA", Unknown: "#717A94",
  };

  return (
    <div className="space-y-5 animate-data-rise">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Macro Economic Dashboard</h1>
          <p className="text-xs text-[#717A94] mt-1">FRED economic indicators — Federal Reserve Bank of St. Louis</p>
        </div>
        <DataFreshnessIndicator cacheKey="macro:all" />
      </div>

      {/* Regime banner */}
      {regime && (
        <div
          className="rounded-lg p-4 flex items-center gap-4"
          style={{
            background: `${REGIME_COLORS[regime.regime] ?? "#717A94"}10`,
            border: `1px solid ${REGIME_COLORS[regime.regime] ?? "#717A94"}30`,
          }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Current Regime</span>
              <span
                className="text-xs font-mono font-bold rounded px-2 py-0.5"
                style={{
                  color: REGIME_COLORS[regime.regime],
                  background: `${REGIME_COLORS[regime.regime]}15`,
                  border: `1px solid ${REGIME_COLORS[regime.regime]}30`,
                }}
              >
                {regime.regime}
              </span>
              <span className="text-[10px] text-[#717A94] font-mono">
                {(regime.confidence * 100).toFixed(0)}% confidence
              </span>
            </div>
            <p className="text-xs text-[#C8D0E7] mt-1">{regime.description}</p>
            <p className="text-[11px] text-[#717A94] mt-0.5">
              <span className="text-[#717A94]">Equity: </span>{regime.equityImplication}
            </p>
          </div>
        </div>
      )}

      {/* Macro widget grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-48 rounded-lg research-shimmer" />
            ))
          : series.filter(s => s.id !== "USREC").map(s => (
              <MacroWidget
                key={s.id}
                series={s}
                onExpand={setExpandedSeries}
              />
            ))
        }
      </div>

      {/* Yield curve — full width */}
      <YieldCurveVisualizer />

      {/* Expanded modal */}
      {expandedSeries && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(13,15,20,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setExpandedSeries(null)}
        >
          <div
            className="w-full max-w-3xl rounded-xl p-6 space-y-4 animate-data-rise"
            style={{ background: "#141720", border: "1px solid #1E2130" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#C8D0E7]">{expandedSeries.title}</h2>
                <p className="text-xs text-[#717A94] mt-0.5">Source: FRED · {expandedSeries.id}</p>
              </div>
              <button onClick={() => setExpandedSeries(null)} className="text-[#3A3F52] hover:text-[#C8D0E7]">✕</button>
            </div>
            <MacroWidget series={expandedSeries} />
            <div className="rounded-lg p-4" style={{ background: "#0D0F14", border: "1px solid #1E2130" }}>
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] mb-2">Market Interpretation</h4>
              <p className="text-xs text-[#C8D0E7] leading-relaxed">
                {expandedSeries.interpretation[expandedSeries.status]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
