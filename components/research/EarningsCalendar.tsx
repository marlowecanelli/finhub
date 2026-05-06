"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EarningsEvent, BeatQuality } from "@/lib/types/research";

interface EarningsCalendarProps {
  events: EarningsEvent[];
  loading?: boolean;
}

const BEAT_CONFIG: Record<BeatQuality, { label: string; color: string; icon?: string }> = {
  "triple-beat": { label: "TRIPLE BEAT", color: "#FFB347", icon: "★" },
  "double-beat":  { label: "DOUBLE BEAT", color: "#39FF14" },
  "single-beat":  { label: "BEAT",        color: "#00C896" },
  miss:          { label: "MISS",         color: "#FF5252" },
  pending:       { label: "PENDING",      color: "#717A94" },
};

const TIMING_LABELS = { BMO: "Pre-Market", AMC: "After Close", TNS: "Time N/A" };

function formatEPS(v: number): string {
  return `$${v.toFixed(2)}`;
}

function ImpliedMoveBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#717A94]">Implied ±</span>
      <span className="text-[11px] font-mono font-bold text-[#00D4FF]">{pct.toFixed(1)}%</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1E2130" }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, pct * 5)}%`, background: "#00D4FF" }}
        />
      </div>
    </div>
  );
}

export function EarningsCalendar({ events, loading = false }: EarningsCalendarProps) {
  const [view, setView] = useState<"upcoming" | "recent">("upcoming");

  const now = new Date();
  const upcoming = events.filter(e => e.earningsDate >= now).sort((a, b) => a.earningsDate.getTime() - b.earningsDate.getTime());
  const recent = events.filter(e => e.earningsDate < now).sort((a, b) => b.earningsDate.getTime() - a.earningsDate.getTime());
  const shown = view === "upcoming" ? upcoming : recent;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg research-shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tab */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "#0D0F14" }}>
        {(["upcoming", "recent"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={cn(
              "px-3 py-1.5 rounded text-[11px] font-mono capitalize transition-all",
              view === v ? "text-[#C8D0E7] bg-[#1E2130]" : "text-[#717A94] hover:text-[#C8D0E7]"
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Events */}
      <div className="space-y-2">
        {shown.map(event => {
          const beatConf = BEAT_CONFIG[event.beatQuality];
          const isTriple = event.beatQuality === "triple-beat";
          const isPast = event.earningsDate < now;

          return (
            <div
              key={event.id}
              className="rounded-lg p-3.5 transition-all hover:border-[#2A2F42]"
              style={{
                background: "#141720",
                border: `1px solid ${isTriple ? "#FFB34730" : "#1E2130"}`,
              }}
            >
              <div className="flex items-start gap-3">
                {/* Ticker */}
                <div>
                  <div className="text-sm font-mono font-bold text-[#C8D0E7]">{event.ticker}</div>
                  <div className="text-[9px] text-[#717A94] font-mono">
                    {event.earningsDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}{TIMING_LABELS[event.timing]}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#717A94] truncate">{event.companyName}</div>

                  {/* EPS row */}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <div className="text-[10px] font-mono">
                      <span className="text-[#717A94]">Est </span>
                      <span className="text-[#C8D0E7]">{formatEPS(event.consensusEPS)}</span>
                    </div>
                    <div className="text-[10px] font-mono">
                      <span className="text-[#717A94]">Whisper </span>
                      <span className="text-[#00D4FF]">{formatEPS(event.whisperEPS)}</span>
                    </div>
                    {isPast && event.actualEPS !== undefined && (
                      <div className="text-[10px] font-mono">
                        <span className="text-[#717A94]">Actual </span>
                        <span
                          className="font-bold"
                          style={{ color: event.actualEPS >= event.consensusEPS ? "#00C896" : "#FF5252" }}
                        >
                          {formatEPS(event.actualEPS)}
                        </span>
                      </div>
                    )}
                  </div>

                  <ImpliedMoveBar pct={event.impliedMovePct} />
                </div>

                {/* Beat badge */}
                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className="flex items-center gap-1 text-[10px] font-mono font-bold rounded px-1.5 py-0.5"
                    style={{
                      color: beatConf.color,
                      background: `${beatConf.color}15`,
                      border: `1px solid ${beatConf.color}25`,
                    }}
                  >
                    {isTriple && <Star size={9} fill={beatConf.color} />}
                    {beatConf.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
