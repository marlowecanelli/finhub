import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import type { LiveQuote } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

type MetadataEntry = {
  sector: string | null;
  assetType: string | null;
  etfCategory: string | null;
  etfFamily: string | null;
  expenseRatio: number | null;
  exchange: string | null;
  expires: number;
};

const metaCache = new Map<string, MetadataEntry>();
const META_TTL_MS = 24 * 60 * 60 * 1000;

async function getMetadata(symbol: string, quoteType: string, exchangeName: string | null): Promise<MetadataEntry> {
  const cached = metaCache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached;

  const isEtf = quoteType === "ETF" || quoteType === "MUTUALFUND";

  const entry: MetadataEntry = {
    sector: null,
    assetType: quoteType || null,
    etfCategory: null,
    etfFamily: null,
    expenseRatio: null,
    exchange: exchangeName,
    expires: Date.now() + META_TTL_MS,
  };

  if (isEtf) {
    try {
      const r = await yahooFinance.quoteSummary(symbol, {
        modules: ["fundProfile"],
      });
      const fund = r.fundProfile;
      entry.etfCategory = fund?.categoryName ?? null;
      entry.etfFamily = fund?.family ?? null;
      const fees = fund?.feesExpensesInvestment as Record<string, number | null> | undefined;
      entry.expenseRatio = fees?.netExpRatio ?? fees?.annualReportExpenseRatio ?? null;
    } catch {
      // leave nulls
    }
  } else {
    try {
      const r = await yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile"],
      });
      entry.sector = r.assetProfile?.sector ?? null;
    } catch {
      // leave null
    }
  }

  metaCache.set(symbol, entry);
  return entry;
}

export async function POST(req: Request) {
  let body: { symbols?: string[] };
  try {
    body = (await req.json()) as { symbols?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const symbols = Array.from(
    new Set((body.symbols ?? []).map((s) => s.trim().toUpperCase()).filter(Boolean))
  );
  if (symbols.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  let raw: Awaited<ReturnType<typeof yahooFinance.quote>>;
  try {
    raw = await yahooFinance.quote(symbols);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Quote fetch failed" },
      { status: 502 }
    );
  }

  const list = Array.isArray(raw) ? raw : [raw];

  const metadata = await Promise.all(
    symbols.map((sym) => {
      const q = list.find((x) => x.symbol?.toUpperCase() === sym);
      const qt = (q as Record<string, unknown>)?.quoteType as string | undefined;
      const exch = (q as Record<string, unknown>)?.fullExchangeName as string | null | undefined;
      return getMetadata(sym, qt ?? "EQUITY", exch ?? null);
    })
  );

  const quotes: LiveQuote[] = symbols.map((sym, i) => {
    const q = list.find((x) => x.symbol?.toUpperCase() === sym);
    const meta = metadata[i]!;
    return {
      symbol: sym,
      name: q?.longName ?? q?.shortName ?? null,
      price: q?.regularMarketPrice ?? null,
      previousClose: q?.regularMarketPreviousClose ?? null,
      currency: q?.currency ?? "USD",
      sector: meta.sector,
      assetType: meta.assetType,
      etfCategory: meta.etfCategory,
      etfFamily: meta.etfFamily,
      expenseRatio: meta.expenseRatio,
      exchange: meta.exchange,
    };
  });

  return NextResponse.json({ quotes });
}
