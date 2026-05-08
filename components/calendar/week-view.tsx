"use client";

import { Fragment, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatYMD,
  isSameDay,
  parseYMD,
  weekGrid,
} from "@/lib/calendar/dates";
import { eventMatchesFilters, useCalendarStore } from "./store";
import { EventChip } from "./event-chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent, EventTiming } from "@/lib/calendar/types";

const BANDS: { key: EventTiming; label: string }[] = [
  { key: "bmo", label: "Pre-market" },
  { key: "dmh", label: "Market hours" },
  { key: "amc", label: "After hours" },
  { key: "all_day", label: "All day" },
];

export function WeekView() {
  const cursor = useCalendarStore((s) => s.cursor);
  const events = useCalendarStore((s) => s.events);
  const visibleTypes = useCalendarStore((s) => s.visibleTypes);
  const visibleImportance = useCalendarStore((s) => s.visibleImportance);
  const search = useCalendarStore((s) => s.search);
  const setCursor = useCalendarStore((s) => s.setCursor);

  const cursorDate = useMemo(() => parseYMD(cursor), [cursor]);
  const days = useMemo(() => weekGrid(cursorDate), [cursorDate]);

  const filtered = useMemo(
    () => events.filter((e) => eventMatchesFilters(e, { visibleTypes, visibleImportance, search })),
    [events, visibleTypes, visibleImportance, search]
  );

  function shift(weeks: number) {
    const d = new Date(cursorDate);
    d.setDate(d.getDate() + weeks * 7);
    setCursor(formatYMD(d));
  }

  const today = new Date();

  function eventsFor(day: Date, band: EventTiming): CalendarEvent[] {
    return filtered.filter((e) => {
      const ed = new Date(e.event_date);
      return isSameDay(ed, day) && e.timing === band;
    });
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(formatYMD(new Date()))}>
            This week
          </Button>
        </div>
        <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
          Week of {(days[0] ?? cursorDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {(days[6] ?? cursorDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </h2>
        <div className="w-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cursor}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-[120px_repeat(7,_minmax(0,1fr))] gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40"
        >
          {/* Header row */}
          <div className="bg-background px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Session
          </div>
          {days.map((d) => {
            const isToday = isSameDay(d, today);
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "bg-background px-3 py-2 text-left",
                  isToday && "ring-1 ring-inset ring-[hsl(var(--signal))]"
                )}
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {d.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div
                  className={cn(
                    "font-mono text-lg tabular-nums",
                    isToday && "signal-glow text-[hsl(var(--signal))]"
                  )}
                >
                  {d.getDate()}
                </div>
              </div>
            );
          })}

          {/* Bands */}
          {BANDS.map((band) => (
            <Fragment key={band.key}>
              <div
                className={cn(
                  "bg-background/80 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.16em]",
                  band.key === "dmh" ? "text-foreground/90" : "text-muted-foreground"
                )}
              >
                {band.label}
              </div>
              {days.map((d) => {
                const evs = eventsFor(d, band.key);
                return (
                  <div
                    key={`${band.key}-${d.toISOString()}`}
                    className={cn(
                      "min-h-[100px] space-y-1 bg-background p-2",
                      band.key === "dmh" && "bg-card/30"
                    )}
                  >
                    {evs.map((e) => (
                      <EventChip key={e.id} event={e} showTime />
                    ))}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
