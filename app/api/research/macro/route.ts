import { NextResponse } from "next/server";
import { fetchMacroSeries, fetchYieldCurve, fetchRecessionPeriods, fredConfigured } from "@/lib/api/research/macro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!fredConfigured()) {
    return NextResponse.json({
      configured: false,
      message: "Set FRED_API_KEY in .env.local to enable macro data. Free key from https://fredaccount.stlouisfed.org/apikey.",
      series: [],
      yieldCurve: [],
      recessions: [],
    });
  }

  try {
    const [series, yieldCurve, recessions] = await Promise.all([
      fetchMacroSeries(),
      fetchYieldCurve(),
      fetchRecessionPeriods(),
    ]);
    return NextResponse.json({ configured: true, series, yieldCurve, recessions });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch macro" },
      { status: 502 },
    );
  }
}
