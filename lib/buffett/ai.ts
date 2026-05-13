import { GEMINI_MODEL, getGemini, extractJson } from "@/lib/gemini";
import type { FundamentalsSnapshot, AiAssessment } from "./types";
import { stddev } from "./fundamentals";

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a rigorous, conservative value-investing analyst in the tradition of Benjamin Graham and Warren Buffett.

Your task is to score three dimensions of a business on a 0–10 scale:
1. Economic Moat — the durability and width of its competitive advantage
2. Business Predictability — how reliably the business model generates consistent results
3. Management Quality — how well management allocates capital and serves shareholders

CRITICAL CALIBRATION:
- Scores of 9–10 are extremely rare. Reserve them for once-in-a-generation businesses: Coca-Cola, See's Candies, American Express, GEICO.
- Most good businesses score 5–7. Most mediocre businesses score 3–5.
- Be specific: cite the data provided, not generic statements.
- Do not invent information. If data is insufficient, reflect that in the score.
- Never award a high score out of optimism or to avoid seeming harsh.

Respond ONLY with a single valid JSON object — no markdown, no code fences, no extra text.`;

// ── User prompt builder ───────────────────────────────────────────────────────

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

  const financialRows = recents
    .map(
      (a) =>
        `  ${a.year}: Revenue $${a.revenue != null ? (a.revenue / 1e9).toFixed(2) + "B" : "N/A"}` +
        ` · Net Income $${a.netIncome != null ? (a.netIncome / 1e9).toFixed(2) + "B" : "N/A"}` +
        ` · Gross Margin ${a.grossMargin != null ? (a.grossMargin * 100).toFixed(1) + "%" : "N/A"}` +
        ` · ROIC ${a.roic != null ? (a.roic * 100).toFixed(1) + "%" : "N/A"}` +
        ` · FCF $${a.fcf != null ? (a.fcf / 1e9).toFixed(2) + "B" : "N/A"}`
    )
    .join("\n");

  return `Analyze the following company and return a JSON object with this EXACT shape:
{
  "moat": { "score": <number 0-10>, "reasoning": "<2-4 sentences>" },
  "predictability": { "score": <number 0-10>, "reasoning": "<2-4 sentences>" },
  "management": { "score": <number 0-10>, "reasoning": "<2-4 sentences>" }
}

COMPANY: ${snap.companyName} (${snap.ticker})
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

QUANTITATIVE ANCHORS (factor these into your management score):
  Current ROIC: ${snap.roicCurrent != null ? (snap.roicCurrent * 100).toFixed(1) + "%" : "N/A"} (Buffett threshold: >12%)
  Insider ownership: ${snap.insiderOwnershipPct != null ? (snap.insiderOwnershipPct * 100).toFixed(1) + "%" : "N/A"} (threshold: >5%)
  Management score = 50% quantitative (ROIC + insider %) + 50% qualitative (narrative).`;
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateAssessment(parsed: unknown): AiAssessment | null {
  if (!parsed || typeof parsed !== "object") return null;
  const inp = parsed as Record<string, unknown>;

  function validateDim(key: string): { score: number; reasoning: string } | null {
    const dim = inp[key];
    if (!dim || typeof dim !== "object") return null;
    const d = dim as Record<string, unknown>;
    const score =
      typeof d.score === "number" && d.score >= 0 && d.score <= 10 ? d.score : null;
    const reasoning =
      typeof d.reasoning === "string" && d.reasoning.length > 0 ? d.reasoning : null;
    if (score == null || reasoning == null) return null;
    return { score, reasoning };
  }

  const moat = validateDim("moat");
  const predictability = validateDim("predictability");
  const management = validateDim("management");

  if (!moat || !predictability || !management) return null;
  return { moat, predictability, management };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function runAiAssessment(snap: FundamentalsSnapshot): Promise<AiAssessment | null> {
  const gemini = getGemini();
  const userPrompt = buildPrompt(snap);

  async function attempt(): Promise<AiAssessment | null> {
    const result = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1500,
        temperature: 0.3,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = result.text ?? "";
    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch {
      return null;
    }
    return validateAssessment(parsed);
  }

  try {
    const result = await attempt();
    if (result) return result;
    // Retry once on parse failure
    return await attempt();
  } catch {
    return null;
  }
}

export type { AiAssessment };
