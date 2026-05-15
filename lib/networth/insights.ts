import type { Asset, Liability, Snapshot } from "./types";
import { ASSET_CATEGORY_META } from "./types";
import { trailingVelocity, totalAssetsOf, formatMonths } from "./utils";

export type Insight = {
  id: string;
  icon: string;
  headline: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
};

export function generateInsights(
  assets: Asset[],
  liabilities: Liability[],
  snapshots: Snapshot[],
  monthlyExpenses?: number
): Insight[] {
  const out: Insight[] = [];
  if (snapshots.length === 0) return out;
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  if (!latest) return out;

  // Velocity insight
  const v90 = trailingVelocity(sorted, 90);
  if (Math.abs(v90) > 1) {
    out.push({
      id: "velocity",
      icon: v90 >= 0 ? "📈" : "📉",
      headline:
        v90 >= 0
          ? `Your net worth is growing at $${Math.round(v90).toLocaleString()}/mo`
          : `Your net worth is declining at $${Math.round(Math.abs(v90)).toLocaleString()}/mo`,
      body:
        v90 >= 0
          ? "Trailing 90-day velocity. Keep the habit going."
          : "Trailing 90-day velocity. Consider trimming spend or boosting income.",
      tone: v90 >= 0 ? "positive" : "warning",
    });
  }

  // Six-figure pace
  if (latest.netWorth > 0 && latest.netWorth < 100_000 && v90 > 0) {
    const monthsTo100k = (100_000 - latest.netWorth) / v90;
    if (monthsTo100k > 0 && monthsTo100k < 240) {
      out.push({
        id: "six_figs_pace",
        icon: "🎯",
        headline: `At this pace you hit $100k in ${formatMonths(Math.ceil(monthsTo100k))}`,
        body: "Based on your trailing 90-day velocity.",
        tone: "positive",
      });
    }
  }

  // Credit card interest cost
  const ccs = liabilities.filter((l) => l.category === "creditCard" && !l.archived);
  for (const cc of ccs) {
    if (cc.interestRate && cc.balance > 0) {
      const monthlyInterest = (cc.interestRate / 12) * cc.balance;
      if (monthlyInterest > 5) {
        out.push({
          id: `cc_${cc.id}`,
          icon: "💳",
          headline: `${cc.name} costs you $${Math.round(monthlyInterest)}/mo in interest`,
          body: `Paying an extra $200/mo would save roughly $${Math.round(monthlyInterest * 6).toLocaleString()} this year.`,
          tone: "warning",
        });
      }
    }
  }

  // Allocation concentration
  const total = totalAssetsOf(assets);
  if (total > 0) {
    const byCat = new Map<string, number>();
    for (const a of assets.filter((x) => !x.archived)) {
      byCat.set(a.category, (byCat.get(a.category) ?? 0) + a.value);
    }
    let topCat = "";
    let topVal = 0;
    for (const [k, v] of byCat) {
      if (v > topVal) {
        topVal = v;
        topCat = k;
      }
    }
    const pct = (topVal / total) * 100;
    if (pct >= 40) {
      const meta = ASSET_CATEGORY_META[topCat as keyof typeof ASSET_CATEGORY_META];
      out.push({
        id: "concentration",
        icon: meta?.emoji ?? "⚖️",
        headline: `${meta?.label ?? topCat} is ${pct.toFixed(0)}% of your assets`,
        body: "Concentration risk. Consider diversifying across more categories.",
        tone: pct >= 60 ? "warning" : "neutral",
      });
    }
  }

  // Emergency fund
  if (monthlyExpenses && monthlyExpenses > 0) {
    const liquid = assets
      .filter((a) => !a.archived && a.isLiquid)
      .reduce((s, a) => s + a.value, 0);
    const months = liquid / monthlyExpenses;
    let tone: Insight["tone"] = "positive";
    if (months < 3) tone = "warning";
    else if (months < 6) tone = "neutral";
    out.push({
      id: "ef",
      icon: "🛟",
      headline: `Your liquid funds cover ${months.toFixed(1)} months of expenses`,
      body:
        months >= 6
          ? "Solid emergency fund. You're well covered."
          : months >= 3
          ? "Building. Aim for 6 months."
          : "Below recommended. Prioritize cash reserves.",
      tone,
    });
  }

  // Monthly change
  if (sorted.length >= 2) {
    const today = sorted[sorted.length - 1];
    const first = sorted[0];
    if (!today || !first) return out;
    const monthAgo = new Date(today.date);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const earlier =
      [...sorted].reverse().find((s) => s.date <= monthAgo.toISOString().slice(0, 10)) ??
      first;
    const delta = today.netWorth - earlier.netWorth;
    if (Math.abs(delta) > 100) {
      out.push({
        id: "monthly",
        icon: delta >= 0 ? "✨" : "⚠️",
        headline:
          delta >= 0
            ? `You grew $${Math.round(delta).toLocaleString()} in the last month`
            : `You dropped $${Math.abs(Math.round(delta)).toLocaleString()} in the last month`,
        body:
          delta >= 0
            ? "Momentum matters. Compounding works."
            : "Pullbacks happen. Stay focused on the long term.",
        tone: delta >= 0 ? "positive" : "neutral",
      });
    }
  }

  return out;
}
