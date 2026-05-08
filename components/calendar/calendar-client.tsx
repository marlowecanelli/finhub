"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCalendarStore } from "./store";
import { CalendarHeader } from "./header";
import { CalendarSidebar } from "./sidebar";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { AgendaView } from "./agenda-view";
import { HeatmapView } from "./heatmap-view";
import { EventModal } from "./event-modal";
import { DayDrawer } from "./day-drawer";
import { AddEventDialog } from "./add-event-dialog";
import { SettingsDrawer } from "./settings-drawer";
import { AiBrief } from "./ai-brief";
import { EarningsCountdown } from "./earnings-countdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addDays,
  endOfMonth,
  formatYMD,
  monthGrid,
  parseYMD,
  startOfMonth,
} from "@/lib/calendar/dates";
import type { CalendarEvent } from "@/lib/calendar/types";

type Props = {
  hasWatchlist: boolean;
  authed: boolean;
};

export function CalendarClient({ hasWatchlist, authed }: Props) {
  const view = useCalendarStore((s) => s.view);
  const cursor = useCalendarStore((s) => s.cursor);
  const watchlistOnly = useCalendarStore((s) => s.watchlistOnly);
  const setEvents = useCalendarStore((s) => s.setEvents);
  const loading = useCalendarStore((s) => s.loading);
  const setLoading = useCalendarStore((s) => s.setLoading);
  const events = useCalendarStore((s) => s.events);

  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Determine fetch window from view + cursor.
  const range = useMemo(() => {
    const c = parseYMD(cursor);
    if (view === "heatmap") {
      const start = new Date(c.getFullYear(), 0, 1);
      const end = new Date(c.getFullYear(), 11, 31, 23, 59, 59);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (view === "week") {
      const grid = monthGrid(c);
      const first = grid[0] ?? c;
      const last = grid[grid.length - 1] ?? c;
      return { from: first.toISOString(), to: addDays(last, 1).toISOString() };
    }
    if (view === "agenda") {
      const start = startOfMonth(c);
      const end = addDays(endOfMonth(c), 14);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    // month
    const grid = monthGrid(c);
    const first = grid[0] ?? c;
    const last = grid[grid.length - 1] ?? c;
    return { from: first.toISOString(), to: addDays(last, 1).toISOString() };
  }, [view, cursor]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: range.from,
        to: range.to,
        ...(watchlistOnly ? { watchlistOnly: "1" } : {}),
      });
      const res = await fetch(`/api/calendar/events?${params.toString()}`);
      const json = (await res.json()) as { data?: CalendarEvent[]; error?: string };
      setEvents(json.data ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [range, watchlistOnly, setEvents, setLoading]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, reloadKey]);

  const ActiveView =
    view === "month" ? <MonthView />
    : view === "week" ? <WeekView />
    : view === "heatmap" ? <HeatmapView />
    : <AgendaView />;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8">
      <CalendarHeader
        onAddEvent={() => setAddOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {authed && <AiBrief />}

      <EarningsCountdown />

      <div className="flex gap-6">
        <CalendarSidebar hasWatchlist={hasWatchlist} />

        <main className="min-w-0 flex-1">
          {loading && events.length === 0 ? (
            <CalendarSkeleton />
          ) : (
            ActiveView
          )}
        </main>
      </div>

      <EventModal />
      <DayDrawer />
      <AddEventDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => setReloadKey((k) => k + 1)}
      />
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />

      <p className="mx-auto mt-12 max-w-3xl text-balance text-center text-[11px] leading-relaxed text-muted-foreground">
        Calendar data is aggregated from public sources and may contain inaccuracies or omissions.
        Always verify with official company filings before making investment decisions. Estimated
        event times are subject to change.
      </p>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 42 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] w-full" />
        ))}
      </div>
    </div>
  );
}
