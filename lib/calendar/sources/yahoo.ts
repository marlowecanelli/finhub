import YahooFinance from "yahoo-finance2";
import type { CalendarEventInput } from "../types";

const yahooFinance = new YahooFinance();

/** Universe of tickers we attempt to enrich. Top US large/mega caps + popular names. */
const TRACKED_TICKERS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B",
  "JPM", "V", "MA", "UNH", "JNJ", "XOM", "WMT", "PG", "HD", "CVX",
  "LLY", "ABBV", "PFE", "KO", "PEP", "MRK", "BAC", "WFC", "GS", "MS",
  "AVGO", "ORCL", "CRM", "AMD", "INTC", "ADBE", "NFLX", "DIS", "T", "VZ",
  "QCOM", "TXN", "IBM", "CSCO", "MU", "AMAT", "LRCX", "SHOP", "PYPL", "SQ",
  "UBER", "ABNB", "COIN", "PLTR", "SNOW", "NOW", "INTU", "BKNG", "MDB",
  "COST", "MCD", "SBUX", "NKE", "TGT", "LOW", "F", "GM", "BA", "GE",
  "CAT", "DE", "RTX", "LMT", "NOC", "GD",
];

function tierForMarketCap(cap: number | null | undefined):
  | "mega" | "large" | "mid" | "small" | "micro" | null {
  if (cap == null) return null;
  if (cap >= 200e9) return "mega";
  if (cap >= 10e9) return "large";
  if (cap >= 2e9) return "mid";
  if (cap >= 300e6) return "small";
  return "micro";
}

function timingFromHour(epochMs: number | null): "bmo" | "amc" | "dmh" | "all_day" {
  if (!epochMs) return "all_day";
  const d = new Date(epochMs);
  // Convert to ET (rough: UTC-5/-4). Take UTC hour and assume EST/EDT bands.
  const hourUtc = d.getUTCHours();
  // 9:30 ET–16:00 ET ≈ 13:30–20:00 UTC (EST) / 12:30–19:00 UTC (EDT)
  if (hourUtc < 13) return "bmo";
  if (hourUtc >= 20) return "amc";
  return "dmh";
}

function importanceFor(cap: number | null | undefined): "low" | "medium" | "high" | "critical" {
  if (cap == null) return "medium";
  if (cap >= 500e9) return "critical";
  if (cap >= 50e9) return "high";
  if (cap >= 5e9) return "medium";
  return "low";
}

type EarningsRow = {
  symbol: string;
  earningsDate?: Date | { fmt?: string; raw?: number } | null;
  startDateTime?: string | Date | null;
  startDateTimeType?: string | null;
  epsEstimate?: number | null;
  epsActual?: number | null;
  revenueEstimate?: number | null;
  surprisePercent?: number | null;
  companyShortName?: string | null;
};

function coerceDate(x: unknown): Date | null {
  if (!x) return null;
  if (x instanceof Date) return x;
  if (typeof x === "string") {
    const d = new Date(x);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof x === "object") {
    const obj = x as { fmt?: string; raw?: number };
    if (obj.raw) return new Date(obj.raw * 1000);
    if (obj.fmt) {
      const d = new Date(obj.fmt);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/** Fetches upcoming earnings + dividend events for the tracked universe. */
export async function fetchYahooEvents(): Promise<CalendarEventInput[]> {
  const out: CalendarEventInput[] = [];
  const now = Date.now();
  const horizonMs = 1000 * 60 * 60 * 24 * 90; // 90 days forward

  // Concurrency-limited fetch
  const concurrency = 6;
  const queue = [...TRACKED_TICKERS];
  const workers: Promise<void>[] = [];

  async function worker() {
    while (queue.length) {
      const sym = queue.shift()!;
      try {
        const summary = await yahooFinance.quoteSummary(sym, {
          modules: ["calendarEvents", "earnings", "price", "summaryDetail"],
        });
        const cap = summary.price?.marketCap ?? summary.summaryDetail?.marketCap ?? null;
        const tier = tierForMarketCap(cap);
        const name = summary.price?.shortName ?? summary.price?.longName ?? sym;

        // ── Earnings ───────────────────────────────────────────────────
        const earningsEvents = (summary.calendarEvents?.earnings as { earningsDate?: unknown[] } | undefined)
          ?.earningsDate;
        const earningsDate = Array.isArray(earningsEvents) ? coerceDate(earningsEvents[0]) : null;
        if (earningsDate && earningsDate.getTime() > now && earningsDate.getTime() < now + horizonMs) {
          const earningsAvg = (summary.calendarEvents?.earnings as { earningsAverage?: number } | undefined)
            ?.earningsAverage ?? null;
          const revenueAvg = (summary.calendarEvents?.earnings as { revenueAverage?: number } | undefined)
            ?.revenueAverage ?? null;
          // Most recent quarter actual (for last beat/miss)
          const eh = (summary.earnings as { earningsChart?: { quarterly?: Array<{ actual?: number; estimate?: number }> } } | undefined)
            ?.earningsChart?.quarterly ?? [];
          const lastQ = eh[eh.length - 1];
          const lastActual = lastQ?.actual ?? null;
          const lastEstimate = lastQ?.estimate ?? null;

          out.push({
            event_type: "earnings",
            ticker: sym,
            title: `${sym} — ${name} earnings`,
            description: `${name} reports quarterly results.`,
            event_date: earningsDate.toISOString(),
            timing: timingFromHour(earningsDate.getTime()),
            importance: importanceFor(cap),
            metadata: {
              kind: "earnings",
              fiscalQuarter: null,
              epsEstimate: earningsAvg,
              revenueEstimate: revenueAvg,
              lastEpsActual: lastActual,
              lastEpsEstimate: lastEstimate,
              lastSurprisePct:
                lastActual != null && lastEstimate != null && lastEstimate !== 0
                  ? ((lastActual - lastEstimate) / Math.abs(lastEstimate)) * 100
                  : null,
              marketCap: cap,
              marketCapTier: tier,
            },
            source: "yahoo:earnings",
            external_id: `earnings-${sym}-${earningsDate.toISOString().slice(0, 10)}`,
          });
        }

        // ── Dividends (ex-date) ───────────────────────────────────────
        const exDate = coerceDate(summary.calendarEvents?.exDividendDate);
        const divDate = coerceDate(summary.calendarEvents?.dividendDate);
        const divRate = summary.summaryDetail?.dividendRate ?? null;
        const divYield = summary.summaryDetail?.dividendYield ?? null;
        const divAmount =
          (summary.calendarEvents as { dividendValue?: number } | undefined)?.dividendValue ??
          (divRate != null ? divRate / 4 : null);

        if (exDate && exDate.getTime() > now && exDate.getTime() < now + horizonMs && divAmount != null) {
          out.push({
            event_type: "dividend",
            ticker: sym,
            title: `${sym} ex-dividend`,
            description: `${name} ex-dividend date — must own shares before this date to receive the payout.`,
            event_date: exDate.toISOString(),
            timing: "bmo",
            importance: "medium",
            metadata: {
              kind: "dividend",
              amount: divAmount,
              yieldPct: divYield != null ? divYield * 100 : null,
              isSpecial: false,
              changeVsPrior: null,
              recordDate: null,
              paymentDate: divDate?.toISOString() ?? null,
            },
            source: "yahoo:dividend",
            external_id: `div-${sym}-${exDate.toISOString().slice(0, 10)}`,
          });
        }
      } catch {
        // Adapter is best-effort per ticker; one failure must not poison the cron.
      }
    }
  }

  for (let i = 0; i < concurrency; i++) workers.push(worker());
  await Promise.all(workers);

  // Re-cast to satisfy the discriminated union after dynamic build above.
  return out as unknown as CalendarEventInput[];
}
