import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { GEMINI_MODEL, getGemini } from "@/lib/gemini";
import {
  fetchMarketSnapshot,
  type IndexSnapshot,
  type SectorSnapshot,
  type TopMover,
} from "@/lib/market-recap";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const SYSTEM = `You are a senior markets editor at a world-class financial publication.
Write a daily market recap in exactly three paragraphs. Be specific, authoritative, and insightful.
Use precise numbers from the data provided. No generic filler, no advice, no disclaimers.
Each paragraph should be 80–120 words. Plain prose only — no bullets, no headers, no markdown.`;

function formatPct(n: number | null): string {
  if (n === null) return "N/A";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function buildContext(
  date: string,
  indices: IndexSnapshot[],
  sectors: SectorSnapshot[],
  topMovers: TopMover[]
): string {
  const indexLines = indices
    .map((i) => `  ${i.label}: ${i.price?.toFixed(2) ?? "N/A"} (${formatPct(i.changePct)})`)
    .join("\n");

  const sectorLines = sectors
    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
    .map((s) => `  ${s.label}: ${formatPct(s.changePct)}`)
    .join("\n");

  const moverLines = topMovers
    .map((m) => `  ${m.symbol} (${m.name}): $${m.price.toFixed(2)} ${formatPct(m.changePct)}`)
    .join("\n");

  return `Date: ${date}

MAJOR INDICES:
${indexLines}

SECTOR PERFORMANCE (S&P sectors, best to worst):
${sectorLines}

BIGGEST MOVERS (S&P 500 sample, by absolute % change):
${moverLines}`;
}

const PARAGRAPH_PROMPT = `Write exactly three paragraphs separated by a blank line:

Paragraph 1 — WHAT MOVED: Describe the day's overall market action and the specific stocks, sectors, or assets that drove it. Cite exact index levels and percentage changes.

Paragraph 2 — WHY IT HAPPENED: Explain the macro, earnings, geopolitical, or sentiment drivers behind today's moves. Connect causes to effects clearly.

Paragraph 3 — WHAT TO WATCH TOMORROW: Name specific catalysts, economic releases, Fed speakers, earnings reports, or technical levels investors should monitor over the next 24 hours.

Respond with ONLY a JSON object in this exact format (no markdown fences):
{
  "headline": "...",
  "paragraph_movers": "...",
  "paragraph_why": "...",
  "paragraph_tomorrow": "..."
}`;

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

  const todayET = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const todayStr = todayET.toISOString().slice(0, 10);

  const dow = todayET.getDay();
  if (dow === 0 || dow === 6) {
    return NextResponse.json({ ok: true, skipped: "weekend" });
  }

  const { data: existing } = await admin
    .from("market_recaps")
    .select("id")
    .eq("recap_date", todayStr)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, skipped: "already_exists", date: todayStr });
  }

  const { indices, sectors, topMovers } = await fetchMarketSnapshot();
  const context = buildContext(todayStr, indices, sectors, topMovers);

  const result = await getGemini().models.generateContent({
    model: GEMINI_MODEL,
    contents: `${PARAGRAPH_PROMPT}\n\nMarket data:\n${context}`,
    config: { systemInstruction: SYSTEM, maxOutputTokens: 1200, temperature: 0.6, responseMimeType: "application/json" },
  });
  const raw = (result.text ?? "").trim();

  let parsed: {
    headline: string;
    paragraph_movers: string;
    paragraph_why: string;
    paragraph_tomorrow: string;
  };

  try {
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    return NextResponse.json({ error: "parse_failed", raw }, { status: 500 });
  }

  const { error: insertError } = await admin.from("market_recaps").insert({
    recap_date:          todayStr,
    headline:            parsed.headline,
    paragraph_movers:    parsed.paragraph_movers,
    paragraph_why:       parsed.paragraph_why,
    paragraph_tomorrow:  parsed.paragraph_tomorrow,
    indices_data:        indices,
    top_movers:          topMovers,
    sectors_data:        sectors,
    generated_at:        new Date().toISOString(),
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, date: todayStr, headline: parsed.headline });
}
