import { NextResponse, type NextRequest } from "next/server";
import { CLAUDE_MODEL, extractJson, getAnthropic } from "@/lib/anthropic";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getHistory, getTickerNews, getTickerSummary } from "@/lib/yahoo";
import {
  recommendationFromScore,
  type AiAnalysis,
  type Recommendation,
} from "@/lib/types";

export const runtime = "nodejs";

const CACHE_TTL_HOURS = 6;
const CACHE_TTL_MS = CACHE_TTL_HOURS * 60 * 60 * 1000;

function isRecommendation(x: unknown): x is Recommendation {
  return (
    x === "Strong Sell" ||
    x === "Sell" ||
    x === "Hold" ||
    x === "Buy" ||
    x === "Strong Buy"
  );
}

function toStringArray(x: unknown, min: number, max: number): string[] | null {
  if (!Array.isArray(x)) return null;
  const clean = x.filter((v): v is string => typeof v === "string" && v.length > 0);
  if (clean.length < min) return null;
  return clean.slice(0, max);
}

function validate(parsed: unknown): Omit<AiAnalysis, "generated_at" | "cached"> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  const score =
    typeof p.score === "number" && p.score >= 1 && p.score <= 10
      ? Math.round(p.score * 10) / 10
      : null;
  if (score == null) return null;

  const rec = isRecommendation(p.recommendation)
    ? (p.recommendation as Recommendation)
    : recommendationFromScore(score);

  const bull = toStringArray(p.bull_case, 1, 3);
  const bear = toStringArray(p.bear_case, 1, 3);
  const risks = toStringArray(p.key_risks, 1, 3);
  const summary = typeof p.summary === "string" ? p.summary : null;
  if (!bull || !bear || !risks || !summary) return null;

  return {
    score,
    recommendation: rec,
    bull_case: bull,
    bear_case: bear,
    key_risks: risks,
    summary,
  };
}

async function readCache(
  symbol: string
): Promise<AiAnalysis | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("ai_analyses_cache")
    .select("analysis, created_at")
    .eq("ticker", symbol)
    .maybeSingle();
  if (error || !data) return null;
  const created = new Date(data.created_at).getTime();
  if (Date.now() - created > CACHE_TTL_MS) return null;
  return {
    ...(data.analysis as Omit<AiAnalysis, "generated_at" | "cached">),
    generated_at: data.created_at,
    cached: true,
  };
}

async function writeCache(
  symbol: string,
  analysis: Omit<AiAnalysis, "generated_at" | "cached">
): Promise<string> {
  const admin = getSupabaseAdmin();
  const nowIso = new Date().toISOString();
  if (!admin) return nowIso;
  await admin.from("ai_analyses_cache").upsert(
    {
      ticker: symbol,
      analysis,
      created_at: nowIso,
    },
    { onConflict: "ticker" }
  );
  return nowIso;
}

async function buildContext(symbol: string) {
  const [summary, history, news] = await Promise.all([
    getTickerSummary(symbol),
    getHistory(symbol, "3M").catch(() => []),
    getTickerNews(symbol, 6).catch(() => []),
  ]);

  const first = history[0]?.c;
  const last = history[history.length - 1]?.c;
  const perfPct =
    first && last && first !== 0 ? ((last - first) / first) * 100 : null;

  return {
    quote: summary.quote,
    stats: summary.stats,
    profile: {
      sector: summary.profile.sector,
      industry: summary.profile.industry,
      description: summary.profile.description?.slice(0, 1200) ?? null,
    },
    financialsQuarterly: summary.financialsQuarterly,
    threeMonthPerformancePct: perfPct,
    recentHeadlines: news.map((n) => n.title).slice(0, 6),
  };
}

export async function POST(request: NextRequest) {
  let body: { symbol?: string; refresh?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const symbol = body.symbol?.toUpperCase().trim();
  if (!symbol || !/^[A-Z0-9.\-\^]{1,10}$/.test(symbol)) {
    return NextResponse.json({ error: "Invalid symbol" }, { status: 400 });
  }

  if (!body.refresh) {
    const cached = await readCache(symbol);
    if (cached) return NextResponse.json(cached);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  let context;
  try {
    context = await buildContext(symbol);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ticker not found";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const anthropic = getAnthropic();

  const system = `You are a dispassionate equity research assistant. Produce balanced, evidence-based analysis.
Never give outright financial advice; frame as educational analysis. Use the provided context only — do not invent specific numbers.
Respond ONLY with a single JSON object matching the requested schema. No markdown, no prose, no code fences.`;

  const userPrompt = `Analyze ${symbol}.
Return JSON with this exact shape:
{
  "score": number (1-10, where 1 = strong sell, 10 = strong buy),
  "recommendation": "Strong Sell" | "Sell" | "Hold" | "Buy" | "Strong Buy",
  "bull_case": [3 concise bullets, each <=18 words],
  "bear_case": [3 concise bullets, each <=18 words],
  "key_risks": [2 or 3 concise bullets, each <=18 words],
  "summary": "2-3 sentence thesis, neutral tone"
}

Context (JSON):
${JSON.stringify(context, null, 2)}`;

  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 900,
    temperature: 0.3,
    system,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = res.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    return NextResponse.json(
      { error: "AI returned malformed JSON" },
      { status: 502 }
    );
  }

  const validated = validate(parsed);
  if (!validated) {
    return NextResponse.json(
      { error: "AI response failed validation" },
      { status: 502 }
    );
  }

  const generated_at = await writeCache(symbol, validated);
  const payload: AiAnalysis = { ...validated, generated_at, cached: false };
  return NextResponse.json(payload);
}

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase().trim();
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  const cached = await readCache(symbol);
  if (cached) return NextResponse.json(cached);
  return NextResponse.json({ error: "No cached analysis" }, { status: 404 });
}
