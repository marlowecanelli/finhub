"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { colorForType, labelForType } from "@/lib/calendar/registry";
import type { CalendarEvent } from "@/lib/calendar/types";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function TodayEventsStripe() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today); from.setHours(0, 0, 0, 0);
    const to = new Date(today); to.setHours(23, 59, 59, 999);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
      importance: "medium,high,critical",
    });
    fetch(`/api/calendar/events?${params}`)
      .then((r) => r.json())
      .then((j: { data?: CalendarEvent[] }) => setEvents(j.data ?? []))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && events.length === 0) return null;

  return (
    <Link
      href="/calendar"
      className="group block overflow-hidden rounded-xl border border-border/60 bg-card/30 transition-colors hover:border-foreground/40"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex shrink-0 items-center gap-2 border-r border-border/60 pr-3">
          <CalendarDays className="h-4 w-4 text-[hsl(var(--signal))]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Today
          </span>
        </div>
        <div className="flex flex-1 gap-2 overflow-x-auto scrollbar-none">
          {!loaded &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 w-32 shrink-0 animate-pulse rounded-full bg-card/40" />
            ))}
          {events.map((e) => (
            <span
              key={e.id}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs"
              title={`${labelForType(e.event_type)} · ${e.title}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: colorForType(e.event_type), boxShadow: `0 0 5px ${colorForType(e.event_type)}` }}
              />
              {e.ticker && <span className="font-mono text-[10px] uppercase">{e.ticker}</span>}
              <span className="max-w-[180px] truncate">{e.title}</span>
              <span className="ml-1 font-mono text-[10px] tabular-nums text-muted-foreground">
                {fmtTime(e.event_date)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
