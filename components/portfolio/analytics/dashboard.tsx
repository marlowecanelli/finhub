"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsPosition, AnalyticsResponse } from "./types";
import { SummaryGrid } from "./summary-grid";
import { FactorPanel } from "./factor-panel";
import { TailRiskPanel } from "./tail-risk-panel";
import { DrawdownChart } from "./drawdown-chart";
import { RollingSharpeChart } from "./rolling-sharpe-chart";
import { CorrelationHeatmap } from "./correlation-heatmap";
import { RiskContribution } from "./risk-contribution";
import { PerAssetTable } from "./per-asset-table";
import { StressTestPanel } from "./stress-test-panel";

type Props = {
  /** Either market values (real portfolio) or % weights (builder allocation). */
  positions: AnalyticsPosition[];
  /** Optional title override. */
  title?: string;
};

export function AnalyticsDashboard({ positions, title = "Risk & Performance Analytics" }: Props) {
  const [data, setData] = React.useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const positionsKey = React.useMemo(
    () => positions.map((p) => `${p.symbol}:${p.value.toFixed(4)}`).sort().join(","),
    [positions]
  );

  const load = React.useCallback(async () => {
    if (positions.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/portfolio/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ positions }),
      });
      const json = await r.json();
      if (!r.ok) {
        setError(json.error ?? "Failed to compute analytics");
        setData(null);
      } else {
        setData(json as AnalyticsResponse);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [positions]);

  React.useEffect(() => {
    void load();
  }, [positionsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (positions.length === 0) {
    return null;
  }

  return (
    <section className="glass relative overflow-hidden p-6 md:p-8">
      {/* Decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(800px 280px at 100% 0%, hsl(var(--primary) / 0.08), transparent 60%), radial-gradient(600px 220px at 0% 100%, hsl(var(--signal) / 0.06), transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Section
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
                <Sparkles className="h-4 w-4 text-primary" />
                {title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {data
                  ? `${data.meta.sampleSize} trading days · benchmark ${data.meta.benchmark} · risk-free ${(data.meta.rfAnnual * 100).toFixed(2)}%`
                  : "Computing professional risk metrics from 5Y daily history"}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Recompute
          </Button>
        </div>

        {loading && !data && <DashboardSkeleton />}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Couldn&apos;t compute analytics</p>
              <p className="mt-0.5 text-xs opacity-80">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        )}

        {data && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            <SummaryGrid summary={data.summary} factor={data.factor} composition={data.composition} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <FactorPanel factor={data.factor} summary={data.summary} benchmark={data.meta.benchmark} ratesProxy={data.meta.ratesProxy} />
              <TailRiskPanel varStats={data.var} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DrawdownChart series={data.series.drawdown} maxDrawdown={data.summary.maxDrawdown} />
              <RollingSharpeChart series={data.series.rollingSharpe} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <CorrelationHeatmap
                  symbols={data.composition.symbols}
                  matrix={data.composition.correlationMatrix}
                />
              </div>
              <div className="lg:col-span-2">
                <RiskContribution
                  perAsset={data.perAsset}
                  diversificationRatio={data.composition.diversificationRatio}
                  effectiveBets={data.composition.effectiveBets}
                  herfindahl={data.composition.herfindahl}
                />
              </div>
            </div>

            <PerAssetTable rows={data.perAsset} />

            <StressTestPanel scenarios={data.stress} portfolioBeta={data.factor.beta} />

            {data.meta.droppedSymbols.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Note: insufficient history for {data.meta.droppedSymbols.join(", ")} — excluded from
                analysis.
              </p>
            )}
          </motion.div>
        )}

        {loading && data && (
          <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-card/80 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground ring-1 ring-inset ring-border/60">
            <Loader2 className="h-3 w-3 animate-spin" /> Updating
          </div>
        )}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
