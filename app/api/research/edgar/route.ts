import { NextResponse } from "next/server";
import { fetchRecentFilings, fetchFirehose } from "@/lib/api/research/edgar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const mode = searchParams.get("mode") ?? (ticker ? "ticker" : "firehose");
  const formsParam = searchParams.get("forms");
  const forms = formsParam ? formsParam.split(",") : ["8-K", "10-K", "10-Q"];

  try {
    if (mode === "ticker" && ticker) {
      const data = await fetchRecentFilings(ticker, 20);
      return NextResponse.json(data);
    }
    const filings = await fetchFirehose(forms);
    return NextResponse.json({ filings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "EDGAR fetch failed" },
      { status: 502 },
    );
  }
}
