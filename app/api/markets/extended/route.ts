import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yahooFinance = new YahooFinance();

const SYMBOLS = [
  "^GSPC",
  "^IXIC",
  "^DJI",
  "^RUT",
  "^VIX",
  "BTC-USD",
  "ETH-USD",
  "GC=F",
  "CL=F",
  "DX-Y.NYB",
  "^TNX",
];

export async function GET() {
  try {
    const quotes = await yahooFinance.quote(SYMBOLS);
    const list = Array.isArray(quotes) ? quotes : [quotes];

    const data = list.map((q) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice ?? null,
      changePct: q.regularMarketChangePercent ?? null,
      change: q.regularMarketChange ?? null,
    }));

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 502 }
    );
  }
}
