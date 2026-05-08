"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { eventMatchesFilters, useCalendarStore } from "./store";
import { colorForType, labelForType } from "@/lib/calendar/registry";
import { formatTime } from "@/lib/calendar/dates";
import type { CalendarEvent } from "@/lib/calendar/types";

export function AgendaView() {
  const events = useCalendarStore((s) => s.events);
  const visibleTypes = useCalendarStore((s) => s.visibleTypes);
  const visibleImportance = useCalendarStore((s) => s.visibleImportance);
  const search = useCalendarStore((s) => s.search);
  const select = useCalendarStore((s) => s.selectEvent);
  const reset = useCalendarStore((s) => s.resetFilters);

  const grouped = useMemo(() => {
    const filtered = events.filter((e) =>
      eventMatchesFilters(e, { visibleTypes, visibleImportance, search })
    );
    const groups = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const k = e.event_date.slice(0, 10);
      const arr = groups.get(k) ?? [];
      arr.push(e);
      groups.set(k, arr);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [events, visibleTypes, visibleImportance, search]);

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border/60 bg-card/30 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/40">
          <CalendarOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-display text-2xl">No events match your filters</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try widening the date range, removing event-type filters, or clearing the search.
          </p>
        </div>
        <Button variant="outline" onClick={reset}>Reset filters</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([day, dayEvents]) => {
        const date = new Date(day + "T12:00:00");
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <section key={day} className="space-y-3">
            <div className="sticky top-[64px] z-10 -mx-1 flex items-baseline gap-3 border-b border-border/60 bg-background/85 px-1 py-2 backdrop-blur">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {date.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              <h3 className="font-display text-2xl font-medium tracking-tight">
                {date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </h3>
              {isToday && (
                <span className="ml-1 rounded-full bg-[hsl(var(--signal)/0.18)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--signal))]">
                  Today
                </span>
              )}
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">
                {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {dayEvents.map((e, i) => (
                <motion.button
                  key={e.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015, duration: 0.25 }}
                  onClick={() => select(e.id)}
                  type="button"
                  className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-all hover:-translate-y-px hover:border-border hover:bg-card/80"
                  style={{ borderLeftColor: colorForType(e.event_type), borderLeftWidth: 2 }}
                >
                  <div className="w-16 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTime(new Date(e.event_date))}
                  </div>
                  {e.ticker && (
                    <div className="rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-foreground">
                      {e.ticker}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{e.title}</div>
                    {e.description && (
                      <div className="truncate text-xs text-muted-foreground">{e.description}</div>
                    )}
                  </div>
                  <div
                    className="hidden shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider sm:block"
                    style={{
                      backgroundColor: `${colorForType(e.event_type)}1a`,
                      color: colorForType(e.event_type),
                    }}
                  >
                    {labelForType(e.event_type)}
                  </div>
                </motion.button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
