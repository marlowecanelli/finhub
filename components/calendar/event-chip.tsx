"use client";

import { motion } from "framer-motion";
import { colorForType } from "@/lib/calendar/registry";
import type { CalendarEvent } from "@/lib/calendar/types";
import { useCalendarStore } from "./store";
import { cn } from "@/lib/utils";

type Props = {
  event: CalendarEvent;
  compact?: boolean;
  showTime?: boolean;
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function EventChip({ event, compact, showTime }: Props) {
  const select = useCalendarStore((s) => s.selectEvent);
  const color = colorForType(event.event_type);

  return (
    <motion.button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        select(event.id);
      }}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "group relative flex w-full items-center gap-1.5 overflow-hidden rounded-md border-l-2 bg-card/40 text-left transition-colors hover:bg-card/80",
        compact ? "px-1.5 py-0.5" : "px-2 py-1"
      )}
      style={{ borderLeftColor: color }}
      aria-label={`${event.event_type} event ${event.title}`}
    >
      <span
        className={cn(
          "inline-block shrink-0 rounded-full",
          compact ? "h-1 w-1" : "h-1.5 w-1.5"
        )}
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
        aria-hidden
      />
      {event.ticker && !compact && (
        <span className="font-mono text-[10px] uppercase tracking-wide text-foreground/90">
          {event.ticker}
        </span>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          compact ? "text-[10px]" : "text-[11px]"
        )}
        title={event.title}
      >
        {event.ticker && compact ? `${event.ticker} ` : ""}
        {event.title.replace(new RegExp(`^${event.ticker} — `), "")}
      </span>
      {showTime && (
        <span className="ml-auto shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
          {fmtTime(event.event_date)}
        </span>
      )}
    </motion.button>
  );
}
