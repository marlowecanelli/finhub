import { GEMINI_MODEL, getGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type HoldingInput = {
  ticker: string;
  shares: number;
  costBasis: number;
  marketValue: number;
  totalPL: number;
  totalPLPct: number;
  dayChangePct: number;
  sector: string | null;
  weight: number; // % of total portfolio
};

type Body = {
  holdings: HoldingInput[];
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPct: number;
};

function buildPrompt(body: Body): string {
  const { holdings, totalValue, totalCost, totalPL, totalPLPct } = body;

  const fmt = (n: number, dec = 1) => n.toFixed(dec);
  const fmtUsd = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${fmt(n)}%`;

  const sectorMap: Record<string, number> = {};
  for (const h of holdings) {
    const s = h.sector ?? "Unknown";
    sectorMap[s] = (sectorMap[s] ?? 0) + h.marketValue;
  }
  const sectorLines = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([s, v]) => `  • ${s}: ${fmt((v / totalValue) * 100)}%`)
    .join("\n");

  const holdingLines = [...holdings]
    .sort((a, b) => b.weight - a.weight)
    .map(
      (h) =>
        `  • ${h.ticker}: ${h.shares} shares | weight ${fmt(h.weight)}% | cost ${fmtUsd(h.costBasis)}/sh | market value ${fmtUsd(h.marketValue)} | P&L ${fmtPct(h.totalPLPct)} (${fmtUsd(h.totalPL)}) | sector: ${h.sector ?? "Unknown"}`
    )
    .join("\n");

  const top3Weight = [...holdings]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .reduce((s, h) => s + h.weight, 0);

  const topSectorWeight =
    totalValue > 0
      ? (Math.max(...Object.values(sectorMap)) / totalValue) * 100
      : 0;

  const numHoldings = holdings.length;

  return `You are a sharp, candid portfolio analyst with a dry sense of humor. Analyze this investment portfolio and deliver a streaming "roast + praise" report. Be honest, specific, and entertaining — but always grounded in the data. Avoid generic platitudes. Use the exact numbers provided.

PORTFOLIO SUMMARY:
  Total Value: ${fmtUsd(totalValue)}
  Total Cost: ${fmtUsd(totalCost)}
  Total P&L: ${fmtUsd(totalPL)} (${fmtPct(totalPLPct)})
  Number of Holdings: ${numHoldings}
  Top-3 concentration: ${fmt(top3Weight)}% of portfolio
  Largest sector weight: ${fmt(topSectorWeight)}%

HOLDINGS (sorted by portfolio weight):
${holdingLines}

SECTOR BREAKDOWN:
${sectorLines}

Write your analysis using EXACTLY these section headers (no extra text before the first header):

## VERDICT
Give this portfolio an overall letter grade (A+ through F). Then write 2-3 sentences delivering the core verdict — be honest and direct. If it's good, say so. If it's a mess, say so. Reference the actual P&L and total value.

## CONCENTRATION RISK
Analyze the weight distribution. Is the top-3 concentration dangerous or reasonable? Call out any single position that's outsized. Use the actual percentages. If concentration is fine, give credit.

## SECTOR BIAS
Is this portfolio dangerously overweight one sector? Underweight another? Is it truly diversified or just spread across correlated assets? Be specific about which sectors and why it matters.

## WHAT'S DRAGGING YOU DOWN
Identify the underperformers — the positions with the worst P&L%. Be blunt. Reference specific tickers and their actual loss percentages. If everything is up, say so and explain why that might not be sustainable.

## BRIGHT SPOTS
Highlight what's actually working. Give genuine credit to the winners. Use specific P&L numbers. Explain what they're doing right.

## ACTION ITEMS
Give 3-5 concrete, specific recommendations based on THIS portfolio's data. Not generic advice — actual things to consider given these exact holdings, weights, and sector exposures. Each item on its own line starting with a number.

Keep each section 3-6 sentences. Be candid, intelligent, and specific. No disclaimers about "this is not financial advice" — keep the tone of an analyst giving a real opinion.`;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body.holdings || body.holdings.length === 0) {
    return new Response("No holdings provided", { status: 400 });
  }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response("GOOGLE_AI_API_KEY not configured", { status: 503 });
  }

  const prompt = buildPrompt(body);

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await getGemini().models.generateContentStream({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { maxOutputTokens: 2048, temperature: 0.7 },
        });
        for await (const chunk of stream) {
          controller.enqueue(encoder.encode(chunk.text ?? ""));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n(Analysis unavailable: ${err instanceof Error ? err.message : "unknown error"})`
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
