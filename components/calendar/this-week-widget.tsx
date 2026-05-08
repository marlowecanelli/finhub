"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { colorForType } from "@/lib/calendar/registry";
import type { CalendarEvent, EventType } from "@/lib/calendar/types";
import { addDays, formatYMD, isSameDay } from "@/lib/calendar/dates";

export function ThisWeekWidget() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date();
    const from = new Date(today); from.setHours(0, 0, 0, 0);
    const to = addDays(from, 7);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    fetch(`/api/calendar/events?${params}`)
      .then((r) => r.json())
      .then((j: { data?: CalendarEvent[] }) => setEvents(j.data ?? []))
      .finally(() => setLoaded(true));
  }, []);

  const days = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = e.event_date.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="glass overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            The week ahead
          </p>
          <h3 className="mt-1 font-display text-2xl font-medium tracking-tight">
            Next 7 days
          </h3>
        </div>
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Full calendar <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const ymd = formatYMD(d);
          const dayEvents = byDay.get(ymd) ?? [];
          const types = Array.from(new Set(dayEvents.map((e) => e.event_type))) as EventType[];
          const isToday = isSameDay(d, new Date());
          return (
            <Link
              key={ymd}
              href={`/calendar?date=${ymd}`}
              className={
                "flex flex-col gap-1 rounded-lg border bg-background/40 p-2 transition-all hover:-translate-y-px hover:border-foreground/40 " +
                (isToday ? "border-[hsl(var(--signal))]" : "border-border/60")
              }
            >
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={
                  "font-mono text-lg tabular-nums " +
                  (isToday ? "signal-glow text-[hsl(var(--signal))]" : "text-foreground")
                }
              >
                {d.getDate()}
              </span>
              <span className="mt-auto flex flex-wrap gap-0.5">
                {types.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: colorForType(t) }}
                  />
                ))}
              </span>
              {!loaded ? (
                <span className="font-mono text-[10px] text-muted-foreground/60">…</span>
              ) : (
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {dayEvents.length || ""}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
