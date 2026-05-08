import { getOrFetch } from "@/lib/cache";
import { fredApiKey, fredObservations, fredReleaseDates } from "./fred";
import type { CalendarRelease, MarketImpact } from "@/lib/types/research";

interface ReleaseConfig {
  name: string;
  releaseId: number;
  hourUtc: number;
  minuteUtc: number;
  seriesId: string;
  units: "lin" | "pch" | "pc1";
  unit: string;
  impact: MarketImpact;
}

const RELEASES: ReleaseConfig[] = [
  { name: "CPI — YoY",                    releaseId: 10,  hourUtc: 12, minuteUtc: 30, seriesId: "CPIAUCSL",     units: "pc1", unit: "%", impact: "HIGH" },
  { name: "PPI — YoY",                    releaseId: 46,  hourUtc: 12, minuteUtc: 30, seriesId: "PPIACO",       units: "pc1", unit: "%", impact: "HIGH" },
  { name: "PCE Price Index — YoY",        releaseId: 21,  hourUtc: 12, minuteUtc: 30, seriesId: "PCEPI",        units: "pc1", unit: "%", impact: "HIGH" },
  { name: "Initial Jobless Claims",       releaseId: 13,  hourUtc: 12, minuteUtc: 30, seriesId: "ICSA",         units: "lin", unit: "K", impact: "MEDIUM" },
  { name: "Unemployment Rate",            releaseId: 50,  hourUtc: 12, minuteUtc: 30, seriesId: "UNRATE",       units: "lin", unit: "%", impact: "HIGH" },
  { name: "Nonfarm Payrolls",             releaseId: 50,  hourUtc: 12, minuteUtc: 30, seriesId: "PAYEMS",       units: "lin", unit: "K", impact: "HIGH" },
  { name: "Retail Sales (Ex-Auto) — YoY", releaseId: 41,  hourUtc: 12, minuteUtc: 30, seriesId: "RSXFS",        units: "pc1", unit: "%", impact: "HIGH" },
  { name: "Industrial Production",        releaseId: 16,  hourUtc: 13, minuteUtc: 15, seriesId: "INDPRO",       units: "pch", unit: "%", impact: "MEDIUM" },
  { name: "Housing Starts",               releaseId: 14,  hourUtc: 12, minuteUtc: 30, seriesId: "HOUST",        units: "lin", unit: "K", impact: "MEDIUM" },
  { name: "Building Permits",             releaseId: 14,  hourUtc: 12, minuteUtc: 30, seriesId: "PERMIT",       units: "lin", unit: "K", impact: "MEDIUM" },
  { name: "Real GDP — QoQ Annualized",    releaseId: 53,  hourUtc: 12, minuteUtc: 30, seriesId: "A191RL1Q225SBEA", units: "lin", unit: "%", impact: "HIGH" },
  { name: "Michigan Consumer Sentiment",  releaseId: 130, hourUtc: 14, minuteUtc: 0,  seriesId: "UMCSENT",      units: "lin", unit: "",  impact: "MEDIUM" },
  { name: "Federal Funds Rate",           releaseId: 101, hourUtc: 18, minuteUtc: 0,  seriesId: "FEDFUNDS",     units: "lin", unit: "%", impact: "HIGH" },
];

function combineDate(dateStr: string, hour: number, minute: number): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!, hour, minute, 0));
}

async function fetchOne(cfg: ReleaseConfig): Promise<CalendarRelease[]> {
  const today = new Date();
  const startWindow = new Date(today);
  startWindow.setDate(startWindow.getDate() - 90);
  const endWindow = new Date(today);
  endWindow.setDate(endWindow.getDate() + 60);

  const [releaseDates, observations] = await Promise.all([
    fredReleaseDates(cfg.releaseId, {
      start: startWindow.toISOString().slice(0, 10),
      end: endWindow.toISOString().slice(0, 10),
    }),
    fredObservations(cfg.seriesId, {
      start: new Date(today.getFullYear() - 2, today.getMonth(), 1).toISOString().slice(0, 10),
      units: cfg.units,
    }),
  ]);

  const upcoming = releaseDates
    .filter(rd => combineDate(rd.date, cfg.hourUtc, cfg.minuteUtc).getTime() >= today.getTime() - 24 * 3600 * 1000)
    .slice(0, 1);

  return upcoming.map((rd, i) => {
    const releaseTime = combineDate(rd.date, cfg.hourUtc, cfg.minuteUtc);
    const isPast = releaseTime.getTime() < today.getTime();

    const sorted = observations.slice().sort((a, b) => a.date.localeCompare(b.date));
    const previous = sorted[sorted.length - 2]?.value ?? sorted[sorted.length - 1]?.value ?? 0;
    const actual = isPast ? sorted[sorted.length - 1]?.value : undefined;

    const historical = sorted.slice(-12).map(o => ({
      date: o.date,
      actual: o.value,
      consensus: o.value,
    }));

    return {
      id: `cal-${cfg.seriesId}-${rd.date}-${i}`,
      name: cfg.name,
      releaseTime,
      previousValue: previous,
      consensusValue: undefined,
      actualValue: actual,
      unit: cfg.unit,
      impact: cfg.impact,
      beat: null,
      historicalVsConsensus: historical,
    };
  });
}

export async function fetchCalendarReleases(): Promise<CalendarRelease[]> {
  if (!fredApiKey()) return [];
  return getOrFetch(
    "calendar:releases",
    async () => {
      const results = await Promise.all(RELEASES.map(fetchOne));
      return results.flat().sort((a, b) => a.releaseTime.getTime() - b.releaseTime.getTime());
    },
    60 * 60 * 1000,
  );
}
