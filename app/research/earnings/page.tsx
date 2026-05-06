"use client";

import { useState, useEffect } from "react";
import { EarningsCalendar } from "@/components/research/EarningsCalendar";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import { mockEarningsEvents } from "@/lib/api/research/earnings";
import type { EarningsEvent } from "@/lib/types/research";

export default function EarningsPage() {
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEvents(mockEarningsEvents());
    setLoading(false);
  }, []);

  const past = events.filter(e => e.earningsDate < new Date());
  const tripleBeats = past.filter(e => e.beatQuality === "triple-beat").length;
  const beats = past.filter(e => e.beatQuality !== "miss" && e.beatQuality !== "pending").length;
  const beatRate = past.length ? ((beats / past.length) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Earnings Intelligence Center</h1>
          <p className="text-xs text-[#717A94] mt-1">Upcoming earnings, surprise tracker, implied moves, and PEAD analysis</p>
        </div>
        <DataFreshnessIndicator cacheKey="earnings:all" />
      </div>

      {/* Season summary */}
      {past.length > 0 && (
        <div
          className="rounded-lg p-4 flex items-center gap-6 flex-wrap"
          style={{ background: "#141720", border: "1px solid #00D4FF20" }}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Earnings Season Live</div>
          <div>
            <span className="text-xl font-mono font-bold text-[#00D4FF]">{past.length}</span>
            <span className="text-xs text-[#717A94] ml-1">/ {events.length} reported</span>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-[#00C896]">{beatRate}%</span>
            <span className="text-xs text-[#717A94] ml-1">EPS beat rate</span>
          </div>
          <div>
            <span className="text-xl font-mono font-bold" style={{ color: "#FFB347" }}>★ {tripleBeats}</span>
            <span className="text-xs text-[#717A94] ml-1">triple beats</span>
          </div>
        </div>
      )}

      <EarningsCalendar events={events} loading={loading} />
    </div>
  );
}
