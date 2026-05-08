"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatMonthYear,
  isSameDay,
  isSameMonth,
  monthGrid,
  parseYMD,
  formatYMD,
} from "@/lib/calendar/dates";
import { eventMatchesFilters, useCalendarStore } from "./store";
import { EventChip } from "./event-chip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { colorForType } from "@/lib/calendar/registry";
import type { CalendarEvent } from "@/lib/calendar/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthView() {
  const cursor = useCalendarStore((s) => s.cursor);
  const events = useCalendarStore((s) => s.events);
  const visibleTypes = useCalendarStore((s) => s.visibleTypes);
  const visibleImportance = useCalendarStore((s) => s.visibleImportance);
  const search = useCalendarStore((s) => s.search);
  const shiftCursor = useCalendarStore((s) => s.shiftCursor);
  const setCursor = useCalendarStore((s) => s.setCursor);
  const selectDay = useCalendarStore((s) => s.selectDay);

  const cursorDate = useMemo(() => parseYMD(cursor), [cursor]);
  const grid = useMemo(() => monthGrid(cursorDate), [cursorDate]);

  const filtered = useMemo(
    () => events.filter((e) => eventMatchesFilters(e, { visibleTypes, visibleImportance, search })),
    [events, visibleTypes, visibleImportance, search]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const k = e.event_date.slice(0, 10);
      const arr = map.get(k) ?? [];
      arr.push(e);
      map.set(k, arr);
    }
    return map;
  }, [filtered]);

  const today = new Date();

  return (
    <div className="flex flex-col">
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftCursor(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftCursor(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(formatYMD(new Date()))}
            className="ml-1"
          >
            Today
          </Button>
        </div>
        <AnimatePresence mode="wait">
          <motion.h2
            key={cursor.slice(0, 7)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="font-display text-3xl font-medium tracking-tight md:text-4xl"
          >
            {formatMonthYear(cursorDate)}
          </motion.h2>
        </AnimatePresence>
        <div className="w-[120px]" />
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-border/60 pb-2">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={cursor.slice(0, 7)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40"
        >
          {grid.map((d) => {
            const ymd = formatYMD(d);
            const dayEvents = byDay.get(ymd) ?? [];
            const isToday = isSameDay(d, today);
            const inMonth = isSameMonth(d, cursorDate);
            const hasCritical = dayEvents.some((e) => e.importance === "critical");

            return (
              <motion.button
                key={ymd}
                type="button"
                onClick={() => selectDay(ymd)}
                whileHover={{ scale: 1.005 }}
                className={cn(
                  "group relative flex min-h-[120px] flex-col gap-1 bg-background p-2 text-left transition-colors",
                  !inMonth && "bg-card/30 text-muted-foreground/60",
                  hasCritical && "bg-gradient-to-br from-[hsl(var(--signal)/0.04)] to-transparent",
                  isToday && "ring-1 ring-inset ring-[hsl(var(--signal))]"
                )}
                aria-label={d.toDateString()}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      isToday && "signal-glow font-semibold text-[hsl(var(--signal))]"
                    )}
                  >
                    {d.getDate()}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="flex items-center gap-0.5">
                      {Array.from(new Set(dayEvents.map((e) => e.event_type)))
                        .slice(0, 4)
                        .map((t) => (
                          <span
                            key={t}
                            className="h-1 w-1 rounded-full"
                            style={{ backgroundColor: colorForType(t) }}
                            aria-hidden
                          />
                        ))}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((e) => (
                    <EventChip key={e.id} event={e} compact />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="px-1 font-mono text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
