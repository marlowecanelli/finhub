"use client";

import * as React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import {
  computeTotals,
  enrich,
  type EnrichedHolding,
  type Holding,
  type LiveQuote,
  type Portfolio,
} from "@/lib/portfolio";
import { PortfolioSummary } from "./portfolio-summary";
import { PerformanceChart } from "./performance-chart";
import { SectorDonut } from "./sector-donut";
import { GainersLosers } from "./gainers-losers";
import { HoldingsTable } from "./holdings-table";
import { HoldingFormDialog, type HoldingFormValues } from "./holding-form-dialog";
import { DeleteConfirm } from "./delete-confirm";
import { PortfolioEmpty } from "./empty-state";

const REFRESH_MS = 60_000;

type Props = {
  portfolio: Portfolio;
  initialHoldings: Holding[];
};

export function PortfolioClient({ portfolio, initialHoldings }: Props) {
  const [holdings, setHoldings] = React.useState<Holding[]>(initialHoldings);
  const [quotes, setQuotes] = React.useState<Record<string, LiveQuote>>({});
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Holding | null>(null);
  const [deleting, setDeleting] = React.useState<EnrichedHolding | null>(null);

  const symbols = React.useMemo(
    () =>
      Array.from(new Set(holdings.map((h) => h.ticker.toUpperCase()))).sort(),
    [holdings]
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
      setLastUpdated(new Date());
    } catch {
      // keep stale quotes on failure
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

  const enriched: EnrichedHolding[] = React.useMemo(
    () =>
      holdings.map((h) => enrich(h, quotes[h.ticker.toUpperCase()] ?? null)),
    [holdings, quotes]
  );

  const totals = React.useMemo(() => computeTotals(enriched), [enriched]);

  const positions = React.useMemo(
    () => enriched.map((h) => ({ symbol: h.ticker, shares: h.shares })),
    [enriched]
  );

  async function handleSave(values: HoldingFormValues) {
    const supabase = createClient();
    if (editing) {
      const { data, error } = await supabase
        .from("holdings")
        .update({
          shares: values.shares,
          cost_basis: values.cost_basis,
          purchase_date: values.purchase_date,
        })
        .eq("id", editing.id)
        .select()
        .single<Holding>();
      if (error) throw error;
      setHoldings((rows) => rows.map((r) => (r.id === data.id ? data : r)));
    } else {
      const { data, error } = await supabase
        .from("holdings")
        .insert({
          portfolio_id: portfolio.id,
          ticker: values.ticker,
          shares: values.shares,
          cost_basis: values.cost_basis,
          purchase_date: values.purchase_date,
        })
        .select()
        .single<Holding>();
      if (error) throw error;
      setHoldings((rows) => [...rows, data]);
    }
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("holdings")
      .delete()
      .eq("id", deleting.id);
    if (error) throw error;
    setHoldings((rows) => rows.filter((r) => r.id !== deleting.id));
  }

  const isEmpty = enriched.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Portfolio
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {portfolio.name}
          </h1>
          {lastUpdated && (
            <p className="mt-1 text-xs text-muted-foreground">
              Live · prices refresh every 60s · last updated{" "}
              {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchQuotes()}
            disabled={refreshing || symbols.length === 0}
            aria-label="Refresh prices"
          >
            <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add holding
          </Button>
        </div>
      </header>

      {isEmpty ? (
        <PortfolioEmpty
          onAdd={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <>
          <PortfolioSummary totals={totals} />

          <PerformanceChart positions={positions} baseValue={totals.totalValue} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <GainersLosers holdings={enriched} />
            </div>
            <SectorDonut holdings={enriched} />
          </div>

          <HoldingsTable
            rows={enriched}
            onEdit={(h) => {
              setEditing(h);
              setFormOpen(true);
            }}
            onDelete={(h) => setDeleting(h)}
          />
        </>
      )}

      <HoldingFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSave}
      />

      <DeleteConfirm
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        ticker={deleting?.ticker ?? null}
        onConfirm={handleDelete}
      />
    </div>
  );
}
