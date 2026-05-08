import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { CLAUDE_MODEL, getAnthropic } from "@/lib/anthropic";
import { getWatchlistTickers, listEvents } from "@/lib/calendar/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SYSTEM = `You are an editor at a markets desk writing a tight, calm,
non-hyped morning briefing for a retail investor. Use plain English. No emoji.
No advice. Reference specific events by name. 4 short paragraphs, ~80 words each.
Order: (1) The single most important event of the day and why; (2) Earnings to
watch on the user's watchlist; (3) Macro and policy data due; (4) One sentence
on what would surprise the market.`;

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth required" }, { status: 401 });

  const today = new Date();
  const todayStr = ymd(today);

  // Cache lookup
  const admin = getSupabaseAdmin();
  if (admin && !request.nextUrl.searchParams.get("refresh")) {
    const { data: cached } = await admin
      .from("calendar_briefs")
      .select("content, created_at")
      .eq("user_id", user.id)
      .eq("brief_date", todayStr)
      .maybeSingle();
    if (cached) {
      return NextResponse.json({ data: { content: cached.content, generated_at: cached.created_at, cached: true } });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const from = new Date(today); from.setHours(0, 0, 0, 0);
  const to = new Date(today); to.setHours(23, 59, 59, 999);

  const watchlist = await getWatchlistTickers(supabase, user.id);
  const watchlistEvents = watchlist.length
    ? await listEvents(supabase, { from: from.toISOString(), to: to.toISOString(), tickers: watchlist })
    : [];
  const macroToday = await listEvents(supabase, {
    from: from.toISOString(),
    to: to.toISOString(),
    types: ["economic"],
    importance: ["high", "critical"],
  });

  const ctx = {
    date: todayStr,
    watchlist,
    watchlistEvents: watchlistEvents.slice(0, 25).map((e) => ({
      ticker: e.ticker, type: e.event_type, title: e.title, time: e.event_date, timing: e.timing,
      meta: e.metadata,
    })),
    macroToday: macroToday.slice(0, 15).map((e) => ({
      title: e.title, time: e.event_date, importance: e.importance, meta: e.metadata,
    })),
  };

  let res;
  try {
    res = await getAnthropic().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.4,
      system: SYSTEM,
      messages: [
        { role: "user", content: `Write today's brief.\n\nContext (JSON):\n${JSON.stringify(ctx)}` },
      ],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "anthropic error" },
      { status: 502 }
    );
  }

  const text = res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  if (admin) {
    await admin.from("calendar_briefs").upsert(
      { user_id: user.id, brief_date: todayStr, content: text },
      { onConflict: "user_id,brief_date" }
    );
  }

  return NextResponse.json({ data: { content: text, generated_at: new Date().toISOString(), cached: false } });
}
