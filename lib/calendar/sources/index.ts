import type { CalendarEventInput } from "../types";
import { holidayEvents } from "../seeds/holidays";
import { economicEvents } from "../seeds/economic";
import { conferenceEvents } from "../seeds/conferences";
import { cryptoEvents } from "../seeds/crypto";
import { generateOpexEvents } from "./opex";
import { fetchYahooEvents } from "./yahoo";
import { fetchTreasuryAuctions } from "./treasury";
import { fetchSecIpoFilings } from "./sec-ipos";

export type SourceResult = {
  source: string;
  count: number;
  ok: boolean;
  error?: string;
};

export async function fetchAllSources(): Promise<{
  events: CalendarEventInput[];
  results: SourceResult[];
}> {
  const thisYear = new Date().getFullYear();

  const tasks: Array<{ name: string; fn: () => Promise<CalendarEventInput[]> | CalendarEventInput[] }> = [
    { name: "holidays", fn: holidayEvents },
    { name: "economic", fn: economicEvents },
    { name: "conferences", fn: conferenceEvents },
    { name: "crypto", fn: cryptoEvents },
    { name: "opex", fn: () => generateOpexEvents([thisYear, thisYear + 1]) },
    { name: "yahoo", fn: fetchYahooEvents },
    { name: "treasury", fn: fetchTreasuryAuctions },
    { name: "sec-ipos", fn: fetchSecIpoFilings },
  ];

  const settled = await Promise.allSettled(tasks.map(async (t) => ({ name: t.name, data: await t.fn() })));

  const events: CalendarEventInput[] = [];
  const results: SourceResult[] = [];
  settled.forEach((s, i) => {
    const taskName = tasks[i]?.name ?? "unknown";
    if (s.status === "fulfilled") {
      events.push(...s.value.data);
      results.push({ source: s.value.name, count: s.value.data.length, ok: true });
    } else {
      results.push({
        source: taskName,
        count: 0,
        ok: false,
        error: s.reason instanceof Error ? s.reason.message : String(s.reason),
      });
    }
  });

  return { events, results };
}
