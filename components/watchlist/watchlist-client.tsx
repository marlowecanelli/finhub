"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Loader2, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { useToast } from "@/components/toast/toast-provider";
import { createClient } from "@/lib/supabase";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { LiveQuote } from "@/lib/portfolio";
import type { WatchlistItem } from "@/lib/watchlist";

const REFRESH_MS = 60_000;

type Props = { initialItems: WatchlistItem[] };

export function WatchlistClient({ initialItems }: Props) {
  const t = useToast();
  const [items, setItems] = React.useState<WatchlistItem[]>(initialItems);
  const [quotes, setQuotes] = React.useState<Record<string, LiveQuote>>({});
  const [refreshing, setRefreshing] = React.useState(false);

  const symbols = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.ticker.toUpperCase()))).sort(),
    [items]
  );
  const symbolsKey = symbols.join(",");

  const fetchQuotes = React.useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes({});
      return;
    }
    setRefreshing(true);
    try {
      const r = await fetch("/api/portfolio/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      const data = (await r.json()) as { quotes?: LiveQuote[] };
      const next: Record<string, LiveQuote> = {};
      for (const q of data.quotes ?? []) next[q.symbol.toUpperCase()] = q;
      setQuotes(next);
    } finally {
      setRefreshing(false);
    }
  }, [symbols]);

  React.useEffect(() => {
    void fetchQuotes();
    if (symbols.length === 0) return;
    const id = window.setInterval(() => void fetchQuotes(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [fetchQuotes, symbolsKey, symbols.length]);

  async function remove(item: WatchlistItem) {
    const prev = items;
    setItems((rows) => rows.filter((r) => r.id !== item.id));
    try {
      const sb = createClient();
      const { error } = await sb.from("watchlist_items").delete().eq("id", item.id);
      if (error) throw error;
      t.success("Removed", `${item.ticker} removed`);
    } catch (err) {
      setItems(prev);
      t.error("Couldn't remove", err instanceof Error ? err.message : "Try again");
    }
  }

  if (items.length === 0) return <Empty />;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Watchlist
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Tracked tickers
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.length} {items.length === 1 ? "ticker" : "tickers"} · prices refresh every 60s
          </p>
        </div>
        {refreshing && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> updating
          </span>
        )}
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const q = quotes[it.ticker.toUpperCase()];
          const price = q?.price ?? null;
          const prev = q?.previousClose ?? null;
          const changePct = price != null && prev && prev > 0 ? ((price - prev) / prev) * 100 : null;
          const up = (changePct ?? 0) >= 0;
          return (
            <li key={it.id}>
              <Link
                href={`/ticker/${encodeURIComponent(it.ticker)}`}
                className="glass glass-hover group flex h-full flex-col gap-3 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-base font-semibold">{it.ticker}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {q?.name ?? "—"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void remove(it);
                    }}
                    aria-label={`Remove ${it.ticker}`}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-end justify-between">
                  <div className="font-mono text-xl font-semibold">
                    {price == null ? (
                      <Skeleton className="h-6 w-20" />
                    ) : (
                      <AnimatedNumber value={price} format={(n) => formatCurrency(n)} />
                    )}
                  </div>
                  {changePct != null && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-xs font-medium",
                        up ? "text-[#10b981]" : "text-[#ef4444]"
                      )}
                    >
                      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {formatPercent(changePct)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Empty() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30">
        <Star className="h-5 w-5" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">No tickers yet</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Star any ticker (top of a deep-dive page) to start tracking it here.
      </p>
      <Button asChild className="mt-6">
        <Link href="/screener">Find tickers in the screener</Link>
      </Button>
    </div>
  );
}
