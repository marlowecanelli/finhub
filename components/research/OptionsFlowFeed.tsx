"use client";

import { useState, useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockOptionsOrders } from "@/lib/api/research/optionsFlow";
import type { OptionsOrder, FlowSentiment } from "@/lib/types/research";

const SENTIMENT_CONFIG: Record<FlowSentiment, { label: string; color: string }> = {
  BULLISH_SWEEP: { label: "BULLISH SWEEP", color: "#00C896" },
  BEARISH_SWEEP: { label: "BEARISH SWEEP", color: "#FF5252" },
  NEUTRAL_SPREAD: { label: "NEUTRAL SPREAD", color: "#717A94" },
};

function formatMoney(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function formatExpiry(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function relativeTime(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

interface OptionsFlowFeedProps {
  initialOrders?: OptionsOrder[];
  live?: boolean;
}

export function OptionsFlowFeed({ initialOrders, live = true }: OptionsFlowFeedProps) {
  const [orders, setOrders] = useState<OptionsOrder[]>(initialOrders ?? mockOptionsOrders(30));
  const [typeFilter, setTypeFilter] = useState<"all" | "CALL" | "PUT">("all");
  const [sweepOnly, setSweepOnly] = useState(false);
  const [minPremium, setMinPremium] = useState(0);
  const liveRef = useRef(live);
  liveRef.current = live;

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const newOrders = mockOptionsOrders(1);
      setOrders(prev => (newOrders[0] ? [newOrders[0], ...prev] : prev).slice(0, 60));
    }, 3000);
    return () => clearInterval(id);
  }, [live]);

  const filtered = orders.filter(o => {
    if (typeFilter !== "all" && o.optionType !== typeFilter) return false;
    if (sweepOnly && o.sentiment === "NEUTRAL_SPREAD") return false;
    if (minPremium > 0 && o.premium < minPremium * 1000) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(["all", "CALL", "PUT"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 rounded text-[11px] font-mono transition-all border",
                typeFilter === t
                  ? t === "CALL" ? "text-[#00C896] bg-[#00C896]/10 border-[#00C896]/30"
                    : t === "PUT" ? "text-[#FF5252] bg-[#FF5252]/10 border-[#FF5252]/30"
                    : "text-[#C8D0E7] bg-[#1E2130] border-[#2A2F42]"
                  : "text-[#717A94] border-transparent hover:text-[#C8D0E7]"
              )}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSweepOnly(s => !s)}
          className={cn(
            "px-2.5 py-1 rounded text-[11px] font-mono border transition-all",
            sweepOnly ? "text-[#FFB347] bg-[#FFB347]/10 border-[#FFB347]/30" : "text-[#717A94] border-transparent"
          )}
        >
          Sweeps Only
        </button>
        {live && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "#39FF14" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#39FF14] animate-pulse-dot" />
            LIVE
          </span>
        )}
      </div>

      {/* Feed */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto scrollbar-none">
        {filtered.slice(0, 40).map((order, i) => {
          const sentConf = SENTIMENT_CONFIG[order.sentiment];
          const isLarge = order.premium >= 1_000_000;
          const isNewPos = order.volume > order.openInterest;

          return (
            <div
              key={order.id}
              className={cn(
                "rounded-lg px-3 py-2.5 flex items-center gap-3 transition-all",
                i === 0 && live ? "animate-data-rise" : ""
              )}
              style={{ background: "#141720", border: `1px solid ${isLarge ? "#FFB34730" : "#1E2130"}` }}
            >
              {/* Type badge */}
              <span
                className="flex-shrink-0 w-10 text-center text-[11px] font-mono font-bold rounded px-1 py-0.5"
                style={{
                  color: order.optionType === "CALL" ? "#00C896" : "#FF5252",
                  background: order.optionType === "CALL" ? "#00C89615" : "#FF525215",
                }}
              >
                {order.optionType}
              </span>

              {/* Ticker */}
              <span className="text-xs font-mono font-bold text-[#C8D0E7] w-12 flex-shrink-0">
                {order.ticker}
              </span>

              {/* Strike + Expiry */}
              <span className="text-[11px] font-mono text-[#717A94] flex-shrink-0">
                ${order.strike} {formatExpiry(order.expiry)}
              </span>

              {/* Premium */}
              <span className="text-[12px] font-mono font-bold flex-shrink-0" style={{ color: sentConf.color }}>
                {formatMoney(order.premium)}
              </span>

              {/* Sentiment */}
              <span
                className="text-[9px] font-mono uppercase tracking-wider hidden sm:block"
                style={{ color: sentConf.color }}
              >
                {sentConf.label}
              </span>

              {/* Volume vs OI */}
              {isNewPos && (
                <span
                  className="text-[9px] font-mono uppercase tracking-wider hidden lg:block"
                  style={{ color: "#00D4FF" }}
                >
                  NEW POS
                </span>
              )}

              {/* Flame for large */}
              {isLarge && <Flame size={12} className="flex-shrink-0" style={{ color: "#FFB347" }} />}

              {/* Time */}
              <span className="ml-auto text-[10px] font-mono text-[#3A3F52] flex-shrink-0">
                {relativeTime(order.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
