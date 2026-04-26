export type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type Holding = {
  id: string;
  portfolio_id: string;
  ticker: string;
  shares: number;
  cost_basis: number; // per-share
  purchase_date: string; // ISO date
  created_at: string;
};

export type LiveQuote = {
  symbol: string;
  name: string | null;
  price: number | null;
  previousClose: number | null;
  currency: string;
  sector: string | null;
};

export type EnrichedHolding = Holding & {
  quote: LiveQuote | null;
  marketValue: number; // price * shares
  costTotal: number; // cost_basis * shares
  totalPL: number;
  totalPLPct: number;
  dayChange: number; // (price - prevClose) * shares
  dayChangePct: number;
};

export function enrich(holding: Holding, quote: LiveQuote | null): EnrichedHolding {
  const price = quote?.price ?? holding.cost_basis;
  const prev = quote?.previousClose ?? price;
  const marketValue = price * holding.shares;
  const costTotal = holding.cost_basis * holding.shares;
  const totalPL = marketValue - costTotal;
  const totalPLPct = costTotal > 0 ? (totalPL / costTotal) * 100 : 0;
  const dayChange = (price - prev) * holding.shares;
  const dayChangePct = prev > 0 ? ((price - prev) / prev) * 100 : 0;
  return {
    ...holding,
    quote,
    marketValue,
    costTotal,
    totalPL,
    totalPLPct,
    dayChange,
    dayChangePct,
  };
}

export type PortfolioTotals = {
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPct: number;
  dayChange: number;
  dayChangePct: number;
};

export function computeTotals(rows: EnrichedHolding[]): PortfolioTotals {
  const totalValue = rows.reduce((s, r) => s + r.marketValue, 0);
  const totalCost = rows.reduce((s, r) => s + r.costTotal, 0);
  const dayChange = rows.reduce((s, r) => s + r.dayChange, 0);
  const startOfDayValue = totalValue - dayChange;
  return {
    totalValue,
    totalCost,
    totalPL: totalValue - totalCost,
    totalPLPct: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    dayChange,
    dayChangePct: startOfDayValue > 0 ? (dayChange / startOfDayValue) * 100 : 0,
  };
}
