"use client";

import { useEffect, useState } from "react";
import { Bitcoin, Briefcase, LineChart, Newspaper, TrendingUp } from "lucide-react";
import { MarketCard } from "@/components/dashboard/market-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { QuickActions } from "@/components/dashboard/quick-actions";
import type { LucideIcon } from "lucide-react";

type MarketEntry = {
  label: string;
  symbol: string;         // display symbol
  ySymbol: string;        // yahoo finance symbol
  value: string;
  changePct: number;
  icon: LucideIcon;
  accent: string;
};

const MARKET_CONFIG: Omit<MarketEntry, "value" | "changePct">[] = [
  {
    label: "S&P 500",
    symbol: "SPX",
    ySymbol: "^GSPC",
    icon: TrendingUp,
    accent: "bg-[#10b981]/10 text-[#10b981] ring-[#10b981]/30",
  },
  {
    label: "Nasdaq",
    symbol: "IXIC",
    ySymbol: "^IXIC",
    icon: LineChart,
    accent: "bg-primary/10 text-primary ring-primary/30",
  },
  {
    label: "Dow Jones",
    symbol: "DJI",
    ySymbol: "^DJI",
    icon: TrendingUp,
    accent: "bg-[#ef4444]/10 text-[#ef4444] ring-[#ef4444]/30",
  },
  {
    label: "Bitcoin",
    symbol: "BTC",
    ySymbol: "BTC-USD",
    icon: Bitcoin,
    accent: "bg-amber-500/10 text-amber-500 ring-amber-500/30",
  },
];

function formatPrice(symbol: string, price: number | null): string {
  if (price == null) return "—";
  if (symbol === "BTC-USD") {
    return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const [markets, setMarkets] = useState<MarketEntry[]>(
    MARKET_CONFIG.map((c) => ({ ...c, value: "—", changePct: 0 }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then((json: { data?: { symbol: string; price: number | null; changePct: number | null }[] }) => {
        if (!json.data) return;
        setMarkets(
          MARKET_CONFIG.map((c) => {
            const q = json.data!.find((d) => d.symbol === c.ySymbol);
            return {
              ...c,
              value: formatPrice(c.ySymbol, q?.price ?? null),
              changePct: q?.changePct ?? 0,
            };
          })
        );
      })
      .catch(() => {/* keep placeholders on error */})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Overview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Welcome back.
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s a snapshot of the markets and your workspace today.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Market overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {markets.map((m) => (
            <MarketCard
              key={m.symbol}
              label={m.label}
              symbol={m.symbol}
              value={loading ? "…" : m.value}
              changePct={m.changePct}
              icon={m.icon}
              accent={m.accent}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EmptyState
          icon={Briefcase}
          title="Your Portfolio"
          description="Connect a brokerage or add holdings manually to see real-time performance."
          ctaLabel="Build a portfolio"
          ctaHref="/builder"
        />
        <EmptyState
          icon={Newspaper}
          title="Recent News"
          description="Top stories and catalysts tailored to your watchlist will appear here."
          ctaLabel="Browse news"
          ctaHref="/news"
        />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Quick actions
        </h2>
        <QuickActions />
      </section>
    </div>
  );
}
