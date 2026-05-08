import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { INDEX_META, type IndexKey } from "@/lib/index-constituents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("index") ?? "sp500";
  const indexKey = (["sp500", "nasdaq100", "dow30"].includes(raw) ? raw : "sp500") as IndexKey;

  const { constituents } = INDEX_META[indexKey];
  const symbols = constituents.map((c) => c.symbol);

  try {
    const quotes = await yf.quote(symbols);
    const list = Array.isArray(quotes) ? quotes : [quotes];

    const data = constituents.map((c) => {
      const q = list.find((q) => q.symbol === c.symbol);
      return {
        symbol: c.symbol,
        name: c.name,
        weight: c.weight,
        sector: c.sector,
        changePct: q?.regularMarketChangePercent ?? 0,
        price: q?.regularMarketPrice ?? null,
      };
    });

    return NextResponse.json(
      { index: indexKey, data },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch data" },
      { status: 502 }
    );
  }
}
