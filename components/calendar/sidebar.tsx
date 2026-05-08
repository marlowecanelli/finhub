"use client";

import { useState } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { ALL_EVENT_TYPES, EVENT_TYPE_REGISTRY, IMPORTANCE_META } from "@/lib/calendar/registry";
import { useCalendarStore } from "./store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EventImportance } from "@/lib/calendar/types";

const IMPS: EventImportance[] = ["critical", "high", "medium", "low"];

export function CalendarSidebar({ hasWatchlist }: { hasWatchlist: boolean }) {
  const visibleTypes = useCalendarStore((s) => s.visibleTypes);
  const visibleImportance = useCalendarStore((s) => s.visibleImportance);
  const watchlistOnly = useCalendarStore((s) => s.watchlistOnly);
  const toggleType = useCalendarStore((s) => s.toggleType);
  const toggleImportance = useCalendarStore((s) => s.toggleImportance);
  const setWatchlistOnly = useCalendarStore((s) => s.setWatchlistOnly);
  const setAllTypes = useCalendarStore((s) => s.setAllTypes);
  const reset = useCalendarStore((s) => s.resetFilters);

  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside className="hidden h-fit w-12 shrink-0 flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/30 p-2 lg:flex">
        <button
          onClick={() => setCollapsed(false)}
          className="rounded-md p-2 text-muted-foreground hover:bg-card hover:text-foreground"
          aria-label="Expand filters"
        >
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden h-fit w-[280px] shrink-0 flex-col gap-6 rounded-xl border border-border/60 bg-card/30 p-5 lg:flex">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Filters
        </h3>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 text-muted-foreground hover:bg-card hover:text-foreground"
          aria-label="Collapse filters"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Watchlist toggle */}
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={watchlistOnly}
            disabled={!hasWatchlist}
            onChange={(e) => setWatchlistOnly(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-[hsl(var(--signal))]"
          />
          <div className="flex-1">
            <div className="text-sm font-medium">My watchlist only</div>
            <div className="text-[11px] text-muted-foreground">
              {hasWatchlist ? "Filter to your tickers" : "Add tickers to enable"}
            </div>
          </div>
        </label>
      </div>

      {/* Event types */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Event types
          </h4>
          <button
            onClick={() => setAllTypes(visibleTypes.size !== ALL_EVENT_TYPES.length)}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {visibleTypes.size === ALL_EVENT_TYPES.length ? "None" : "All"}
          </button>
        </div>
        <div className="space-y-1">
          {ALL_EVENT_TYPES.map((t) => {
            const meta = EVENT_TYPE_REGISTRY[t];
            const checked = visibleTypes.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  checked ? "text-foreground hover:bg-card" : "text-muted-foreground/70 hover:bg-card/60"
                )}
                aria-pressed={checked}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-all",
                    checked ? "border-transparent" : "border-border"
                  )}
                  style={{ backgroundColor: checked ? meta.color : "transparent" }}
                >
                  {checked && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-background">
                      <path
                        d="M2 6.5L4.5 9L10 3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span className="flex-1 truncate">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Importance */}
      <div>
        <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Importance
        </h4>
        <div className="space-y-1">
          {IMPS.map((i) => {
            const meta = IMPORTANCE_META[i];
            const checked = visibleImportance.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleImportance(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  checked ? "text-foreground hover:bg-card" : "text-muted-foreground/70 hover:bg-card/60"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: meta.color, boxShadow: `0 0 6px ${meta.color}` }}
                />
                <span>{meta.label}</span>
                {checked && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Button variant="ghost" size="sm" onClick={reset} className="justify-start gap-2">
        <RotateCcw className="h-3.5 w-3.5" />
        Reset filters
      </Button>
    </aside>
  );
}
