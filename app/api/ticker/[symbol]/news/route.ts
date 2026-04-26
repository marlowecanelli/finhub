import { NextResponse, type NextRequest } from "next/server";
import { getAnthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { getTickerNews, type TickerNewsItem } from "@/lib/yahoo";

export const runtime = "nodejs";

type SummarizedItem = TickerNewsItem & { summary: string | null };

async function summarizeHeadlines(
  symbol: string,
  items: TickerNewsItem[]
): Promise<Record<string, string>> {
  if (!process.env.ANTHROPIC_API_KEY || items.length === 0) return {};

  const listing = items
    .map((n, i) => `${i + 1}. [${n.uuid}] ${n.title}`)
    .join("\n");

  const prompt = `You will receive ${items.length} news headlines about the stock ${symbol}.
For each, write a single neutral, factual sentence (<=22 words) summarizing what a reader would learn.
Return ONLY a JSON object mapping uuid -> summary. No prose, no markdown fences.

Headlines:
${listing}`;

  try {
    const anthropic = getAnthropic();
    const res = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content
      .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
      .map((b) => b.text)
      .join("");
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = fence?.[1]?.trim() ?? text.trim();
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed;
  } catch {
    return {};
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const symbol = params.symbol.toUpperCase();
  try {
    const items = await getTickerNews(symbol, 10);
    const summaries = await summarizeHeadlines(symbol, items);
    const enriched: SummarizedItem[] = items.map((n) => ({
      ...n,
      summary: summaries[n.uuid] ?? null,
    }));
    return NextResponse.json(
      { symbol, items: enriched },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1800" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "News failed";
    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}
