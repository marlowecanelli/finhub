"use client";

import { create } from "zustand";
import type { CalendarEvent, EventImportance, EventType } from "@/lib/calendar/types";
import { ALL_EVENT_TYPES } from "@/lib/calendar/registry";

export type CalendarView = "month" | "week" | "agenda" | "heatmap";

type State = {
  view: CalendarView;
  cursor: string; // YYYY-MM-DD anchor date
  visibleTypes: Set<EventType>;
  visibleImportance: Set<EventImportance>;
  watchlistOnly: boolean;
  search: string;
  events: CalendarEvent[];
  loading: boolean;
  selectedEventId: string | null;
  selectedDay: string | null;
};

type Actions = {
  setView: (v: CalendarView) => void;
  setCursor: (d: string) => void;
  shiftCursor: (months: number) => void;
  toggleType: (t: EventType) => void;
  setAllTypes: (on: boolean) => void;
  toggleImportance: (i: EventImportance) => void;
  setWatchlistOnly: (b: boolean) => void;
  setSearch: (s: string) => void;
  setEvents: (e: CalendarEvent[]) => void;
  setLoading: (b: boolean) => void;
  selectEvent: (id: string | null) => void;
  selectDay: (d: string | null) => void;
  resetFilters: () => void;
};

const ALL_IMP: EventImportance[] = ["low", "medium", "high", "critical"];

export const useCalendarStore = create<State & Actions>((set) => ({
  view: "month",
  cursor: new Date().toISOString().slice(0, 10),
  visibleTypes: new Set(ALL_EVENT_TYPES),
  visibleImportance: new Set(ALL_IMP),
  watchlistOnly: false,
  search: "",
  events: [],
  loading: true,
  selectedEventId: null,
  selectedDay: null,
  setView: (view) => set({ view }),
  setCursor: (cursor) => set({ cursor }),
  shiftCursor: (months) =>
    set((s) => {
      const d = new Date(s.cursor + "T12:00:00");
      d.setMonth(d.getMonth() + months);
      return { cursor: d.toISOString().slice(0, 10) };
    }),
  toggleType: (t) =>
    set((s) => {
      const next = new Set(s.visibleTypes);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return { visibleTypes: next };
    }),
  setAllTypes: (on) =>
    set({ visibleTypes: on ? new Set(ALL_EVENT_TYPES) : new Set() }),
  toggleImportance: (i) =>
    set((s) => {
      const next = new Set(s.visibleImportance);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { visibleImportance: next };
    }),
  setWatchlistOnly: (watchlistOnly) => set({ watchlistOnly }),
  setSearch: (search) => set({ search }),
  setEvents: (events) => set({ events }),
  setLoading: (loading) => set({ loading }),
  selectEvent: (selectedEventId) => set({ selectedEventId }),
  selectDay: (selectedDay) => set({ selectedDay }),
  resetFilters: () =>
    set({
      visibleTypes: new Set(ALL_EVENT_TYPES),
      visibleImportance: new Set(ALL_IMP),
      watchlistOnly: false,
      search: "",
    }),
}));

export function eventMatchesFilters(
  e: CalendarEvent,
  s: Pick<State, "visibleTypes" | "visibleImportance" | "search">
): boolean {
  if (!s.visibleTypes.has(e.event_type)) return false;
  if (!s.visibleImportance.has(e.importance)) return false;
  if (s.search) {
    const q = s.search.toLowerCase();
    const hay = `${e.title} ${e.ticker ?? ""} ${e.description ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}
