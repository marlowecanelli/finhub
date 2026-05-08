"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MIN_DATE = new Date("1990-01-01");

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function dateToISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addYears(d: Date, n: number): Date {
  const c = new Date(d);
  c.setFullYear(c.getFullYear() + n);
  return c;
}

function fmtPretty(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type Props = {
  date: string;
  onChange: (iso: string) => void;
};

export function TimelineScrubber({ date, onChange }: Props) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const totalDays = useMemo(() => daysBetween(MIN_DATE, today), [today]);

  const railRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  const selectedDate = useMemo(() => isoToDate(date), [date]);
  const pct = useMemo(() => {
    const d = clamp(daysBetween(MIN_DATE, selectedDate), 0, totalDays);
    return (d / totalDays) * 100;
  }, [selectedDate, totalDays]);

  function pctToISO(p: number): string {
    const days = Math.round((clamp(p, 0, 100) / 100) * totalDays);
    const d = new Date(MIN_DATE);
    d.setDate(d.getDate() + days);
    return dateToISO(d);
  }

  function eventToPct(clientX: number): number {
    const rail = railRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
  }

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent | TouchEvent) {
      const x =
        "touches" in e
          ? e.touches[0]?.clientX ?? 0
          : (e as MouseEvent).clientX;
      onChange(pctToISO(eventToPct(x)));
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  // Year tick marks
  const yearTicks = useMemo(() => {
    const startYear = MIN_DATE.getUTCFullYear();
    const endYear = today.getFullYear();
    const ticks: { year: number; pct: number; major: boolean }[] = [];
    for (let y = startYear; y <= endYear; y++) {
      const d = new Date(`${y}-01-01T00:00:00Z`);
      const p = (daysBetween(MIN_DATE, d) / totalDays) * 100;
      const major = y % 5 === 0;
      ticks.push({ year: y, pct: p, major });
    }
    return ticks;
  }, [today, totalDays]);

  const presets: { label: string; years: number | "max" }[] = [
    { label: "5Y", years: 5 },
    { label: "10Y", years: 10 },
    { label: "20Y", years: 20 },
    { label: "30Y", years: 30 },
    { label: "MAX", years: "max" },
  ];

  function applyPreset(years: number | "max") {
    if (years === "max") {
      onChange(dateToISO(MIN_DATE));
    } else {
      onChange(dateToISO(addYears(today, -years)));
    }
  }

  const yearsBack = useMemo(() => {
    const ms = today.getTime() - selectedDate.getTime();
    return ms / (1000 * 60 * 60 * 24 * 365.25);
  }, [today, selectedDate]);

  const hoverDate = hoverPct != null ? isoToDate(pctToISO(hoverPct)) : null;

  return (
    <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-hindsight-gain/80">
            Drag to time-travel
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <AnimatePresence mode="wait">
              <motion.span
                key={date}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="font-display text-2xl text-white sm:text-3xl"
                style={{
                  fontVariationSettings: "'opsz' 144, 'soft' 100",
                  letterSpacing: "-0.02em",
                }}
              >
                {fmtPretty(selectedDate)}
              </motion.span>
            </AnimatePresence>
            <span className="font-mono text-xs text-white/40">
              {yearsBack >= 1
                ? `${yearsBack.toFixed(1)} years ago`
                : `${Math.round(yearsBack * 12)} months ago`}
            </span>
          </div>
        </div>

        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.years)}
              className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 transition-all hover:border-hindsight-gain/40 hover:text-hindsight-gain"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rail */}
      <div className="relative pt-6 pb-8">
        <div
          ref={railRef}
          className="relative h-2 cursor-pointer touch-none select-none rounded-full bg-white/5"
          onMouseDown={(e) => {
            setDragging(true);
            onChange(pctToISO(eventToPct(e.clientX)));
          }}
          onTouchStart={(e) => {
            setDragging(true);
            const x = e.touches[0]?.clientX ?? 0;
            onChange(pctToISO(eventToPct(x)));
          }}
          onMouseMove={(e) => setHoverPct(eventToPct(e.clientX))}
          onMouseLeave={() => setHoverPct(null)}
        >
          {/* Filled portion */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-hindsight-gain/40 via-hindsight-gain/60 to-hindsight-gain"
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          />

          {/* Year ticks */}
          {yearTicks.map((t) => (
            <div
              key={t.year}
              className={
                "absolute top-1/2 -translate-y-1/2 -translate-x-1/2 " +
                (t.major
                  ? "h-3 w-px bg-white/30"
                  : "h-1.5 w-px bg-white/10")
              }
              style={{ left: `${t.pct}%` }}
            />
          ))}

          {/* Year labels (major years only) */}
          {yearTicks
            .filter((t) => t.major)
            .map((t) => (
              <div
                key={`lbl-${t.year}`}
                className="absolute top-full mt-2 -translate-x-1/2 font-mono text-[10px] tabular-nums text-white/30"
                style={{ left: `${t.pct}%` }}
              >
                {t.year}
              </div>
            ))}

          {/* Hover tooltip */}
          {hoverPct != null && hoverDate && !dragging && (
            <div
              className="pointer-events-none absolute -top-9 -translate-x-1/2 rounded-md border border-white/10 bg-black/80 px-2 py-1 font-mono text-[10px] tabular-nums text-white/80 shadow-lg backdrop-blur"
              style={{ left: `${hoverPct}%` }}
            >
              {hoverDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          )}

          {/* Handle */}
          <motion.div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ left: `${pct}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div
              className={
                "relative grid h-6 w-6 place-items-center rounded-full border-2 border-hindsight-gain bg-black shadow-[0_0_18px_rgba(200,168,90,0.5)] transition-transform " +
                (dragging ? "scale-125" : "hover:scale-110")
              }
            >
              <div className="h-2 w-2 rounded-full bg-hindsight-gain" />
              {dragging && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-hindsight-gain"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile preset row */}
      <div className="-mx-1 mt-2 flex flex-wrap gap-1.5 sm:hidden">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => applyPreset(p.years)}
            className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 transition-all hover:border-hindsight-gain/40 hover:text-hindsight-gain"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
