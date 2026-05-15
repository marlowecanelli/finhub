import type { Liability } from "./types";

export type StrategyKey = "avalanche" | "snowball" | "minimum";

export type SimResult = {
  months: number;
  totalInterest: number;
  totalPaid: number;
  payoffByDate: Map<string, number>;
  payoffDateISO: string;
};

type LBal = { id: string; name: string; balance: number; rate: number; min: number };

export function simulateStrategy(
  liabilities: Liability[],
  strategy: StrategyKey,
  extraMonthly = 0,
  maxMonths = 600
): SimResult | null {
  const items: LBal[] = liabilities
    .filter((l) => !l.archived && l.balance > 0)
    .map((l) => ({
      id: l.id,
      name: l.name,
      balance: l.balance,
      rate: l.interestRate ?? 0,
      min: l.minimumPayment ?? 0,
    }));
  if (items.length === 0) return null;
  const totalMin = items.reduce((s, x) => s + x.min, 0);
  if (totalMin <= 0 && extraMonthly <= 0) return null;

  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const series = new Map<string, number>();
  const start = new Date();

  while (items.some((i) => i.balance > 0.01) && month < maxMonths) {
    // Accrue interest
    for (const i of items) {
      if (i.balance <= 0) continue;
      const interest = (i.rate / 12) * i.balance;
      i.balance += interest;
      totalInterest += interest;
    }
    // Pay minimums
    for (const i of items) {
      if (i.balance <= 0) continue;
      const pay = Math.min(i.min, i.balance);
      i.balance -= pay;
      totalPaid += pay;
    }
    // Apply extra to target by strategy
    let extra = extraMonthly;
    if (strategy !== "minimum" && extra > 0) {
      const sorted = [...items].filter((i) => i.balance > 0);
      if (strategy === "avalanche") sorted.sort((a, b) => b.rate - a.rate);
      else if (strategy === "snowball") sorted.sort((a, b) => a.balance - b.balance);
      for (const target of sorted) {
        if (extra <= 0) break;
        const pay = Math.min(extra, target.balance);
        target.balance -= pay;
        extra -= pay;
        totalPaid += pay;
      }
    }
    month++;
    const date = new Date(start);
    date.setMonth(date.getMonth() + month);
    const dateISO = date.toISOString().slice(0, 7);
    const remaining = items.reduce((s, x) => s + Math.max(x.balance, 0), 0);
    series.set(dateISO, remaining);
    if (remaining <= 0.01) break;
  }

  const payoffDate = new Date(start);
  payoffDate.setMonth(payoffDate.getMonth() + month);

  return {
    months: month,
    totalInterest: Math.round(totalInterest),
    totalPaid: Math.round(totalPaid),
    payoffByDate: series,
    payoffDateISO: payoffDate.toISOString().slice(0, 10),
  };
}
