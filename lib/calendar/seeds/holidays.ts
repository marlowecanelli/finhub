import type { CalendarEventInput } from "../types";

/** Hardcoded NYSE/Nasdaq holiday calendar 2026–2028. */
type Holiday = { date: string; name: string; halfDay?: true; earlyClose?: string };

const US_HOLIDAYS: Holiday[] = [
  // 2026
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-01-19", name: "Martin Luther King Jr. Day" },
  { date: "2026-02-16", name: "Presidents' Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-05-25", name: "Memorial Day" },
  { date: "2026-06-19", name: "Juneteenth" },
  { date: "2026-07-03", name: "Independence Day (observed)" },
  { date: "2026-09-07", name: "Labor Day" },
  { date: "2026-11-26", name: "Thanksgiving Day" },
  { date: "2026-11-27", name: "Day After Thanksgiving", halfDay: true, earlyClose: "13:00 ET" },
  { date: "2026-12-24", name: "Christmas Eve", halfDay: true, earlyClose: "13:00 ET" },
  { date: "2026-12-25", name: "Christmas Day" },
  // 2027
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-01-18", name: "Martin Luther King Jr. Day" },
  { date: "2027-02-15", name: "Presidents' Day" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-05-31", name: "Memorial Day" },
  { date: "2027-06-18", name: "Juneteenth (observed)" },
  { date: "2027-07-05", name: "Independence Day (observed)" },
  { date: "2027-09-06", name: "Labor Day" },
  { date: "2027-11-25", name: "Thanksgiving Day" },
  { date: "2027-11-26", name: "Day After Thanksgiving", halfDay: true, earlyClose: "13:00 ET" },
  { date: "2027-12-23", name: "Christmas Eve (observed)", halfDay: true, earlyClose: "13:00 ET" },
  { date: "2027-12-24", name: "Christmas Day (observed)" },
  // 2028
  { date: "2028-01-17", name: "Martin Luther King Jr. Day" },
  { date: "2028-02-21", name: "Presidents' Day" },
  { date: "2028-04-14", name: "Good Friday" },
  { date: "2028-05-29", name: "Memorial Day" },
  { date: "2028-06-19", name: "Juneteenth" },
  { date: "2028-07-04", name: "Independence Day" },
  { date: "2028-09-04", name: "Labor Day" },
  { date: "2028-11-23", name: "Thanksgiving Day" },
  { date: "2028-11-24", name: "Day After Thanksgiving", halfDay: true, earlyClose: "13:00 ET" },
  { date: "2028-12-25", name: "Christmas Day" },
];

export function holidayEvents(): CalendarEventInput[] {
  return US_HOLIDAYS.map((h) => ({
    event_type: "holiday",
    ticker: null,
    title: h.halfDay ? `${h.name} (early close)` : h.name,
    description: h.halfDay
      ? `US equity markets close early at ${h.earlyClose}.`
      : "US equity markets closed (NYSE, Nasdaq).",
    event_date: new Date(`${h.date}T14:30:00.000Z`).toISOString(),
    timing: "all_day",
    importance: "medium",
    metadata: {
      kind: "holiday",
      market: "US",
      isHalfDay: !!h.halfDay,
      earlyClose: h.earlyClose ?? null,
    },
    source: "static:us_market_holidays",
    external_id: `us-holiday-${h.date}`,
  }));
}
