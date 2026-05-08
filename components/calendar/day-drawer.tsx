"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useCalendarStore, eventMatchesFilters } from "./store";
import { EventChip } from "./event-chip";
import { parseYMD } from "@/lib/calendar/dates";

export function DayDrawer() {
  const day = useCalendarStore((s) => s.selectedDay);
  const select = useCalendarStore((s) => s.selectDay);
  const events = useCalendarStore((s) => s.events);
  const visibleTypes = useCalendarStore((s) => s.visibleTypes);
  const visibleImportance = useCalendarStore((s) => s.visibleImportance);
  const search = useCalendarStore((s) => s.search);

  const dayEvents = useMemo(() => {
    if (!day) return [];
    return events
      .filter((e) => e.event_date.slice(0, 10) === day)
      .filter((e) => eventMatchesFilters(e, { visibleTypes, visibleImportance, search }))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events, day, visibleTypes, visibleImportance, search]);

  return (
    <Sheet open={!!day} onOpenChange={(o) => !o && select(null)}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {day && (
          <>
            <SheetTitle className="font-display text-2xl font-medium">
              {parseYMD(day).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </SheetTitle>
            <SheetDescription>
              {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
            </SheetDescription>
            <div className="mt-6 space-y-1.5">
              {dayEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">No events match your filters on this day.</p>
              )}
              {dayEvents.map((e) => (
                <EventChip key={e.id} event={e} showTime />
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
