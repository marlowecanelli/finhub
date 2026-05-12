import Anthropic from "@anthropic-ai/sdk";
import type { FundamentalsSnapshot, AiAssessment } from "./types";
import { stddev } from "./fundamentals";

const MODEL = "claude-opus-4-7";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

const ASSESSMENT_TOOL: Anthropic.Tool = {
  name: "submit_buffett_assessment",
  description:
    "Submit a structured Buffett assessment covering economic moat, business predictability, and management quality. Call this tool once with all three assessments.",
  input_schema: {
    type: "object" as const,
    required: ["moat", "predictability", "management"],
    properties: {
      moat: {
        type: "object" as const,
        required: ["score", "reasoning"],
        properties: {
          score: {
            type: "number" as const,
            description:
              "Economic moat score 0–10. A 9–10 requires exceptional durability (Coca-Cola, See's Candies tier). Most businesses score 3–7.",
          },
          reasoning: {
            type: "string" as const,
            description: "2–4 sentences explaining the moat score, citing specific competitive advantages or their absence.",
          },
        },
      },
      predictability: {
        type: "object" as const,
        required: ["score", "reasoning"],
        properties: {
          score: {
            type: "number" as const,
            description:
              "Business predictability score 0–10. High scores for consumer staples, insurance, simple franchises. Low scores for biotech, commodities, deep-cycle tech.",
          },
          reasoning: {
            type: "string" as const,
            description: "2–4 sentences explaining the predictability score, referencing sector dynamics and historical volatility.",
          },
        },
      },
      management: {
        type: "object" as const,
        required: ["score", "reasoning"],
        properties: {
          score: {
            type: "number" as const,
            description:
              "Management quality score 0–10, blended with quantitative ROIC and insider ownership. Reward candor, per-share focus, and disciplined capital allocation.",
          },
          reasoning: {
            type: "string" as const,
            description: "2–4 sentences evaluating management quality based on the business description, financials, and any available narrative.",
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are a rigorous, conservative value-investing analyst in the tradition of Benjamin Graham and Warren Buffett.

Your task is to score three dimensions of a business:
1. Economic Moat — the durability and width of its competitive advantage
2. Business Predictability — how reliably the business model generates consistent results
3. Management Quality — how well management allocates capital and serves shareholders

CRITICAL CALIBRATION:
- Scores of 9–10 are extremely rare. Reserve them for once-in-a-generation businesses: Coca-Cola, See's Candies, American Express, GEICO.
- Most good businesses score 5–7. Most mediocre businesses score 3–5.
- Be specific: cite the data provided, not generic statements.
- Do not invent information. If data is insufficient, reflect that in the score.
- Never award a high score out of optimism or to avoid seeming harsh.`;

function buildPrompt(snap: FundamentalsSnapshot): string {
  const recents = snap.annuals.slice(-5);

  const revenueGrowths = recents
    .slice(1)
    .map((a, i) => {
      const prev = recents[i]?.revenue;
      const curr = a.revenue;
      if (prev && curr && prev > 0) return ((curr - prev) / prev) * 100;
      return null;
    })
    .filter((v): v is number => v != null);

  const epsGrowths = recents
    .slice(1)
    .map((a, i) => {
      const prev = recents[i]?.eps;
      const curr = a.eps;
      if (prev != null && curr != null && Math.abs(prev) > 0.01) return curr - prev;
      return null;
    })
    .filter((v): v is number => v != null);

  const revVolatility = stddev(revenueGrowths);
  const epsVolatility = stddev(epsGrowths);

  const financialRows = recents.map((a) =>
    `  ${a.year}: Revenue $${a.revenue != null ? (a.revenue / 1e9).toFixed(2) + "B" : "N/A"} · Net Income $${a.netIncome != null ? (a.netIncome / 1e9).toFixed(2) + "B" : "N/A"} · Gross Margin ${a.grossMargin != null ? (a.grossMargin * 100).toFixed(1) + "%" : "N/A"} · ROIC ${a.roic != null ? (a.roic * 100).toFixed(1) + "%" : "N/A"} · FCF $${a.fcf != null ? (a.fcf / 1e9).toFixed(2) + "B" : "N/A"}`
  ).join("\n");

  return `COMPANY: ${snap.companyName} (${snap.ticker})
SECTOR: ${snap.sector}
INDUSTRY: ${snap.industry}

BUSINESS DESCRIPTION:
${snap.mdaExcerpt.slice(0, 3000)}

FIVE-YEAR FINANCIALS:
${financialRows}

VOLATILITY METRICS:
  Revenue growth std dev: ${revVolatility.toFixed(1)} percentage points
  EPS growth std dev: ${epsVolatility.toFixed(2)}

OWNERSHIP:
  Insider ownership: ${snap.insiderOwnershipPct != null ? (snap.insiderOwnershipPct * 100).toFixed(1) + "%" : "N/A"}
  Founder-led: ${snap.founderLed ? "Yes" : "No"}

QUANTITATIVE ANCHORS (already computed — factor these into your management score):
  Current ROIC: ${snap.roicCurrent != null ? (snap.roicCurrent * 100).toFixed(1) + "%" : "N/A"} (Buffett threshold: >12%)
  Insider ownership: ${snap.insiderOwnershipPct != null ? (snap.insiderOwnershipPct * 100).toFixed(1) + "%" : "N/A"} (threshold: >5%)
  Management score should be 50% quantitative (ROIC + insider %) + 50% qualitative (narrative assessment).

Now call submit_buffett_assessment with your scores and reasoning for all three dimensions.`;
}

function validateAssessment(input: unknown): AiAssessment | null {
  if (!input || typeof input !== "object") return null;
  const inp = input as Record<string, unknown>;

  function validateDim(key: string): { score: number; reasoning: string } | null {
    const dim = inp[key];
    if (!dim || typeof dim !== "object") return null;
    const d = dim as Record<string, unknown>;
    const score = typeof d.score === "number" && d.score >= 0 && d.score <= 10 ? d.score : null;
    const reasoning = typeof d.reasoning === "string" && d.reasoning.length > 0 ? d.reasoning : null;
    if (score == null || reasoning == null) return null;
    return { score, reasoning };
  }

  const moat = validateDim("moat");
  const predictability = validateDim("predictability");
  const management = validateDim("management");

  if (!moat || !predictability || !management) return null;
  return { moat, predictability, management };
}

export async function runAiAssessment(snap: FundamentalsSnapshot): Promise<AiAssessment | null> {
  const client = getClient();
  const userPrompt = buildPrompt(snap);

  async function attempt(): Promise<AiAssessment | null> {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tools: [ASSESSMENT_TOOL],
      tool_choice: { type: "any" },
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") return null;

    const validated = validateAssessment(toolBlock.input);
    return validated;
  }

  try {
    const result = await attempt();
    if (result) return result;
    // retry once
    return await attempt();
  } catch {
    return null;
  }
}

export type { AiAssessment };
