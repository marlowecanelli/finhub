import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import type { LiveQuote } from "@/lib/portfolio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

// In-memory sector cache. Sector data rarely changes; quotes refresh every 60s
// and we don't want to round-trip Yahoo for assetProfile each time.
const sectorCache = new Map<string, { sector: string | null; expires: number }>();
const SECTOR_TTL_MS = 24 * 60 * 60 * 1000;

async function getSector(symbol: string): Promise<string | null> {
  const cached = sectorCache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.sector;
  try {
    const r = await yahooFinance.quoteSummary(symbol, {
      modules: ["assetProfile"],
    });
    const sector = r.assetProfile?.sector ?? null;
    sectorCache.set(symbol, { sector, expires: Date.now() + SECTOR_TTL_MS });
    return sector;
  } catch {
    sectorCache.set(symbol, { sector: null, expires: Date.now() + SECTOR_TTL_MS });
    return null;
  }
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
  const sectors = await Promise.all(symbols.map((s) => getSector(s)));

  const quotes: LiveQuote[] = symbols.map((sym, i) => {
    const q = list.find((x) => x.symbol?.toUpperCase() === sym);
    return {
      symbol: sym,
      name: q?.longName ?? q?.shortName ?? null,
      price: q?.regularMarketPrice ?? null,
      previousClose: q?.regularMarketPreviousClose ?? null,
      currency: q?.currency ?? "USD",
      sector: sectors[i] ?? null,
    };
  });

  return NextResponse.json({ quotes });
}
