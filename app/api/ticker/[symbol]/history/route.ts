import { NextResponse, type NextRequest } from "next/server";
import { getHistory, type Timeframe } from "@/lib/yahoo";

export const runtime = "nodejs";

const TIMEFRAMES: Timeframe[] = ["1D", "5D", "1M", "3M", "1Y", "5Y", "All"];

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const tfParam = request.nextUrl.searchParams.get("tf") ?? "1M";
  const tf = (TIMEFRAMES.includes(tfParam as Timeframe)
    ? tfParam
    : "1M") as Timeframe;

  try {
    const points = await getHistory(params.symbol, tf);
    return NextResponse.json(
      { symbol: params.symbol.toUpperCase(), tf, points },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "History failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
