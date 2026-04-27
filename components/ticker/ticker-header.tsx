"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Briefcase, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";
import { AnimatedNumber } from "./animated-number";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { QuoteSnapshot } from "@/lib/yahoo";

export function TickerHeader({ quote }: { quote: QuoteSnapshot }) {
  const [inPortfolio, setInPortfolio] = useState(false);
  const up = (quote.changePercent ?? 0) >= 0;

  const signalColor = up ? "hsl(var(--signal))" : "hsl(348 95% 65%)";

  return (
    <header className="flex flex-col gap-6 border-b border-border/60 pb-8 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {quote.exchange && (
            <span className="rounded-sm border border-border/80 bg-card/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
              {quote.exchange}
            </span>
          )}
          {quote.marketState && (
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  quote.marketState === "REGULAR"
                    ? "animate-[signal-pulse_2.4s_ease-in-out_infinite] bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))]"
                    : "bg-muted-foreground"
                )}
              />
              {quote.marketState === "REGULAR" ? "Market open" : quote.marketState}
            </span>
          )}
        </div>
        <h1 className="mt-3 truncate font-display text-4xl font-medium tracking-tight md:text-6xl">
          {quote.name}
        </h1>
        <p className="mt-1 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
          {quote.symbol}
        </p>
        <div className="mt-6 flex flex-wrap items-baseline gap-4">
          <AnimatedNumber
            value={quote.price}
            format={(n) => formatCurrency(n, quote.currency)}
            className="font-mono text-5xl font-semibold tracking-tight tabular-nums md:text-6xl"
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={quote.changePercent}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="inline-flex items-center gap-1.5 font-mono text-base tabular-nums"
              style={{ color: signalColor }}
            >
              {up ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
              {quote.change != null && (
                <>{up ? "+" : ""}{quote.change.toFixed(2)}</>
              )}
              {quote.changePercent != null && (
                <span className="text-foreground/60">
                  ({formatPercent(quote.changePercent)})
                </span>
              )}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <WatchlistButton ticker={quote.symbol} size="sm" />
        <Button
          size="sm"
          variant={inPortfolio ? "default" : "outline"}
          onClick={() => setInPortfolio((p) => !p)}
          aria-pressed={inPortfolio}
        >
          {inPortfolio ? <Briefcase className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {inPortfolio ? "In Portfolio" : "Add to Portfolio"}
        </Button>
      </div>
    </header>
  );
}
