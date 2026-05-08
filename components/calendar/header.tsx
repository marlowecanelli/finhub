"use client";

import { useState } from "react";
import { CalendarDays, CalendarRange, LayoutList, Plus, Search, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCalendarStore, type CalendarView } from "./store";
import { cn } from "@/lib/utils";

const VIEWS: { value: CalendarView; label: string; Icon: typeof CalendarDays }[] = [
  { value: "month", label: "Month", Icon: CalendarDays },
  { value: "week", label: "Week", Icon: CalendarRange },
  { value: "agenda", label: "Agenda", Icon: LayoutList },
  { value: "heatmap", label: "Heatmap", Icon: Activity },
];

export function CalendarHeader({
  onAddEvent,
  onOpenSettings,
}: {
  onAddEvent: () => void;
  onOpenSettings: () => void;
}) {
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const search = useCalendarStore((s) => s.search);
  const setSearch = useCalendarStore((s) => s.setSearch);
  const [localSearch, setLocalSearch] = useState(search);

  function commitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(localSearch);
  }

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/85 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-medium tracking-tight md:text-4xl">
            Calendar
          </h1>
          <span
            className="inline-block h-2 w-2 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_10px_hsl(var(--signal))]"
            aria-label="Live"
          />
        </div>

        <form onSubmit={commitSearch} className="relative ml-auto w-full max-w-xs md:ml-4 md:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search ticker or keyword…"
            className="h-9 pl-8"
          />
        </form>

        <Button variant="signal" size="sm" onClick={onAddEvent}>
          <Plus className="h-3.5 w-3.5" />
          Add event
        </Button>
        <Button variant="outline" size="icon" onClick={onOpenSettings} aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-3 inline-flex rounded-lg border border-border/60 bg-card/40 p-0.5">
        {VIEWS.map(({ value, label, Icon }) => {
          const active = view === value;
          return (
            <button
              key={value}
              onClick={() => setView(value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
