import type { CalendarEventInput } from "../types";

type Crypto = {
  date: string;
  title: string;
  asset: string;
  category: "halving" | "fork" | "unlock" | "upgrade";
  description: string;
  importance?: "high" | "medium" | "critical";
};

const CRYPTO: Crypto[] = [
  { date: "2028-04-20", title: "Bitcoin Halving (est.)", asset: "BTC", category: "halving", description: "Block reward halves from 3.125 to 1.5625 BTC. Historically a major price catalyst.", importance: "critical" },
  { date: "2026-05-15", title: "Ethereum Pectra Upgrade", asset: "ETH", category: "upgrade", description: "Network upgrade combining Prague + Electra; staking and account abstraction changes.", importance: "high" },
  { date: "2026-06-01", title: "ARB Token Unlock", asset: "ARB", category: "unlock", description: "Monthly Arbitrum token unlock event.", importance: "medium" },
  { date: "2026-07-01", title: "APT Token Unlock", asset: "APT", category: "unlock", description: "Monthly Aptos token unlock event.", importance: "medium" },
  { date: "2026-07-15", title: "OP Token Unlock", asset: "OP", category: "unlock", description: "Optimism scheduled monthly unlock.", importance: "medium" },
  { date: "2026-09-21", title: "SUI Token Unlock", asset: "SUI", category: "unlock", description: "Monthly Sui Foundation unlock.", importance: "medium" },
];

export function cryptoEvents(): CalendarEventInput[] {
  return CRYPTO.map((c) => ({
    event_type: "crypto",
    ticker: `${c.asset}-USD`,
    title: c.title,
    description: c.description,
    event_date: new Date(`${c.date}T12:00:00.000Z`).toISOString(),
    timing: "all_day",
    importance: c.importance ?? "medium",
    metadata: {
      kind: "crypto",
      asset: c.asset,
      category: c.category,
    },
    source: "seed:crypto",
    external_id: `crypto-${c.date}-${c.asset}-${c.category}`,
  }));
}
