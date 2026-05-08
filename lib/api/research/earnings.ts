import { getOrFetch } from "@/lib/cache";
import { yf, safeQuoteSummary, safeChart } from "./yahoo";
import type { EarningsEvent, Sector, EarningsTiming, BeatQuality } from "@/lib/types/research";

const COMPANIES: { ticker: string; name: string; sector: Sector }[] = [
  { ticker: "AAPL",  name: "Apple Inc.",            sector: "Technology" },
  { ticker: "MSFT",  name: "Microsoft Corporation", sector: "Technology" },
  { ticker: "NVDA",  name: "NVIDIA Corporation",    sector: "Technology" },
  { ticker: "GOOGL", name: "Alphabet Inc.",         sector: "Communication" },
  { ticker: "META",  name: "Meta Platforms",        sector: "Communication" },
  { ticker: "AMZN",  name: "Amazon.com Inc.",       sector: "Consumer Discretionary" },
  { ticker: "TSLA",  name: "Tesla Inc.",            sector: "Consumer Discretionary" },
  { ticker: "JPM",   name: "JPMorgan Chase",        sector: "Financials" },
  { ticker: "GS",    name: "Goldman Sachs",         sector: "Financials" },
  { ticker: "UNH",   name: "UnitedHealth Group",    sector: "Healthcare" },
  { ticker: "LLY",   name: "Eli Lilly",             sector: "Healthcare" },
  { ticker: "XOM",   name: "Exxon Mobil",           sector: "Energy" },
  { ticker: "CAT",   name: "Caterpillar Inc.",      sector: "Industrials" },
  { ticker: "V",     name: "Visa Inc.",             sector: "Financials" },
  { ticker: "MA",    name: "Mastercard Inc.",       sector: "Financials" },
];

function classifyTiming(d: Date | undefined): EarningsTiming {
  if (!d) return "TNS";
  const h = d.getUTCHours();
  if (h < 13) return "BMO";
  if (h >= 20) return "AMC";
  return "TNS";
}

function classifyBeat(epsActual?: number, epsEst?: number, revActual?: number, revEst?: number): BeatQuality {
  if (epsActual == null || epsEst == null) return "pending";
  const epsBeats = epsActual > epsEst;
  const revBeats = revActual != null && revEst != null && revActual > revEst;
  if (epsBeats && revBeats) return "double-beat";
  if (epsBeats) return "single-beat";
  return "miss";
}

async function fetchOne(co: { ticker: string; name: string; sector: Sector }): Promise<EarningsEvent | null> {
  const summary = await safeQuoteSummary(co.ticker, [
    "calendarEvents",
    "earnings",
    "earningsHistory",
    "defaultKeyStatistics",
    "summaryDetail",
  ]);
  if (!summary) return null;

  const cal = summary.calendarEvents?.earnings;
  const earnDates = cal?.earningsDate as Date[] | undefined;
  const nextDate = earnDates?.[0];

  const epsAvg = cal?.earningsAverage;
  const revAvg = cal?.revenueAverage;

  const history = summary.earningsHistory?.history ?? [];
  const lastReported = [...history]
    .filter(h => h.epsActual != null)
    .sort((a, b) => {
      const ad = (a.quarter as Date | undefined)?.getTime() ?? 0;
      const bd = (b.quarter as Date | undefined)?.getTime() ?? 0;
      return bd - ad;
    })[0];

  const isPast = nextDate ? nextDate.getTime() < Date.now() : false;
  const epsActual = lastReported?.epsActual ?? undefined;
  const epsEst = lastReported?.epsEstimate ?? undefined;
  const revenueAct = cal?.revenueActual ?? undefined;
  const revenueEst = revAvg;

  let beatQuality: BeatQuality = "pending";
  if (isPast) {
    beatQuality = classifyBeat(
      epsActual,
      epsEst,
      typeof revenueAct === "number" ? revenueAct : undefined,
      typeof revenueEst === "number" ? revenueEst : undefined,
    );
  }

  const referenceDate = nextDate ?? new Date();

  return {
    id: `earn-${co.ticker}`,
    ticker: co.ticker,
    companyName: co.name,
    sector: co.sector,
    earningsDate: referenceDate,
    timing: classifyTiming(nextDate),
    consensusEPS: typeof epsAvg === "number" ? epsAvg : (epsEst ?? 0),
    whisperEPS: typeof epsAvg === "number" ? epsAvg : (epsEst ?? 0),
    actualEPS: isPast ? epsActual : undefined,
    consensusRevenue: typeof revenueEst === "number" ? revenueEst : 0,
    actualRevenue: isPast && typeof revenueAct === "number" ? revenueAct : undefined,
    impliedMovePct: 0,
    historicalActualMoves: [],
    historicalImpliedMoves: [],
    beatQuality,
    guidanceRaised: undefined,
    postEarningsDrift: { d1: 0, d3: 0, d5: 0, d10: 0 },
  };
}

export async function fetchEarningsEvents(): Promise<EarningsEvent[]> {
  return getOrFetch(
    "earnings:all",
    async () => {
      const results = await Promise.all(COMPANIES.map(fetchOne));
      return results.filter((e): e is EarningsEvent => e !== null);
    },
    30 * 60 * 1000,
  );
}
