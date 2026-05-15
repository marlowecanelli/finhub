import { NextResponse, type NextRequest } from "next/server";
import { getTickerSummary } from "@/lib/yahoo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYMBOLS = ["^GSPC", "^IXIC", "^DJI", "BTC-USD"];

export async function GET(_request: NextRequest) {
  try {
    const results = await Promise.all(
      SYMBOLS.map(async (s) => {
        try {
          const sum = await getTickerSummary(s);
          return {
            symbol: s,
            name: sum.quote.name,
            price: sum.quote.price,
            changePercent: sum.quote.changePercent,
          };
        } catch {
          return { symbol: s, name: s, price: null, changePercent: null };
        }
      })
    );
    return NextResponse.json({ benchmarks: results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
