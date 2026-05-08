import { NextResponse } from "next/server";
import { fetchSectorPerformance } from "@/lib/api/research/sectors";
import type { Timeframe } from "@/lib/types/research";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID: Timeframe[] = ["1W", "1M", "3M", "6M", "YTD", "1Y"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tf = searchParams.get("timeframe") as Timeframe | null;
  const timeframe: Timeframe = tf && VALID.includes(tf) ? tf : "1M";
  try {
    const data = await fetchSectorPerformance(timeframe);
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch sectors" },
      { status: 502 },
    );
  }
}
