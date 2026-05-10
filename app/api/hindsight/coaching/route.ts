import { GEMINI_MODEL, getGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  scenarioName: string;
  dateRange: string;
  drawdown: number;
  holdings: { ticker: string; weight: number }[];
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { scenarioName, dateRange, drawdown, holdings } = body;
  const holdingsLine = holdings
    .map((h) => `${h.ticker} (${(h.weight * 100).toFixed(1)}%)`)
    .join(", ");

  const prompt = `Given a portfolio of ${holdingsLine} and its performance during the ${scenarioName} (${dateRange}, total drawdown ${drawdown.toFixed(1)}%), write a three-paragraph coaching note.

Paragraph 1: what an investor holding this portfolio would have felt and the panic-driven mistakes they might have made.
Paragraph 2: what the historically right action would have been, with specifics.
Paragraph 3: what this teaches about their current portfolio composition.

Be direct, not preachy. Use no em dashes. Use commas, parentheses, periods, or "to" for ranges instead.`;

  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response("GOOGLE_AI_API_KEY not configured", { status: 503 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await getGemini().models.generateContentStream({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { maxOutputTokens: 1024, temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } },
        });
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk.text ?? ""));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n(Coaching unavailable: ${err instanceof Error ? err.message : "unknown error"})`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
