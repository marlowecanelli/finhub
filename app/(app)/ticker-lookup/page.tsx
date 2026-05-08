"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
};

const POPULAR = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "META", name: "Meta" },
  { symbol: "BTC-USD", name: "Bitcoin" },
];

export default function TickerLookupPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ticker/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setResults(data.results ?? []);
        setHighlight(0);
      } catch {
        // ignore aborts
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  const go = (symbol: string) => {
    router.push(`/ticker/${encodeURIComponent(symbol.toUpperCase())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[highlight];
      if (picked) go(picked.symbol);
      else if (query.trim()) go(query.trim());
    }
  };

  const showResults = query.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-inset ring-primary/25">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
          Ticker Lookup
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search any stock, ETF, or crypto for fundamentals, AI analysis, and news.
        </p>
      </motion.div>

      {/* Search input */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="AAPL, MSFT, BTC-USD…"
          className="h-14 w-full rounded-xl border border-border/70 bg-card/60 pl-11 pr-14 text-base text-foreground placeholder:text-muted-foreground/60 shadow-sm backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query.trim() ? (
            <button
              type="button"
              onClick={() => go(query.trim())}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Dropdown results */}
        <AnimatePresence>
          {showResults && (results.length > 0 || loading) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-xl"
            >
              {loading && results.length === 0 && (
                <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                </div>
              )}
              {!loading && results.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  No matches for &quot;{query}&quot; — press Enter to look it up directly.
                </div>
              )}
              {results.length > 0 && (
                <ul className="max-h-80 overflow-y-auto p-1.5">
                  {results.map((r, i) => (
                    <li key={`${r.symbol}-${i}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => go(r.symbol)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                          i === highlight ? "bg-accent/10" : "hover:bg-accent/10"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {r.symbol}
                            </span>
                            {r.exchange && (
                              <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                                {r.exchange}
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{r.name}</div>
                        </div>
                        {r.type && (
                          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {r.type}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Popular tickers */}
      {!showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="mt-10"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Popular
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR.map(({ symbol, name }) => (
              <button
                key={symbol}
                type="button"
                onClick={() => go(symbol)}
                className="group flex items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="font-mono text-xs font-semibold text-foreground">
                  {symbol}
                </span>
                <span className="text-xs text-muted-foreground">{name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
