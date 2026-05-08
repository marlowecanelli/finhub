"use client";

import { useMemo, useState } from "react";
import { eventMatchesFilters, useCalendarStore } from "./store";
import { IMPORTANCE_META } from "@/lib/calendar/registry";
import { addDays, formatYMD, parseYMD } from "@/lib/calendar/dates";

export function HeatmapView() {
  const cursor = useCalendarStore((s) => s.cursor);
  const events = useCalendarStore((s) => s.events);
  const visibleTypes = useCalendarStore((s) => s.visibleTypes);
  const visibleImportance = useCalendarStore((s) => s.visibleImportance);
  const search = useCalendarStore((s) => s.search);
  const selectDay = useCalendarStore((s) => s.selectDay);
  const [hover, setHover] = useState<string | null>(null);

  const cursorDate = useMemo(() => parseYMD(cursor), [cursor]);
  const yearStart = new Date(cursorDate.getFullYear(), 0, 1);

  // Align to Sunday before yearStart
  const gridStart = useMemo(() => {
    const d = new Date(yearStart);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [yearStart]);

  const weights = useMemo(() => {
    const map = new Map<string, number>();
    const filtered = events.filter((e) =>
      eventMatchesFilters(e, { visibleTypes, visibleImportance, search })
    );
    for (const e of filtered) {
      const k = e.event_date.slice(0, 10);
      const w = IMPORTANCE_META[e.importance].weight;
      map.set(k, (map.get(k) ?? 0) + w);
    }
    return map;
  }, [events, visibleTypes, visibleImportance, search]);

  const max = Math.max(1, ...Array.from(weights.values()));

  // 53 weeks × 7 days
  const cells: { date: Date; ymd: string; weight: number }[] = [];
  for (let i = 0; i < 53 * 7; i++) {
    const d = addDays(gridStart, i);
    if (d.getFullYear() > cursorDate.getFullYear()) continue;
    const ymd = formatYMD(d);
    cells.push({ date: d, ymd, weight: weights.get(ymd) ?? 0 });
  }

  function color(weight: number): string {
    if (weight === 0) return "rgba(148, 163, 184, 0.08)";
    const t = Math.min(1, weight / max);
    // Signal green → bright
    return `hsl(var(--signal) / ${0.15 + t * 0.7})`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
          {cursorDate.getFullYear()} year-at-a-glance
        </h2>
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          Less
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: t === 0 ? "rgba(148,163,184,0.08)" : `hsl(var(--signal) / ${0.15 + t * 0.7})` }}
            />
          ))}
          More
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/30 p-4">
        <div
          className="grid grid-flow-col gap-[3px]"
          style={{ gridTemplateRows: "repeat(7, minmax(0, 14px))" }}
        >
          {cells.map((c) => {
            const isHover = hover === c.ymd;
            return (
              <button
                key={c.ymd}
                type="button"
                onMouseEnter={() => setHover(c.ymd)}
                onMouseLeave={() => setHover(null)}
                onClick={() => selectDay(c.ymd)}
                className="h-[14px] w-[14px] rounded-sm transition-transform hover:scale-125"
                style={{
                  backgroundColor: color(c.weight),
                  outline: isHover ? "1px solid hsl(var(--foreground) / 0.4)" : undefined,
                }}
                title={`${c.date.toDateString()} — ${c.weight} importance pts`}
                aria-label={`${c.date.toDateString()}, ${c.weight} importance points`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
