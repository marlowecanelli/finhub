import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

export type EtfHolding = {
  symbol: string | null;
  name: string | null;
  pct: number;
};

export type EtfSectorWeight = {
  sector: string;
  pct: number;
};

export type EtfBondRating = {
  rating: string;
  pct: number;
};

export type EtfDetail = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  category: string | null;
  family: string | null;
  legalType: string | null;
  expenseRatio: number | null;
  // Asset allocation (0–1 scale)
  stockPosition: number | null;
  bondPosition: number | null;
  cashPosition: number | null;
  otherPosition: number | null;
  // Holdings
  topHoldings: EtfHolding[];
  // Sector weights (equity ETFs)
  sectorWeightings: EtfSectorWeight[];
  // Bond-specific
  bondRatings: EtfBondRating[];
  duration: number | null;
  maturity: number | null;
};

const SECTOR_LABELS: Record<string, string> = {
  realestate: "Real Estate",
  consumer_cyclical: "Consumer Cyclical",
  basic_materials: "Basic Materials",
  consumer_defensive: "Consumer Defensive",
  technology: "Technology",
  communication_services: "Communication Services",
  financial_services: "Financial Services",
  utilities: "Utilities",
  industrials: "Industrials",
  energy: "Energy",
  healthcare: "Healthcare",
};

const BOND_RATING_LABELS: Record<string, string> = {
  aaa: "AAA",
  aa: "AA",
  a: "A",
  bbb: "BBB",
  bb: "BB",
  b: "B",
  below_b: "Below B",
  us_government: "US Gov't",
  other: "Other",
};

const etfCache = new Map<string, { data: EtfDetail; expires: number }>();
const ETF_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const cached = etfCache.get(symbol);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: ["fundProfile", "topHoldings", "price"],
    });

    const fund = summary.fundProfile;
    const holdings = summary.topHoldings;
    const price = summary.price;

    const fees = fund?.feesExpensesInvestment as Record<string, number | null> | undefined;
    const expenseRatio = fees?.netExpRatio ?? fees?.annualReportExpenseRatio ?? null;

    // Build top holdings list
    const rawHoldings = (holdings?.holdings ?? []) as Array<{
      symbol?: string | null;
      holdingName?: string | null;
      holdingPercent?: number | null;
    }>;
    const topHoldings: EtfHolding[] = rawHoldings
      .filter((h) => (h.holdingPercent ?? 0) > 0)
      .slice(0, 15)
      .map((h) => ({
        symbol: h.symbol ?? null,
        name: h.holdingName ?? null,
        pct: h.holdingPercent ?? 0,
      }));

    // Build sector weightings list
    const rawSectors = (holdings?.sectorWeightings ?? []) as Array<Record<string, number>>;
    const sectorWeightings: EtfSectorWeight[] = rawSectors
      .flatMap((obj) =>
        Object.entries(obj).map(([key, val]) => ({
          sector: SECTOR_LABELS[key] ?? key,
          pct: val,
        }))
      )
      .filter((s) => s.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    // Build bond ratings
    const rawRatings = (holdings?.bondRatings ?? []) as Array<Record<string, number>>;
    const bondRatings: EtfBondRating[] = rawRatings
      .flatMap((obj) =>
        Object.entries(obj).map(([key, val]) => ({
          rating: BOND_RATING_LABELS[key] ?? key.toUpperCase(),
          pct: val,
        }))
      )
      .filter((r) => r.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    // Asset allocation
    const rawBond = holdings as Record<string, unknown> | null | undefined;

    const detail: EtfDetail = {
      symbol,
      name: price?.longName ?? price?.shortName ?? null,
      exchange: price?.exchangeName ?? null,
      category: fund?.categoryName ?? null,
      family: fund?.family ?? null,
      legalType: fund?.legalType ?? null,
      expenseRatio,
      stockPosition: typeof rawBond?.stockPosition === "number" ? rawBond.stockPosition : null,
      bondPosition: typeof rawBond?.bondPosition === "number" ? rawBond.bondPosition : null,
      cashPosition: typeof rawBond?.cashPosition === "number" ? rawBond.cashPosition : null,
      otherPosition: typeof rawBond?.otherPosition === "number" ? rawBond.otherPosition : null,
      topHoldings,
      sectorWeightings,
      bondRatings,
      duration: (holdings?.bondHoldings as Record<string, number> | null | undefined)?.duration ?? null,
      maturity: (holdings?.bondHoldings as Record<string, number> | null | undefined)?.maturity ?? null,
    };

    etfCache.set(symbol, { data: detail, expires: Date.now() + ETF_TTL_MS });
    return NextResponse.json(detail);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch ETF data" },
      { status: 502 }
    );
  }
}
