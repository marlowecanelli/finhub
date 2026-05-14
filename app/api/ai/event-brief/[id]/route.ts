import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GEMINI_MODEL, getGemini } from "@/lib/gemini";
import { getEventById } from "@/lib/calendar/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You are an equity research assistant. Explain why an event
matters in 3 short bullet points. Plain English, no hype, no advice. Each
bullet under 22 words. Return only the 3 bullets, one per line, prefixed with "• ".`;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const event = await getEventById(supabase, params.id);
  if (!event) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (event.ai_brief) {
    return NextResponse.json({ data: { content: event.ai_brief, cached: true } });
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 503 });
  }

  const ctx = {
    type: event.event_type,
    ticker: event.ticker,
    title: event.title,
    when: event.event_date,
    timing: event.timing,
    importance: event.importance,
    meta: event.metadata,
  };

  let text: string;
  try {
    const result = await getGemini().models.generateContent({
      model: GEMINI_MODEL,
      contents: `Why does this matter?\n${JSON.stringify(ctx)}`,
      config: { systemInstruction: SYSTEM, maxOutputTokens: 512, temperature: 0.3 },
    });
    text = (result.text ?? "").trim();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "gemini error" },
      { status: 502 }
    );
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    await admin.from("calendar_events").update({ ai_brief: text }).eq("id", event.id);
  }

  return NextResponse.json({ data: { content: text, cached: false } });
}
