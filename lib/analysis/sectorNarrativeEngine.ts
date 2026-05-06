import type { SectorPerformance } from "@/lib/types/research";

const TEMPLATES: ((top2in: [string, string], top2out: [string, string]) => string)[] = [
  (i, o) => `${i[0]} and ${i[1]} led inflows this period, while ${o[0]} and ${o[1]} saw continued outflows — consistent with a risk-on positioning shift as investors rotate toward growth.`,
  (i, o) => `Institutional flows favored ${i[0]} and ${i[1]} while trimming ${o[0]} and ${o[1]}, suggesting cyclical rotation away from defensive positions.`,
  (i, o) => `${i[0]} and ${i[1]} attracted the most fresh capital this period. ${o[0]} and ${o[1]} bore the brunt of redemptions, a pattern consistent with late-cycle positioning.`,
  (i, o) => `The flow picture is clear: ${i[0]} and ${i[1]} are the preferred destinations, with ${o[0]} and ${o[1]} seeing persistent selling. Momentum is building in favor of growth over defensives.`,
  (i, o) => `Sector rotation continues. ${i[0]} and ${i[1]} absorbed the bulk of net inflows as managers increase cyclical exposure. ${o[0]} and ${o[1]} remain under distribution pressure.`,
  (i, o) => `This week's flow data reinforces the growth-over-value narrative: ${i[0]} and ${i[1]} dominate the leaderboard while ${o[0]} and ${o[1]} face headwinds from redemption pressure.`,
  (i, o) => `${i[0]} and ${i[1]} are the standout destinations for new money, reflecting optimism around rate cuts and economic resilience. ${o[0]} and ${o[1]} continue to struggle.`,
  (i, o) => `Net flow data shows concentrated bets on ${i[0]} and ${i[1]}, with ${o[0]} and ${o[1]} seeing the largest outflows. The breadth of this move suggests institutional conviction.`,
  (i, o) => `${i[0]} extended its inflow streak — increasingly the consensus positioning. ${i[1]} follows closely. ${o[0]} and ${o[1]} are the clearest consensus fades.`,
];

export function narrativeEngine(performances: SectorPerformance[]): string {
  const sorted = [...performances].sort((a, b) => b.netFlow - a.netFlow);
  const top2in  = sorted.slice(0, 2).map(p => p.etf.name);
  const top2out = sorted.slice(-2).map(p => p.etf.name);

  if (top2in.length < 2 || top2out.length < 2) return "Insufficient sector data to generate narrative.";

  const templateIdx = Math.floor(
    (top2in[0]!.charCodeAt(0) + top2in[1]!.charCodeAt(0)) % TEMPLATES.length
  );

  return TEMPLATES[templateIdx]!(top2in as [string, string], top2out as [string, string]);
}
