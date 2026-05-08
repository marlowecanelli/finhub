"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sunrise, Sunset } from "lucide-react";
import { useCalendarStore } from "./store";
import type { CalendarEvent, EarningsMetadata } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

const EARNINGS_COLOR = "#a855f7";

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  past: boolean;
};

function diffParts(target: number, now: number): TimeParts {
  const ms = target - now;
  const past = ms <= 0;
  const abs = Math.abs(ms);
  const days = Math.floor(abs / 86_400_000);
  const hours = Math.floor((abs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((abs % 3_600_000) / 60_000);
  const seconds = Math.floor((abs % 60_000) / 1000);
  return { days, hours, minutes, seconds, past };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function EarningsCountdown() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const select = useCalendarStore((s) => s.selectEvent);

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 60);
    const params = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    fetch(`/api/calendar/events?${params}`)
      .then((r) => r.json())
      .then((j: { data?: CalendarEvent[] }) => {
        if (cancelled) return;
        const upcoming = (j.data ?? [])
          .filter(
            (e) =>
              e.event_type === "earnings" &&
              new Date(e.event_date).getTime() >= Date.now() - 60_000
          )
          .sort(
            (a, b) =>
              new Date(a.event_date).getTime() -
              new Date(b.event_date).getTime()
          )
          .slice(0, 12);
        setEvents(upcoming);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => events.slice(page * 4, page * 4 + 4), [events, page]);
  const totalPages = Math.max(1, Math.ceil(events.length / 4));

  if (loaded && events.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Counting down
          </p>
          <h3 className="mt-1 font-display text-xl font-medium tracking-tight md:text-2xl">
            Next earnings
          </h3>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md border border-border/60 bg-background/40 p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Previous"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-md border border-border/60 bg-background/40 p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Next"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!loaded
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="h-[180px] animate-pulse rounded-2xl border border-border/40 bg-card/30"
              />
            ))
          : visible.map((e) => (
              <CountdownCard
                key={e.id}
                event={e}
                now={now}
                onClick={() => select(e.id)}
              />
            ))}
      </div>
    </section>
  );
}

function CountdownCard({
  event,
  now,
  onClick,
}: {
  event: CalendarEvent;
  now: number;
  onClick: () => void;
}) {
  const target = new Date(event.event_date).getTime();
  const parts = diffParts(target, now);
  const meta = event.metadata as EarningsMetadata | null;
  const isImminent = !parts.past && parts.days === 0 && parts.hours < 24;
  const isToday = !parts.past && parts.days === 0;

  const tickerOrTitle = event.ticker ?? event.title.split(" ")[0] ?? "—";
  const cleanTitle = event.ticker
    ? event.title.replace(new RegExp(`^${event.ticker}\\s*[—-]\\s*`), "")
    : event.title;

  const timing =
    event.timing === "bmo"
      ? { label: "Before Open", icon: Sunrise }
      : event.timing === "amc"
      ? { label: "After Close", icon: Sunset }
      : null;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card/60 to-card/20 p-4 text-left transition-all",
        "border-border/60 hover:border-foreground/40",
        isImminent && "border-purple-400/40 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
      )}
      style={{
        boxShadow: isImminent
          ? "0 0 0 1px rgba(168,85,247,0.25), 0 8px 30px rgba(168,85,247,0.12)"
          : undefined,
      }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-50"
        style={{ backgroundColor: EARNINGS_COLOR }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: EARNINGS_COLOR,
                boxShadow: `0 0 8px ${EARNINGS_COLOR}`,
              }}
            />
            <span className="font-mono text-base font-semibold tracking-tight">
              {tickerOrTitle}
            </span>
            {isToday && (
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-purple-300">
                Today
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={cleanTitle}>
            {cleanTitle}
          </p>
        </div>
        {timing && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground"
            title={timing.label}
          >
            <timing.icon className="h-3 w-3" />
            {event.timing === "bmo" ? "BMO" : "AMC"}
          </span>
        )}
      </div>

      {/* Flip clock */}
      <div className="relative mt-4 grid grid-cols-4 gap-1.5">
        <FlipUnit label="D" value={parts.days} />
        <FlipUnit label="H" value={parts.hours} />
        <FlipUnit label="M" value={parts.minutes} />
        <FlipUnit label="S" value={parts.seconds} accent={isImminent} />
      </div>

      {/* Meta footer */}
      <div className="relative mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-mono uppercase tracking-widest">
          {meta?.kind === "earnings" && meta.epsEstimate != null ? (
            <>EPS est. <span className="text-foreground">${meta.epsEstimate.toFixed(2)}</span></>
          ) : (
            new Date(event.event_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          )}
        </span>
        <span className="inline-flex items-center gap-0.5 font-mono uppercase tracking-widest opacity-0 transition-opacity group-hover:opacity-100">
          Details <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </motion.button>
  );
}

function FlipUnit({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  const display = pad(value);
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative h-10 w-full overflow-hidden rounded-md border bg-black/40 font-mono",
          accent
            ? "border-purple-400/40 shadow-[inset_0_0_12px_rgba(168,85,247,0.2)]"
            : "border-border/60"
        )}
      >
        {/* Center divider line for flip-clock feel */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/60" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={display}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute inset-0 grid place-items-center text-lg font-semibold tabular-nums",
              accent ? "text-purple-200" : "text-foreground"
            )}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
