import { NextResponse } from "next/server";
import { fetchYieldCurve, fredConfigured } from "@/lib/api/research/macro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!fredConfigured()) {
    return NextResponse.json({ configured: false, points: [] });
  }
  try {
    const points = await fetchYieldCurve();
    return NextResponse.json({ configured: true, points });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch yield curve" },
      { status: 502 },
    );
  }
}
