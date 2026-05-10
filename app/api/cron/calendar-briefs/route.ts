import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GEMINI_MODEL, getGemini } from "@/lib/gemini";
import { getWatchlistTickers, listEvents } from "@/lib/calendar/repo";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const SYSTEM = `You are an editor at a markets desk writing a tight, calm,
non-hyped morning briefing for a retail investor. Use plain English. No emoji.
No advice. Reference specific events by name. 4 short paragraphs, ~80 words each.`;

/**
 * Pre-warms the per-user calendar brief cache for users with email digest enabled.
 * Designed to be cheap: shares cache with the on-demand brief endpoint.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "admin unavailable" }, { status: 503 });
  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 503 });
  }

  const { data: rows } = await admin
    .from("user_calendar_settings")
    .select("user_id, email_digest_enabled, watchlist_only")
    .eq("email_digest_enabled", true);

  const users = rows ?? [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const from = new Date(today); from.setHours(0, 0, 0, 0);
  const to = new Date(today); to.setHours(23, 59, 59, 999);

  const macroToday = await listEvents(admin, {
    from: from.toISOString(),
    to: to.toISOString(),
    types: ["economic"],
    importance: ["high", "critical"],
  });

  let generated = 0;
  for (const u of users) {
    const userId = (u as { user_id: string }).user_id;

    const { data: existing } = await admin
      .from("calendar_briefs")
      .select("id")
      .eq("user_id", userId)
      .eq("brief_date", todayStr)
      .maybeSingle();
    if (existing) continue;

    const watchlist = await getWatchlistTickers(admin, userId);
    const watchlistEvents = watchlist.length
      ? await listEvents(admin, {
          from: from.toISOString(),
          to: to.toISOString(),
          tickers: watchlist,
        })
      : [];

    const ctx = {
      date: todayStr,
      watchlist,
      watchlistEvents: watchlistEvents.slice(0, 25),
      macroToday: macroToday.slice(0, 15),
    };

    try {
      const result = await getGemini().models.generateContent({
        model: GEMINI_MODEL,
        contents: `Write today's brief.\n\nContext (JSON):\n${JSON.stringify(ctx)}`,
        config: { systemInstruction: SYSTEM, maxOutputTokens: 800, temperature: 0.4 },
      });
      const text = (result.text ?? "").trim();
      await admin.from("calendar_briefs").upsert(
        { user_id: userId, brief_date: todayStr, content: text },
        { onConflict: "user_id,brief_date" }
      );
      generated++;
    } catch {
      // skip user
    }
  }

  return NextResponse.json({ ok: true, users: users.length, generated });
}
