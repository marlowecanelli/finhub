export type Goal = "retirement" | "house" | "wealth" | "short-term";
export type Horizon = "short" | "medium" | "long";
export type Experience = "beginner" | "intermediate" | "advanced";
export type TaxAccount = "taxable" | "ira" | "roth" | "401k";

export type BuilderAnswers = {
  goal: Goal | null;
  horizon: Horizon | null;
  riskLevel: number; // 1 (Conservative) — 5 (Aggressive)
  initialInvestment: number;
  monthlyContribution: number;
  preferences: {
    esg: boolean;
    dividend: boolean;
    growth: boolean;
    international: boolean;
    crypto: boolean;
    smallCap: boolean;
    realEstate: boolean;
    value: boolean;
  };
  taxAccount: TaxAccount | null;
  experience: Experience | null;
  customContext: string; // free-text additional context
};

export const DEFAULT_ANSWERS: BuilderAnswers = {
  goal: null,
  horizon: null,
  riskLevel: 3,
  initialInvestment: 10_000,
  monthlyContribution: 500,
  preferences: {
    esg: false,
    dividend: false,
    growth: false,
    international: false,
    crypto: false,
    smallCap: false,
    realEstate: false,
    value: false,
  },
  taxAccount: null,
  experience: null,
  customContext: "",
};

export const RISK_LABELS = [
  "Conservative",
  "Moderate-Conservative",
  "Moderate",
  "Moderate-Aggressive",
  "Aggressive",
] as const;

export const RISK_DRAWDOWNS = [
  { label: "Conservative", drawdown: "-5% to -10%", expected: "4–6%" },
  { label: "Moderate-Conservative", drawdown: "-10% to -20%", expected: "5–7%" },
  { label: "Moderate", drawdown: "-20% to -30%", expected: "6–8%" },
  { label: "Moderate-Aggressive", drawdown: "-30% to -40%", expected: "7–10%" },
  { label: "Aggressive", drawdown: "-40% to -55%", expected: "8–12%" },
] as const;

export type AssetAllocation = {
  stocks: number;
  bonds: number;
  alternatives: number;
  cash: number;
};

export type Pick = {
  ticker: string;
  name: string;
  allocation_percent: number;
  rationale: string;
};

export type BuilderRecommendation = {
  asset_allocation: AssetAllocation;
  etf_picks: Pick[];
  stock_picks: Pick[]; // empty unless aggressive
  expected_return_range: { low: number; high: number };
  risk_assessment: string;
  rebalance_frequency: string;
  portfolio_archetype: string; // e.g. "The Balanced Growth Investor"
  archetype_description: string; // 1 sentence
  generated_at: string; // ISO
};

export function isComplete(a: BuilderAnswers): boolean {
  return Boolean(
    a.goal &&
      a.horizon &&
      a.riskLevel >= 1 &&
      a.riskLevel <= 5 &&
      a.initialInvestment > 0 &&
      a.experience
  );
}

export function horizonYears(h: Horizon | null): number {
  switch (h) {
    case "short": return 3;
    case "medium": return 7;
    case "long": return 20;
    default: return 10;
  }
}

export function buildPrompt(a: BuilderAnswers): string {
  const prefList = Object.entries(a.preferences)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ") || "(none)";
  const aggressive = a.riskLevel >= 4;
  const taxNote = a.taxAccount
    ? `Tax account type: ${a.taxAccount}. ${
        a.taxAccount === "taxable"
          ? "Prefer tax-efficient funds (broad index ETFs, avoid high-turnover). Municipal bonds can help."
          : a.taxAccount === "ira" || a.taxAccount === "roth"
          ? "Tax-advantaged — REITs, high-yield bonds, and dividend payers are fine."
          : "401k — only recommend broad-market index ETFs."
      }`
    : "Tax account: not specified.";

  const customNote = a.customContext?.trim()
    ? `\nUser additional context: "${a.customContext.trim()}". Honor any specific requests or constraints they mention.`
    : "";

  return `You are an investment portfolio builder generating an educational sample allocation. The user provided this questionnaire:
- Goal: ${a.goal}
- Time horizon: ${a.horizon}
- Risk tolerance (1–5, 5=aggressive): ${a.riskLevel} (${RISK_LABELS[a.riskLevel - 1]})
- Initial investment: $${a.initialInvestment}
- Monthly contribution: $${a.monthlyContribution}
- Preferences: ${prefList}
- ${taxNote}
- Experience: ${a.experience}${customNote}

Produce a portfolio recommendation. Respond ONLY with JSON, no markdown fences, no prose. Use this exact shape:

{
  "asset_allocation": { "stocks": <int 0-100>, "bonds": <int 0-100>, "alternatives": <int 0-100>, "cash": <int 0-100> },
  "etf_picks": [
    { "ticker": "<US-listed ETF symbol>", "name": "<full name>", "allocation_percent": <int>, "rationale": "<1 sentence, <=22 words>" }
  ],
  "stock_picks": [${aggressive ? "...up to 4 individual stocks if aggressive" : ""}],
  "expected_return_range": { "low": <number>, "high": <number> },
  "risk_assessment": "<2-3 sentences in plain English>",
  "rebalance_frequency": "<e.g. 'Quarterly' or 'Annually'>",
  "portfolio_archetype": "<a creative 3-5 word label like 'The Steady Growth Builder' or 'The Aggressive Wealth Seeker'>",
  "archetype_description": "<1 sentence describing this investor profile>"
}

Rules:
- asset_allocation MUST sum to 100.
- etf_picks should be 4-7 broad ETFs. Honor user preferences:
  ESG → ESGV/ESGU/SUSL; dividend → SCHD/VYM; growth → VUG/QQQ; international → VXUS/VEU; crypto → up to 5% via IBIT/FBTC (aggressive only); smallCap → VB/VIOO; realEstate → VNQ/SCHH; value → VTV/VONV.
- ${aggressive ? "stock_picks: 0-4 large/mega-cap individual stocks. Each <= 5% of total." : "stock_picks: MUST be an empty array []."}
- The sum of allocation_percent across etf_picks + stock_picks should be ~100 (within ±2).
- expected_return_range: realistic annualized total return. Conservative ~4-6%, Aggressive ~8-12%.
- Use US-listed tickers only.
- Tone: factual, educational. No hype.
- portfolio_archetype: a short, memorable investor persona label.`;
}

export function validateRecommendation(parsed: unknown): BuilderRecommendation | null {
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;
  const aa = p.asset_allocation as AssetAllocation | undefined;
  if (
    !aa ||
    typeof aa.stocks !== "number" ||
    typeof aa.bonds !== "number" ||
    typeof aa.alternatives !== "number" ||
    typeof aa.cash !== "number"
  ) {
    return null;
  }
  const total = aa.stocks + aa.bonds + aa.alternatives + aa.cash;
  if (Math.abs(total - 100) > 2) return null;

  const cleanPicks = (raw: unknown): Pick[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x): Pick | null => {
        if (!x || typeof x !== "object") return null;
        const o = x as Record<string, unknown>;
        if (typeof o.ticker !== "string" || typeof o.name !== "string") return null;
        const pct = Number(o.allocation_percent);
        if (!Number.isFinite(pct) || pct <= 0) return null;
        return {
          ticker: o.ticker.toUpperCase().trim(),
          name: String(o.name).trim(),
          allocation_percent: Math.round(pct * 100) / 100,
          rationale: typeof o.rationale === "string" ? o.rationale.trim() : "",
        };
      })
      .filter((x): x is Pick => x !== null);
  };

  const etf_picks = cleanPicks(p.etf_picks);
  const stock_picks = cleanPicks(p.stock_picks);
  if (etf_picks.length === 0) return null;

  const range = p.expected_return_range as { low?: unknown; high?: unknown } | undefined;
  const low = Number(range?.low);
  const high = Number(range?.high);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;

  const risk_assessment =
    typeof p.risk_assessment === "string" ? p.risk_assessment.trim() : "";
  const rebalance_frequency =
    typeof p.rebalance_frequency === "string" ? p.rebalance_frequency.trim() : "Annually";
  if (!risk_assessment) return null;

  const portfolio_archetype =
    typeof p.portfolio_archetype === "string" && p.portfolio_archetype.trim()
      ? p.portfolio_archetype.trim()
      : "The Balanced Investor";
  const archetype_description =
    typeof p.archetype_description === "string" && p.archetype_description.trim()
      ? p.archetype_description.trim()
      : "";

  return {
    asset_allocation: {
      stocks: Math.round(aa.stocks),
      bonds: Math.round(aa.bonds),
      alternatives: Math.round(aa.alternatives),
      cash: Math.round(aa.cash),
    },
    etf_picks,
    stock_picks,
    expected_return_range: { low, high },
    risk_assessment,
    rebalance_frequency,
    portfolio_archetype,
    archetype_description,
    generated_at: new Date().toISOString(),
  };
}
