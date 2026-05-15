import { NextResponse, type NextRequest } from "next/server";
import { getTickerSummary } from "@/lib/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }
  try {
    const summary = await getTickerSummary(symbol);
    const q = summary.quote;
    return NextResponse.json({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      previousClose: q.previousClose,
      marketState: q.marketState,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Quote unavailable" },
      { status: 404 }
    );
  }
}
