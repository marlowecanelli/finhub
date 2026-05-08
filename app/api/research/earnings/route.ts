import { NextResponse } from "next/server";
import { fetchEarningsEvents } from "@/lib/api/research/earnings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await fetchEarningsEvents();
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch earnings" },
      { status: 502 },
    );
  }
}
