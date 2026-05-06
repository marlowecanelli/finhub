"use client";

import { useState, useEffect } from "react";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockCalendarReleases } from "@/lib/api/research/calendar";
import type { CalendarRelease, MarketImpact } from "@/lib/types/research";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const IMPACT_CONFIG: Record<MarketImpact, { color: string; label: string }> = {
  HIGH:   { color: "#FF4545", label: "HIGH" },
  MEDIUM: { color: "#FFB347", label: "MED" },
  LOW:    { color: "#717A94", label: "LOW" },
};

function Countdown({ targetDate }: { targetDate: Date }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return <span className="text-[#39FF14] font-mono text-xs">RELEASED</span>;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return (
    <span className="font-mono text-[#FFB347] text-sm font-bold tabular-nums">
      {h > 0 ? `${h}h ` : ""}{String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
    </span>
  );
}

export default function CalendarPage() {
  const [releases, setReleases] = useState<CalendarRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setReleases(mockCalendarReleases());
    setLoading(false);
  }, []);

  const now = new Date();
  const upcoming = releases.filter(r => r.releaseTime > now).sort((a, b) => a.releaseTime.getTime() - b.releaseTime.getTime());
  const past = releases.filter(r => r.releaseTime <= now).sort((a, b) => b.releaseTime.getTime() - a.releaseTime.getTime());
  const nextHighImpact = upcoming.find(r => r.impact === "HIGH");

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Economic Calendar</h1>
          <p className="text-xs text-[#717A94] mt-1">Scheduled macro releases · BLS, Fed, Census Bureau</p>
        </div>
        <DataFreshnessIndicator cacheKey="calendar:releases" />
      </div>

      {/* Next high-impact countdown */}
      {nextHighImpact && (
        <div
          className="rounded-lg p-4 flex items-center gap-5"
          style={{ background: "#FF454510", border: "1px solid #FF454530" }}
        >
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF4545] block">Next High-Impact Release</span>
            <span className="text-sm font-semibold text-[#C8D0E7] mt-0.5 block">{nextHighImpact.name}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Clock size={13} style={{ color: "#FFB347" }} />
            <Countdown targetDate={nextHighImpact.releaseTime} />
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#C8D0E7]">Upcoming Releases</h3>
        <div className="space-y-2">
          {upcoming.map(release => {
            const ic = IMPACT_CONFIG[release.impact];
            return (
              <div
                key={release.id}
                className="rounded-lg p-3.5 flex items-center gap-4"
                style={{ background: "#141720", border: "1px solid #1E2130" }}
              >
                <div className="w-28 flex-shrink-0">
                  <div className="text-xs font-mono text-[#C8D0E7]">
                    {release.releaseTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div className="text-[10px] font-mono text-[#717A94]">
                    {release.releaseTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[#C8D0E7]">{release.name}</span>
                </div>
                <div className="text-[10px] font-mono text-[#717A94] text-right">
                  <div>Prev: <span className="text-[#C8D0E7]">{release.previousValue}{release.unit}</span></div>
                  {release.consensusValue !== undefined && (
                    <div>Est: <span className="text-[#00D4FF]">{release.consensusValue}{release.unit}</span></div>
                  )}
                </div>
                <span
                  className="flex-shrink-0 text-[9px] font-mono font-bold rounded px-1.5 py-0.5"
                  style={{ background: `${ic.color}15`, color: ic.color, border: `1px solid ${ic.color}25` }}
                >
                  {ic.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Past releases */}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#C8D0E7]">Recent Releases</h3>
          <div className="space-y-2">
            {past.map(release => {
              const ic = IMPACT_CONFIG[release.impact];
              const beat = release.beat;
              return (
                <div
                  key={release.id}
                  className="rounded-lg p-3.5 flex items-center gap-4"
                  style={{
                    background: "#141720",
                    border: `1px solid ${beat === true ? "#00C89625" : beat === false ? "#FF525225" : "#1E2130"}`,
                  }}
                >
                  <div className="w-28 flex-shrink-0">
                    <div className="text-[10px] font-mono text-[#717A94]">
                      {release.releaseTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-[#C8D0E7]">{release.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-right space-y-0.5">
                    <div className="text-[#717A94]">Est: {release.consensusValue}{release.unit}</div>
                    {release.actualValue !== undefined && (
                      <div className="flex items-center justify-end gap-1" style={{ color: beat ? "#00C896" : "#FF5252" }}>
                        {beat ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        Actual: {release.actualValue}{release.unit}
                      </div>
                    )}
                  </div>
                  <span
                    className="flex-shrink-0 text-[9px] font-mono font-bold rounded px-1.5 py-0.5"
                    style={{ background: `${ic.color}15`, color: ic.color, border: `1px solid ${ic.color}25` }}
                  >
                    {ic.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
