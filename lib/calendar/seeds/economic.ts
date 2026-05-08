import type { CalendarEventInput, EventImportance } from "../types";

/**
 * Curated US macro release calendar. Maintained manually because release-date
 * data sources (FRED, BLS, BEA) publish data series, not schedules. Update this
 * file every 6–12 months.
 *
 * Times are ET wall-clock; converted to UTC at build via `toUtc(...)`.
 */
type Macro = {
  date: string; // YYYY-MM-DD
  timeET: string; // HH:mm
  title: string;
  agency: string;
  importance: EventImportance;
  unit?: string;
};

const RELEASES: Macro[] = [
  // ── May 2026 ─────────────────────────────────────────────────────────
  { date: "2026-05-02", timeET: "08:30", title: "Nonfarm Payrolls (Apr)", agency: "BLS", importance: "critical", unit: "K jobs" },
  { date: "2026-05-13", timeET: "08:30", title: "CPI (Apr)", agency: "BLS", importance: "critical", unit: "% MoM" },
  { date: "2026-05-14", timeET: "08:30", title: "PPI (Apr)", agency: "BLS", importance: "high", unit: "% MoM" },
  { date: "2026-05-15", timeET: "08:30", title: "Retail Sales (Apr)", agency: "Census", importance: "high", unit: "% MoM" },
  { date: "2026-05-22", timeET: "10:00", title: "Existing Home Sales (Apr)", agency: "NAR", importance: "medium" },
  { date: "2026-05-29", timeET: "08:30", title: "PCE Price Index (Apr)", agency: "BEA", importance: "critical", unit: "% MoM" },
  // ── June 2026 ────────────────────────────────────────────────────────
  { date: "2026-06-02", timeET: "10:00", title: "ISM Manufacturing PMI (May)", agency: "ISM", importance: "high" },
  { date: "2026-06-04", timeET: "10:00", title: "ISM Services PMI (May)", agency: "ISM", importance: "high" },
  { date: "2026-06-05", timeET: "08:30", title: "Nonfarm Payrolls (May)", agency: "BLS", importance: "critical", unit: "K jobs" },
  { date: "2026-06-10", timeET: "08:30", title: "CPI (May)", agency: "BLS", importance: "critical", unit: "% MoM" },
  { date: "2026-06-11", timeET: "08:30", title: "PPI (May)", agency: "BLS", importance: "high", unit: "% MoM" },
  { date: "2026-06-17", timeET: "14:00", title: "FOMC Rate Decision", agency: "Federal Reserve", importance: "critical", unit: "bps" },
  { date: "2026-06-17", timeET: "14:30", title: "Fed Chair Press Conference", agency: "Federal Reserve", importance: "critical" },
  { date: "2026-06-18", timeET: "08:30", title: "Retail Sales (May)", agency: "Census", importance: "high", unit: "% MoM" },
  { date: "2026-06-26", timeET: "08:30", title: "PCE Price Index (May)", agency: "BEA", importance: "critical", unit: "% MoM" },
  { date: "2026-06-30", timeET: "10:00", title: "Consumer Confidence (Jun)", agency: "Conf. Board", importance: "medium" },
  // ── July 2026 ────────────────────────────────────────────────────────
  { date: "2026-07-01", timeET: "10:00", title: "ISM Manufacturing PMI (Jun)", agency: "ISM", importance: "high" },
  { date: "2026-07-03", timeET: "08:30", title: "Nonfarm Payrolls (Jun)", agency: "BLS", importance: "critical", unit: "K jobs" },
  { date: "2026-07-15", timeET: "08:30", title: "CPI (Jun)", agency: "BLS", importance: "critical", unit: "% MoM" },
  { date: "2026-07-16", timeET: "08:30", title: "PPI (Jun)", agency: "BLS", importance: "high", unit: "% MoM" },
  { date: "2026-07-17", timeET: "08:30", title: "Retail Sales (Jun)", agency: "Census", importance: "high", unit: "% MoM" },
  { date: "2026-07-29", timeET: "14:00", title: "FOMC Rate Decision", agency: "Federal Reserve", importance: "critical", unit: "bps" },
  { date: "2026-07-30", timeET: "08:30", title: "GDP Q2 (Advance)", agency: "BEA", importance: "critical", unit: "% QoQ ann." },
  { date: "2026-07-31", timeET: "08:30", title: "PCE Price Index (Jun)", agency: "BEA", importance: "critical", unit: "% MoM" },
  // ── Aug 2026 ─────────────────────────────────────────────────────────
  { date: "2026-08-07", timeET: "08:30", title: "Nonfarm Payrolls (Jul)", agency: "BLS", importance: "critical" },
  { date: "2026-08-12", timeET: "08:30", title: "CPI (Jul)", agency: "BLS", importance: "critical" },
  { date: "2026-08-14", timeET: "08:30", title: "Retail Sales (Jul)", agency: "Census", importance: "high" },
  { date: "2026-08-21", timeET: "10:00", title: "Jackson Hole Symposium begins", agency: "KC Fed", importance: "high" },
  { date: "2026-08-28", timeET: "08:30", title: "PCE Price Index (Jul)", agency: "BEA", importance: "critical" },
  // ── Sept 2026 ────────────────────────────────────────────────────────
  { date: "2026-09-04", timeET: "08:30", title: "Nonfarm Payrolls (Aug)", agency: "BLS", importance: "critical" },
  { date: "2026-09-10", timeET: "08:30", title: "CPI (Aug)", agency: "BLS", importance: "critical" },
  { date: "2026-09-16", timeET: "14:00", title: "FOMC Rate Decision", agency: "Federal Reserve", importance: "critical" },
  { date: "2026-09-25", timeET: "08:30", title: "GDP Q2 (Final)", agency: "BEA", importance: "high" },
  { date: "2026-09-25", timeET: "08:30", title: "PCE Price Index (Aug)", agency: "BEA", importance: "critical" },
  // ── Oct 2026 ─────────────────────────────────────────────────────────
  { date: "2026-10-02", timeET: "08:30", title: "Nonfarm Payrolls (Sep)", agency: "BLS", importance: "critical" },
  { date: "2026-10-15", timeET: "08:30", title: "CPI (Sep)", agency: "BLS", importance: "critical" },
  { date: "2026-10-16", timeET: "08:30", title: "Retail Sales (Sep)", agency: "Census", importance: "high" },
  { date: "2026-10-29", timeET: "08:30", title: "GDP Q3 (Advance)", agency: "BEA", importance: "critical" },
  { date: "2026-10-30", timeET: "08:30", title: "PCE Price Index (Sep)", agency: "BEA", importance: "critical" },
  // ── Nov 2026 ─────────────────────────────────────────────────────────
  { date: "2026-11-04", timeET: "14:00", title: "FOMC Rate Decision", agency: "Federal Reserve", importance: "critical" },
  { date: "2026-11-06", timeET: "08:30", title: "Nonfarm Payrolls (Oct)", agency: "BLS", importance: "critical" },
  { date: "2026-11-12", timeET: "08:30", title: "CPI (Oct)", agency: "BLS", importance: "critical" },
  { date: "2026-11-25", timeET: "08:30", title: "PCE Price Index (Oct)", agency: "BEA", importance: "critical" },
  // ── Dec 2026 ─────────────────────────────────────────────────────────
  { date: "2026-12-04", timeET: "08:30", title: "Nonfarm Payrolls (Nov)", agency: "BLS", importance: "critical" },
  { date: "2026-12-10", timeET: "08:30", title: "CPI (Nov)", agency: "BLS", importance: "critical" },
  { date: "2026-12-16", timeET: "14:00", title: "FOMC Rate Decision", agency: "Federal Reserve", importance: "critical" },
  { date: "2026-12-23", timeET: "08:30", title: "PCE Price Index (Nov)", agency: "BEA", importance: "critical" },
];

/** Convert ET wall-clock to UTC ISO. ET ≈ UTC-5 (EST) / UTC-4 (EDT). */
function etToUtc(date: string, timeET: string): string {
  const dParts = date.split("-").map(Number);
  const tParts = timeET.split(":").map(Number);
  const y = dParts[0] ?? 2026;
  const m = dParts[1] ?? 1;
  const d = dParts[2] ?? 1;
  const hh = tParts[0] ?? 0;
  const mm = tParts[1] ?? 0;
  // Crude DST detector: EDT runs ~mid-March to early-November.
  const isEdt = m > 3 && m < 11;
  const offset = isEdt ? 4 : 5;
  const utc = new Date(Date.UTC(y, m - 1, d, hh + offset, mm));
  return utc.toISOString();
}

export function economicEvents(): CalendarEventInput[] {
  return RELEASES.map((r) => ({
    event_type: "economic",
    ticker: null,
    title: r.title,
    description: `${r.agency} release. Watch for surprise vs. consensus.`,
    event_date: etToUtc(r.date, r.timeET),
    timing: "all_day",
    importance: r.importance,
    metadata: {
      kind: "economic",
      releaseAgency: r.agency,
      unit: r.unit ?? null,
    },
    source: "seed:us_macro",
    external_id: `econ-${r.date}-${r.title.replace(/\s+/g, "_").slice(0, 32)}`,
  }));
}
