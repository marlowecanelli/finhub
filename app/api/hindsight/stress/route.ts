import { NextResponse } from "next/server";
import { fetchBenchmark, fetchHistorical } from "@/lib/hindsight/data";
import { calcStress, type HoldingPrices } from "@/lib/hindsight/calc";
import { getScenario, SCENARIOS } from "@/lib/hindsight/scenarios";
import type { Holding, Scenario } from "@/lib/hindsight/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  holdings: Holding[];
  scenarios: string[]; // scenario keys, or [{key,start,end}] for custom
  custom?: { start: string; end: string }; // for "custom" scenario key
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { holdings, scenarios } = body;
  if (!holdings?.length || !scenarios?.length) {
    return NextResponse.json({ error: "Need holdings and scenarios" }, { status: 400 });
  }

  // Normalize weights
  const total = holdings.reduce((s, h) => s + h.weight, 0);
  const norm = holdings.map((h) => ({ ...h, weight: h.weight / total }));

  const today = new Date();

  const results = await Promise.all(
    scenarios.map(async (key) => {
      let scenario: Scenario | undefined =
        key === "custom" && body.custom
          ? {
              key: "custom" as const,
              name: "Custom range",
              start: body.custom.start,
              end: body.custom.end,
              teaser: "User-defined window.",
              narrative: "A custom historical range you chose to evaluate.",
              keyEvents: [],
            }
          : getScenario(key);
      if (!scenario) return null;

      const from = new Date(`${scenario.start}T00:00:00Z`);
      const to = new Date(`${scenario.end}T00:00:00Z`);

      const holdingPrices: HoldingPrices[] = await Promise.all(
        norm.map(async (h) => {
          const [scenarioPrices, recoveryPrices] = await Promise.all([
            fetchHistorical(h.ticker, from, to),
            fetchHistorical(h.ticker, from, today),
          ]);
          return {
            ticker: h.ticker,
            weight: h.weight,
            prices: scenarioPrices,
            recoveryPrices,
          };
        })
      );

      const benchmark = await fetchBenchmark(from, today);
      return calcStress(scenario, holdingPrices, benchmark);
    })
  );

  return NextResponse.json({
    results: results.filter(Boolean),
    availableScenarios: SCENARIOS,
  });
}
