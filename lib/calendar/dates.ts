/**
 * Pure date helpers for the calendar. Operates in the user's local TZ for display
 * but stores everything as ISO UTC. ET market times are encoded as UTC offsets
 * (08:00 ET → 13:00 UTC during EST, 12:00 UTC during EDT). For BMO/AMC tagging
 * we use canonical ET hours and let the timing field carry the semantic.
 */

export const ONE_DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(d: Date, weekStartsOn: 0 | 1 = 0): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(x, -diff);
}

export function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return startOfDay(x);
}

export function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return endOfDay(x);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Builds a 6×7 calendar grid covering the month containing `d`. */
export function monthGrid(d: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const monthStart = startOfMonth(d);
  const gridStart = startOfWeek(monthStart, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function weekGrid(d: Date, weekStartsOn: 0 | 1 = 0): Date[] {
  const start = startOfWeek(d, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYMD(s: string): Date {
  const parts = s.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function formatWeekday(d: Date, len: "short" | "long" = "short"): string {
  return d.toLocaleDateString("en-US", { weekday: len });
}

export function formatTime(d: Date, tz?: string): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

export function formatDateLong(d: Date, tz?: string): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: tz,
  });
}

/** Third Friday of `month` (0-indexed) in `year`. */
export function thirdFriday(year: number, month: number): Date {
  const first = new Date(year, month, 1);
  const day = first.getDay(); // 0 = Sun
  // Friday = 5. Offset to first Friday, then +14.
  const offset = (5 - day + 7) % 7;
  return new Date(year, month, 1 + offset + 14);
}

/** All Fridays in a year. */
export function fridaysInYear(year: number): Date[] {
  const out: Date[] = [];
  const d = new Date(year, 0, 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  while (d.getFullYear() === year) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}
