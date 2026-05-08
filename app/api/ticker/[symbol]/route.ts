import { NextResponse } from "next/server";
import { getTickerSummary } from "@/lib/yahoo";
import { createServerSupabase } from "@/lib/supabase-server";
import { recordEvent } from "@/lib/achievements/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const summary = await getTickerSummary(params.symbol);
    // Fire-and-forget achievement event. Min-duration enforcement happens
    // separately on the client-side ping; this just registers that the
    // user landed on the ticker page.
    try {
      const supabase = createServerSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await recordEvent(user.id, "ticker_viewed", { ticker: params.symbol.toUpperCase() });
      }
    } catch {
      // Never break the ticker view if the achievement engine fails.
    }
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 404 }
    );
  }
}
