"use client";

import { useState, useEffect } from "react";
import { EarningsCalendar } from "@/components/research/EarningsCalendar";
import { DataFreshnessIndicator } from "@/components/research/DataFreshnessIndicator";
import type { EarningsEvent } from "@/lib/types/research";

interface EarningsResponse {
  events: (Omit<EarningsEvent, "earningsDate"> & { earningsDate: string })[];
}

export default function EarningsPage() {
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/research/earnings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as EarningsResponse;
        if (cancelled) return;
        setEvents(json.events.map(e => ({ ...e, earningsDate: new Date(e.earningsDate) })));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const past = events.filter(e => e.earningsDate < new Date() && e.actualEPS !== undefined);
  const beats = past.filter(e => e.beatQuality !== "miss" && e.beatQuality !== "pending").length;
  const beatRate = past.length ? ((beats / past.length) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-5 animate-data-rise">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#C8D0E7] tracking-tight">Earnings Intelligence Center</h1>
          <p className="text-xs text-[#717A94] mt-1">Upcoming earnings dates, consensus EPS, and recent beats — sourced from Yahoo Finance</p>
        </div>
        <DataFreshnessIndicator cacheKey="earnings:all" />
      </div>

      {error && (
        <div className="rounded-lg p-3 text-xs text-[#FF5252]" style={{ background: "#FF525210", border: "1px solid #FF525230" }}>
          {error}
        </div>
      )}

      {past.length > 0 && (
        <div
          className="rounded-lg p-4 flex items-center gap-6 flex-wrap"
          style={{ background: "#141720", border: "1px solid #00D4FF20" }}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#717A94]">Recent Reports</div>
          <div>
            <span className="text-xl font-mono font-bold text-[#00D4FF]">{past.length}</span>
            <span className="text-xs text-[#717A94] ml-1">/ {events.length} reported</span>
          </div>
          <div>
            <span className="text-xl font-mono font-bold text-[#00C896]">{beatRate}%</span>
            <span className="text-xs text-[#717A94] ml-1">EPS beat rate</span>
          </div>
        </div>
      )}

      <EarningsCalendar events={events} loading={loading} />
    </div>
  );
}
