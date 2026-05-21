"use client";

import { useEffect, useState } from "react";
import {
  Bitcoin,
  Briefcase,
  LineChart,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { MarketCard } from "@/components/dashboard/market-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TodayEventsStripe } from "@/components/calendar/today-stripe";
import { ThisWeekWidget } from "@/components/calendar/this-week-widget";
import type { LucideIcon } from "lucide-react";

type MarketEntry = {
  label: string;
  symbol: string;
  ySymbol: string;
  value: string;
  changePct: number;
  icon: LucideIcon;
  accent: string;
  href?: string;
};

const MARKET_CONFIG: Omit<MarketEntry, "value" | "changePct">[] = [
  {
    label: "S&P 500",
    symbol: "^GSPC",
    ySymbol: "^GSPC",
    icon: TrendingUp,
    accent: "",
    href: "/market-map?index=sp500",
  },
  {
    label: "Nasdaq",
    symbol: "^IXIC",
    ySymbol: "^IXIC",
    icon: LineChart,
    accent: "",
    href: "/market-map?index=nasdaq100",
  },
  {
    label: "Dow Jones",
    symbol: "^DJI",
    ySymbol: "^DJI",
    icon: TrendingUp,
    accent: "",
    href: "/market-map?index=dow30",
  },
  {
    label: "Bitcoin",
    symbol: "BTC-USD",
    ySymbol: "BTC-USD",
    icon: Bitcoin,
    accent: "",
    href: "/ticker/BTC-USD",
  },
];

function formatPrice(symbol: string, price: number | null): string {
  if (price == null) return "—";
  if (symbol === "BTC-USD") {
    return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [markets, setMarkets] = useState<MarketEntry[]>(
    MARKET_CONFIG.map((c) => ({ ...c, value: "—", changePct: 0 }))
  );
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/markets")
      .then((r) => r.json())
      .then(
        (json: {
          data?: { symbol: string; price: number | null; changePct: number | null }[];
        }) => {
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
        }
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      {/* Atmospheric backdrop */}
      <div
        className="bg-radial-fade pointer-events-none fixed inset-x-0 top-0 h-[40vh]"
        aria-hidden
      />

      <div className="mx-auto max-w-[1400px] space-y-8 px-4 py-6 md:space-y-12 md:px-8 md:py-14">
        {/* Today's events stripe */}
        <div className="rise-in">
          <TodayEventsStripe />
        </div>

        {/* Editorial masthead */}
        <header className="rise-in border-b border-border/60 pb-6 md:pb-8">
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between">
            <div>
              <p className="editorial-eyebrow text-muted-foreground">
                The morning edition
              </p>
              <h1 className="mt-2 font-display text-4xl font-medium tracking-tight sm:text-5xl md:mt-3 md:text-7xl">
                Welcome <span className="display-italic text-foreground/70">back.</span>
              </h1>
            </div>

            <div className="md:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground md:text-[11px]">
                {now ? formatDate(now) : ""}
              </p>
              <p className="mt-1 font-mono text-xl tabular-nums text-foreground/85 md:text-2xl">
                {now ? formatTime(now) : "—"}
                <span className="ml-2 inline-flex h-1.5 w-1.5 translate-y-[-3px] rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
              </p>
            </div>
          </div>
        </header>

        {/* Market overview */}
        <section className="rise-in" style={{ animationDelay: "100ms" }}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 md:mb-5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                01
              </span>
              <h2 className="font-display text-xl font-medium tracking-tight md:text-3xl">
                Market overview
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground md:text-[11px]">
              Live · 60s
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {markets.map((m, i) => (
              <div
                key={m.symbol}
                className="rise-in"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <MarketCard
                  label={m.label}
                  symbol={m.symbol}
                  value={loading ? "…" : m.value}
                  changePct={m.changePct}
                  icon={m.icon}
                  accent={m.accent}
                  href={m.href}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Week ahead */}
        <section className="rise-in" style={{ animationDelay: "300ms" }}>
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              02
            </span>
            <h2 className="font-display text-xl font-medium tracking-tight md:text-3xl">
              Calendar
            </h2>
          </div>
          <ThisWeekWidget />
        </section>

        {/* Modules */}
        <section className="rise-in" style={{ animationDelay: "380ms" }}>
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              03
            </span>
            <h2 className="font-display text-xl font-medium tracking-tight md:text-3xl">
              Your workspace
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
          </div>
        </section>

        {/* Quick actions */}
        <section className="rise-in" style={{ animationDelay: "500ms" }}>
          <div className="mb-5 flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              04
            </span>
            <h2 className="font-display text-xl font-medium tracking-tight md:text-3xl">
              Quick actions
            </h2>
          </div>
          <QuickActions />
        </section>
      </div>
    </div>
  );
}
