"use client";

import { useState, useEffect } from "react";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockInstitutionalOwnership } from "@/lib/api/research/institutional";
import type { InstitutionalOwnership } from "@/lib/types/research";
import { Search, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";

const TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL", "META"];

export default function InstitutionalPage() {
  const [ticker, setTicker] = useState("AAPL");
  const [data, setData] = useState<InstitutionalOwnership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData(mockInstitutionalOwnership(ticker));
      setLoading(false);
    }, 200);
  }, [ticker]);

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Institutional Ownership</h1>
          <p className="text-xs text-[#717A94] mt-1">SEC 13F filings — quarterly disclosure of major fund holdings</p>
        </div>
        <div className="flex items-center gap-2">
          {TICKERS.map(t => (
            <button key={t} onClick={() => setTicker(t)}
              className="px-2.5 py-1 rounded text-[11px] font-mono border transition-all"
              style={{
                background: ticker === t ? "#00D4FF10" : "transparent",
                color: ticker === t ? "#00D4FF" : "#717A94",
                borderColor: ticker === t ? "#00D4FF30" : "transparent",
              }}
            >{t}</button>
          ))}
          <DataFreshnessIndicator cacheKey={`institutional:${ticker}`} />
        </div>
      </div>

      {loading || !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg research-shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Inst. Ownership", value: `${data.totalInstOwnershipPct.toFixed(1)}%`, color: "#00D4FF", delta: data.totalInstOwnershipPct - data.prevInstOwnershipPct },
              { label: "New Positions",   value: data.newPositions.toString(), color: "#39FF14" },
              { label: "Closed Positions",value: data.closedPositions.toString(), color: "#FF5252" },
              { label: "Smart Money Score",value: `${data.smartMoneyScore.toFixed(0)}/100`, color: data.smartMoneyScore > 70 ? "#39FF14" : "#FFB347" },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-4" style={{ background: "#141720", border: "1px solid #1E2130" }}>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#717A94] block">{item.label}</span>
                <span className="text-2xl font-mono font-bold mt-1 block" style={{ color: item.color }}>{item.value}</span>
                {item.delta !== undefined && (
                  <span className="text-[11px] font-mono flex items-center gap-0.5 mt-0.5"
                    style={{ color: item.delta >= 0 ? "#00C896" : "#FF5252" }}>
                    {item.delta >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                    {Math.abs(item.delta).toFixed(1)}% QoQ
                  </span>
                )}
              </div>
            ))}
          </div>

          {data.concentrationRisk && (
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: "#FF454510", border: "1px solid #FF454530" }}>
              <AlertTriangle size={12} style={{ color: "#FF4545" }} />
              <span className="text-xs text-[#FF4545] font-mono">Concentration Risk: Top 3 holders control &gt;50% of institutional float</span>
            </div>
          )}

          {/* Top holders table */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1E2130" }}>
            <div className="px-4 py-3" style={{ background: "#0D0F14" }}>
              <span className="text-xs font-semibold text-[#C8D0E7]">Top 25 Institutional Holders</span>
            </div>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1E2130", background: "#0D0F14" }}>
                    {["Fund", "Shares Held", "% Portfolio", "QoQ Change"].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-wider text-[#717A94]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.top25Holders.map((holder, i) => (
                    <tr key={i} className="hover:bg-[#141720] transition-colors" style={{ borderBottom: "1px solid #1E213050" }}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#C8D0E7]">{holder.fund}</span>
                          {holder.isNew && <span className="text-[9px] font-mono text-[#39FF14] bg-[#39FF1415] rounded px-1">NEW</span>}
                          {holder.isClosed && <span className="text-[9px] font-mono text-[#FF5252] bg-[#FF525215] rounded px-1">SOLD</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{(holder.sharesHeld / 1e6).toFixed(1)}M</td>
                      <td className="px-3 py-2.5 text-[11px] font-mono text-[#C8D0E7]">{holder.portfolioPct.toFixed(2)}%</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-0.5 text-[11px] font-mono"
                          style={{ color: holder.quarterChangePct >= 0 ? "#00C896" : "#FF5252" }}>
                          {holder.quarterChangePct >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                          {Math.abs(holder.quarterChangePct).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
