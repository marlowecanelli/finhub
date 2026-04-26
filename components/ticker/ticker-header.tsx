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

  return (
    <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {quote.exchange && (
            <span className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono uppercase tracking-wider">
              {quote.exchange}
            </span>
          )}
          {quote.marketState && (
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  quote.marketState === "REGULAR"
                    ? "bg-[#10b981] shadow-[0_0_8px_#10b981]"
                    : "bg-muted-foreground"
                )}
              />
              {quote.marketState === "REGULAR" ? "Market open" : quote.marketState}
            </span>
          )}
        </div>
        <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight md:text-3xl">
          {quote.name}
        </h1>
        <p className="mt-0.5 font-mono text-sm text-muted-foreground">
          {quote.symbol}
        </p>
        <div className="mt-5 flex items-baseline gap-3">
          <AnimatedNumber
            value={quote.price}
            format={(n) => formatCurrency(n, quote.currency)}
            className="text-4xl font-semibold tracking-tight md:text-5xl"
          />
          <AnimatePresence mode="wait">
            <motion.span
              key={quote.changePercent}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-sm font-medium",
                up
                  ? "bg-[#10b981]/10 text-[#10b981] ring-1 ring-inset ring-[#10b981]/25"
                  : "bg-[#ef4444]/10 text-[#ef4444] ring-1 ring-inset ring-[#ef4444]/25"
              )}
            >
              {up ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {quote.change != null && (
                <>{up ? "+" : ""}{quote.change.toFixed(2)}</>
              )}
              {quote.changePercent != null && (
                <span className="opacity-70">
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
          variant={inPortfolio ? "default" : "glass"}
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
