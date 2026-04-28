"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { HistoryPoint, Timeframe } from "@/lib/yahoo";

const TIMEFRAMES: Timeframe[] = ["1D", "5D", "1M", "3M", "1Y", "5Y", "All"];

type Props = {
  symbol: string;
  currency: string;
  initialTimeframe?: Timeframe;
};

export function PriceChart({
  symbol,
  currency,
  initialTimeframe = "1M",
}: Props) {
  const [tf, setTf] = useState<Timeframe>(initialTimeframe);
  const [points, setPoints] = useState<HistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setPoints(null);
    setError(null);
    fetch(`/api/ticker/${encodeURIComponent(symbol)}/history?tf=${tf}`)
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.error) {
          setError(data.error);
          setPoints([]);
        } else {
          setPoints(data.points ?? []);
        }
      })
      .catch(() => {
        if (alive) {
          setError("Failed to load chart");
          setPoints([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [symbol, tf]);

  const up = useMemo(() => {
    if (!points || points.length < 2) return true;
    return (points[points.length - 1]!.c ?? 0) >= (points[0]!.c ?? 0);
  }, [points]);

  const changeInfo = useMemo(() => {
    if (!points || points.length < 2) return null;
    const first = points[0]!.c ?? 0;
    const last = points[points.length - 1]!.c ?? 0;
    const change = last - first;
    const pct = first !== 0 ? (change / first) * 100 : 0;
    return { change, pct };
  }, [points]);

  const stroke = up ? "hsl(156 100% 60%)" : "hsl(348 95% 65%)";

  return (
    <div className="card-edge relative overflow-hidden rounded-xl border border-border/80 bg-card/40 p-5 backdrop-blur-xl md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Section
          </span>
          <h2 className="font-display text-xl font-medium tracking-tight">
            Price history
          </h2>
          {changeInfo && (
            <span
              className={cn(
                "font-mono text-sm font-semibold tabular-nums",
                up ? "text-emerald-400" : "text-rose-400"
              )}
            >
              {changeInfo.change >= 0 ? "+" : ""}
              {formatCurrency(changeInfo.change, currency)}{" "}
              ({formatPercent(changeInfo.pct)})
            </span>
          )}
        </div>
        <div className="inline-flex rounded-md border border-border/80 bg-background/50 p-0.5">
          {TIMEFRAMES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setTf(label)}
              className={cn(
                "relative rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                tf === label
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={tf === label}
            >
              {tf === label && (
                <motion.span
                  layoutId="chart-tf"
                  className="absolute inset-0 rounded-sm bg-foreground/[0.08] ring-1 ring-inset ring-foreground/[0.1]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative font-mono tabular-nums">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-[320px] w-full">
        {points === null ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {error ?? "No data available for this timeframe."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`price-fill-${symbol}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                tickFormatter={(t) => formatTick(t, tf)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                dataKey="c"
                domain={["auto", "auto"]}
                orientation="right"
                tickFormatter={(v: number) => v.toFixed(v >= 100 ? 0 : 2)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                cursor={{ stroke: "hsl(var(--muted-foreground) / 0.4)", strokeWidth: 1 }}
                content={<ChartTooltip currency={currency} />}
              />
              <Area
                type="monotone"
                dataKey="c"
                stroke={stroke}
                strokeWidth={2}
                fill={`url(#price-fill-${symbol})`}
                isAnimationActive
                animationDuration={1200}
                style={{
                  filter: `drop-shadow(0 0 6px ${stroke}88)`,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatTick(t: number, tf: Timeframe): string {
  const d = new Date(t * 1000);
  if (tf === "1D") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (tf === "5D" || tf === "1M") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (tf === "3M" || tf === "1Y") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function ChartTooltip({
  active,
  payload,
  currency,
}: TooltipProps<number, string> & { currency: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]!;
  const datum = p.payload as HistoryPoint;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-muted-foreground">
        {new Date(datum.t * 1000).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold">
        {formatCurrency(datum.c, currency)}
      </p>
    </div>
  );
}
