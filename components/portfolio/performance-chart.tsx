"use client";

import * as React from "react";
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
import { cn, formatCurrency } from "@/lib/utils";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "All"] as const;
type Tf = (typeof TIMEFRAMES)[number];

type Point = { t: number; v: number };
type Position = { symbol: string; shares: number };

type Props = { positions: Position[]; baseValue: number };

export function PerformanceChart({ positions, baseValue }: Props) {
  const [tf, setTf] = React.useState<Tf>("1M");
  const [points, setPoints] = React.useState<Point[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const positionsKey = React.useMemo(
    () => positions.map((p) => `${p.symbol}:${p.shares}`).sort().join("|"),
    [positions]
  );

  React.useEffect(() => {
    if (positions.length === 0) {
      setPoints([]);
      return;
    }
    let cancelled = false;
    setPoints(null);
    setError(null);
    fetch("/api/portfolio/performance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ positions, tf }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok) setError(data.error ?? "Failed");
        else setPoints((data.points as Point[]) ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      });
    return () => {
      cancelled = true;
    };
  }, [tf, positionsKey, positions]);

  const up = points && points.length > 1
    ? (points[points.length - 1]?.v ?? 0) >= (points[0]?.v ?? 0)
    : true;
  const stroke = up ? "#10b981" : "#ef4444";

  return (
    <div className="glass p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            Portfolio performance
          </h2>
          <p className="font-mono text-2xl font-semibold tracking-tight">
            {formatCurrency(baseValue)}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border/60 bg-background/50 p-0.5">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTf(t)}
              className={cn(
                "relative rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                tf === t
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={tf === t}
            >
              {tf === t && (
                <motion.span
                  layoutId="port-tf"
                  className="absolute inset-0 rounded-md bg-primary/15 ring-1 ring-inset ring-primary/30"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative font-mono">{t}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        {points === null ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {error ?? "Not enough data to plot performance yet."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="port-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="t"
                type="number"
                domain={["dataMin", "dataMax"]}
                scale="time"
                tickFormatter={(t: number) => formatTick(t, tf)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                minTickGap={48}
              />
              <YAxis
                domain={["auto", "auto"]}
                orientation="right"
                tickFormatter={(v: number) => formatCurrency(v).replace(".00", "")}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip cursor={{ stroke: "hsl(var(--muted-foreground) / 0.4)" }} content={<PerfTooltip tf={tf} />} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={stroke}
                strokeWidth={2}
                fill="url(#port-fill)"
                isAnimationActive
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatTick(t: number, tf: Tf): string {
  const d = new Date(t * 1000);
  if (tf === "1D")
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (tf === "1W" || tf === "1M" || tf === "3M")
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function PerfTooltip({
  active,
  payload,
  tf,
}: TooltipProps<number, string> & { tf: Tf }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload as Point;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="text-muted-foreground">
        {new Date(p.t * 1000).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: tf === "1D" || tf === "1W" ? "numeric" : undefined,
          minute: tf === "1D" || tf === "1W" ? "2-digit" : undefined,
        })}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold">{formatCurrency(p.v)}</p>
    </div>
  );
}
