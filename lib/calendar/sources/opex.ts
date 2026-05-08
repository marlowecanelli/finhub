import type { CalendarEventInput } from "../types";
import { fridaysInYear, thirdFriday } from "../dates";

/**
 * Generates US equity options expiration events for `years`. Standard equity
 * options expire on the 3rd Friday; quarterly OPEX (triple witching) is the
 * 3rd Friday of Mar/Jun/Sep/Dec; weekly Fridays in between are weeklies.
 */
export function generateOpexEvents(years: number[]): CalendarEventInput[] {
  const out: CalendarEventInput[] = [];

  for (const year of years) {
    const monthlyDates = new Set<string>();
    for (let m = 0; m < 12; m++) {
      const d = thirdFriday(year, m);
      const ymd = d.toISOString().slice(0, 10);
      monthlyDates.add(ymd);
      const isQuarterly = m === 2 || m === 5 || m === 8 || m === 11;
      out.push({
        event_type: "opex",
        ticker: null,
        title: isQuarterly ? "Quarterly OPEX (Triple Witching)" : "Monthly Options Expiration",
        description: isQuarterly
          ? "Stock options, index options, and index futures all expire — historically high volume."
          : "Standard monthly equity options expiration (3rd Friday).",
        event_date: new Date(`${ymd}T20:15:00.000Z`).toISOString(), // 4:15pm ET
        timing: "amc",
        importance: isQuarterly ? "high" : "medium",
        metadata: {
          kind: "opex",
          category: isQuarterly ? "quarterly" : "monthly",
          isTripleWitching: isQuarterly,
        },
        source: "generator:opex",
        external_id: `opex-${ymd}`,
      });
    }

    // Weekly OPEX: every Friday that isn't the monthly OPEX
    for (const f of fridaysInYear(year)) {
      const ymd = f.toISOString().slice(0, 10);
      if (monthlyDates.has(ymd)) continue;
      out.push({
        event_type: "opex",
        ticker: null,
        title: "Weekly Options Expiration",
        description: "Weekly equity options expire at market close.",
        event_date: new Date(`${ymd}T20:15:00.000Z`).toISOString(),
        timing: "amc",
        importance: "low",
        metadata: {
          kind: "opex",
          category: "weekly",
          isTripleWitching: false,
        },
        source: "generator:opex",
        external_id: `opex-weekly-${ymd}`,
      });
    }
  }

  return out;
}
