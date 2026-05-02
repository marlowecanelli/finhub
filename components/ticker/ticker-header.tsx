"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowDownRight, ArrowUpRight, Briefcase, Check, Plus, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";
import { AnimatedNumber } from "./animated-number";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { QuoteSnapshot } from "@/lib/yahoo";

function CompanyLogo({ symbol, website, name }: { symbol: string; website: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const domain = website
    ? website.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "")
    : null;
  const initials = symbol.slice(0, 2).toUpperCase();
  const hue = [...symbol].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  if (!domain || failed) {
    return (
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-mono text-lg font-bold text-white shadow-lg md:h-16 md:w-16"
        style={{ background: `hsl(${hue} 55% 42%)` }}
      >
        {initials}
      </div>
    );
  }
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-white shadow-lg md:h-16 md:w-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={name}
        className="h-full w-full object-contain p-2"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const handleShare = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);
  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="flex items-center gap-1.5 text-[hsl(var(--signal))]">
            <Check className="h-3.5 w-3.5" /> Copied
          </motion.span>
        ) : (
          <motion.span key="share" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="flex items-center gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

type LiveQuote = {
  price: number | null;
  change: number | null;
  changePercent: number | null;
  marketState: string | null;
};

type Props = { quote: QuoteSnapshot; website?: string | null };

export function TickerHeader({ quote, website }: Props) {
  const [inPortfolio, setInPortfolio] = useState(false);
  const [live, setLive] = useState<LiveQuote>({
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    marketState: quote.marketState,
  });
  const [updatedAt, setUpdatedAt] = useState<string>(
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
  );

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/ticker/${quote.symbol}/quote`, { cache: "no-store" });
        if (!res.ok) return;
        const data: LiveQuote = await res.json();
        if (!alive) return;
        setLive(data);
        setUpdatedAt(
          new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
        );
      } catch {
        // keep previous value on network error
      }
    };
    refresh();
    // Only poll during market hours — price doesn't change when closed
    if (quote.marketState === "REGULAR" || quote.marketState === "PRE" || quote.marketState === "POST") {
      const id = setInterval(refresh, 10000);
      return () => {
        alive = false;
        clearInterval(id);
      };
    }
    return () => { alive = false; };
  }, [quote.symbol, quote.marketState]);

  const up = (live.changePercent ?? 0) >= 0;
  const signalColor = up ? "hsl(var(--signal))" : "hsl(348 95% 65%)";

  return (
    <header className="glass relative overflow-hidden p-6 md:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ background: up ? "radial-gradient(ellipse at 80% 50%, hsl(156 100% 60%), transparent 65%)" : "radial-gradient(ellipse at 80% 50%, hsl(348 95% 65%), transparent 65%)" }}
      />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4 md:gap-5">
          <CompanyLogo symbol={quote.symbol} website={website ?? null} name={quote.name} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {quote.exchange && (
                <span className="rounded-sm border border-border/80 bg-card/60 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/70">
                  {quote.exchange}
                </span>
              )}
              {live.marketState && (
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className={cn("h-1.5 w-1.5 rounded-full", live.marketState === "REGULAR" ? "animate-[signal-pulse_2.4s_ease-in-out_infinite] bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))]" : "bg-muted-foreground/60")} />
                  {live.marketState === "REGULAR" ? "Market open" : live.marketState}
                </span>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-medium leading-tight tracking-tight md:text-4xl">
              {quote.name}
            </h1>
            <p className="mt-0.5 font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
              {quote.symbol}
            </p>
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <AnimatedNumber
                value={live.price}
                format={(n) => formatCurrency(n, quote.currency)}
                className="font-mono text-4xl font-semibold tracking-tight tabular-nums md:text-5xl"
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={live.changePercent}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="inline-flex items-center gap-1 font-mono text-base tabular-nums"
                  style={{ color: signalColor }}
                >
                  {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {live.change != null && <>{up ? "+" : ""}{live.change.toFixed(2)}</>}
                  {live.changePercent != null && (
                    <span className="text-foreground/60">({formatPercent(live.changePercent)})</span>
                  )}
                </motion.span>
              </AnimatePresence>
            </div>
            <p className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
              {live.marketState === "REGULAR" && (
                <span className="inline-flex items-center gap-1 text-[hsl(var(--signal))]">
                  <span className="h-1.5 w-1.5 animate-[signal-pulse_2.4s_ease-in-out_infinite] rounded-full bg-[hsl(var(--signal))] shadow-[0_0_6px_hsl(var(--signal))]" />
                  Live ·
                </span>
              )}
              Updated {updatedAt}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ShareButton />
          <WatchlistButton ticker={quote.symbol} size="sm" />
          <Button
            size="sm"
            variant={inPortfolio ? "default" : "outline"}
            onClick={() => setInPortfolio((p) => !p)}
            aria-pressed={inPortfolio}
            className="gap-1.5"
          >
            {inPortfolio ? <Briefcase className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {inPortfolio ? "In Portfolio" : "Add to Portfolio"}
          </Button>
        </div>
      </div>
    </header>
  );
}
