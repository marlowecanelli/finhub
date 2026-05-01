import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const yf = new YahooFinance();
    const q = await yf.quote(params.symbol.toUpperCase());
    return NextResponse.json(
      {
        price: q.regularMarketPrice ?? null,
        change: q.regularMarketChange ?? null,
        changePercent:
          q.regularMarketChangePercent != null
            ? q.regularMarketChangePercent * 100
            : null,
        marketState: q.marketState ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Quote failed" },
      { status: 404 }
    );
  }
}
