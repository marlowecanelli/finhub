"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type Suggestion = {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
};

export function MobileSearch() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

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
        const res = await fetch(
          `/api/ticker/search?q=${encodeURIComponent(q)}`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // ignore
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
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/ticker/${encodeURIComponent(symbol.toUpperCase())}`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search tickers"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-2xl md:hidden"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) go(results[0].symbol);
                  else if (e.key === "Enter" && query.trim()) go(query.trim());
                }}
                placeholder="Search AAPL, BTC-USD…"
                className="h-11 w-full rounded-xl border border-border/60 bg-card/60 pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading && results.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            )}
            {!loading && query.trim().length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Quick search
                </p>
                <p className="mt-2 text-sm text-foreground/70">
                  Type a ticker symbol or company name.
                </p>
              </div>
            )}
            {!loading && query.trim().length > 0 && results.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground">
                No matches for &quot;{query}&quot;
              </div>
            )}
            {results.length > 0 && (
              <ul className="space-y-1">
                {results.map((r, i) => (
                  <li key={`${r.symbol}-${i}`}>
                    <button
                      type="button"
                      onClick={() => go(r.symbol)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent/10 active:bg-accent/20"
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
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {r.name}
                        </div>
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
          </div>
        </div>
      )}
    </>
  );
}
