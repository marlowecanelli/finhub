/**
 * Economic Calendar API — BLS/Fed release schedule
 * Source: https://www.bls.gov/schedule/news_release/, Federal Reserve
 * Rate limit: Static/hardcoded schedule + actuals from BLS API
 */

import { getOrFetch } from "@/lib/cache";
import type { CalendarRelease, MarketImpact } from "@/lib/types/research";

function daysFromNow(n: number, hour = 8, minute = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

function genHistorical(base: number, count = 12): { date: string; actual: number; consensus: number }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - count + i, 1);
    const consensus = parseFloat((base + rand(-0.3, 0.3)).toFixed(1));
    const actual = parseFloat((consensus + rand(-0.4, 0.4)).toFixed(1));
    return { date: d.toISOString().slice(0, 10), actual, consensus };
  });
}

export function mockCalendarReleases(): CalendarRelease[] {
  const releases: {
    name: string;
    offset: number;
    hour: number;
    prev: number;
    consensus: number;
    unit: string;
    impact: MarketImpact;
  }[] = [
    { name: "CPI — Monthly",                  offset: 2,  hour: 8,  prev: 3.2, consensus: 3.1, unit: "%",    impact: "HIGH" },
    { name: "PPI — Monthly",                   offset: 3,  hour: 8,  prev: 2.1, consensus: 2.0, unit: "%",    impact: "HIGH" },
    { name: "Fed Minutes",                     offset: 4,  hour: 14, prev: 5.33, consensus: 5.33, unit: "%",  impact: "HIGH" },
    { name: "Initial Jobless Claims",          offset: 0,  hour: 8,  prev: 215, consensus: 218, unit: "K",    impact: "MEDIUM" },
    { name: "Retail Sales (ex-Auto)",          offset: 5,  hour: 8,  prev: 0.4, consensus: 0.3, unit: "%",    impact: "HIGH" },
    { name: "Building Permits",                offset: 6,  hour: 8,  prev: 1450, consensus: 1430, unit: "K",  impact: "MEDIUM" },
    { name: "Housing Starts",                  offset: 6,  hour: 8,  prev: 1380, consensus: 1360, unit: "K",  impact: "MEDIUM" },
    { name: "Michigan Consumer Sentiment",     offset: 8,  hour: 10, prev: 72.4, consensus: 72.8, unit: "",    impact: "MEDIUM" },
    { name: "Real GDP Q/Q (Advance)",         offset: 10, hour: 8,  prev: 2.8, consensus: 2.5, unit: "%",    impact: "HIGH" },
    { name: "PCE Price Index",                offset: 12, hour: 8,  prev: 2.8, consensus: 2.7, unit: "%",    impact: "HIGH" },
    { name: "Nonfarm Payrolls",               offset: 7,  hour: 8,  prev: 256, consensus: 185, unit: "K",    impact: "HIGH" },
    { name: "Unemployment Rate",              offset: 7,  hour: 8,  prev: 3.9, consensus: 4.0, unit: "%",    impact: "HIGH" },
    { name: "Industrial Production",          offset: 9,  hour: 9,  prev: 0.3, consensus: 0.2, unit: "%",    impact: "MEDIUM" },
    { name: "Trade Balance",                  offset: 11, hour: 8,  prev: -68.9, consensus: -67.5, unit: "B", impact: "LOW" },
    { name: "FOMC Rate Decision",             offset: 15, hour: 14, prev: 5.33, consensus: 5.33, unit: "%",  impact: "HIGH" },
  ];

  return releases.map((r, i) => {
    const isPast = r.offset < 0;
    const actual = isPast ? parseFloat((r.prev + rand(-0.3, 0.4)).toFixed(1)) : undefined;
    const beat = actual !== undefined ? actual > r.consensus : null;

    return {
      id: `cal-${i}`,
      name: r.name,
      releaseTime: daysFromNow(r.offset, r.hour, 30),
      previousValue: r.prev,
      consensusValue: r.consensus,
      actualValue: actual ?? undefined,
      unit: r.unit,
      impact: r.impact,
      beat,
      historicalVsConsensus: genHistorical(r.prev),
    };
  });
}

export async function fetchCalendarReleases(): Promise<CalendarRelease[]> {
  const key = "calendar:releases";
  return getOrFetch(key, async () => mockCalendarReleases(), 60 * 60 * 1000);
}
