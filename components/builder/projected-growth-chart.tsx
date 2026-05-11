"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { horizonYears } from "@/lib/builder";
import type { BuilderAnswers, BuilderRecommendation } from "@/lib/builder";

type DataPoint = {
  year: number;
  low: number;
  high: number;
  mid: number;
};

function buildProjection(
  initial: number,
  monthly: number,
  lowRate: number,
  highRate: number,
  years: number
): DataPoint[] {
  const points: DataPoint[] = [{ year: 0, low: initial, high: initial, mid: initial }];
  let low = initial;
  let high = initial;
  let mid = initial;
  const midRate = (lowRate + highRate) / 2;

  for (let y = 1; y <= years; y++) {
    const annualContrib = monthly * 12;
    low = low * (1 + lowRate) + annualContrib;
    high = high * (1 + highRate) + annualContrib;
    mid = mid * (1 + midRate) + annualContrib;
    points.push({
      year: y,
      low: Math.round(low),
      high: Math.round(high),
      mid: Math.round(mid),
    });
  }
  return points;
}

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

type Props = {
  answers: BuilderAnswers;
  recommendation: BuilderRecommendation;
};

export function ProjectedGrowthChart({ answers, recommendation }: Props) {
  const years = horizonYears(answers.horizon);
  const low = recommendation.expected_return_range.low / 100;
  const high = recommendation.expected_return_range.high / 100;
  const data = React.useMemo(
    () => buildProjection(answers.initialInvestment, answers.monthlyContribution, low, high, years),
    [answers.initialInvestment, answers.monthlyContribution, low, high, years]
  );

  const finalMid = data[data.length - 1]?.mid ?? 0;
  const finalHigh = data[data.length - 1]?.high ?? 0;
  const finalLow = data[data.length - 1]?.low ?? 0;
  const totalContributed = answers.initialInvestment + answers.monthlyContribution * 12 * years;

  return (
    <div className="glass p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Projected portfolio growth</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Based on {recommendation.expected_return_range.low}%–{recommendation.expected_return_range.high}% annualized return · {years}-year horizon
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-right">
          <Stat label="Low" value={fmt(finalLow)} color="text-muted-foreground" />
          <Stat label="Projected" value={fmt(finalMid)} color="text-primary" />
          <Stat label="High" value={fmt(finalHigh)} color="text-emerald-500" />
        </div>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.12} />
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.4)" vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => (v === 0 ? "Now" : `Yr ${v}`)}
              interval={Math.max(1, Math.floor(years / 5))}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => fmt(v)}
              width={52}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]!.payload as DataPoint;
                return (
                  <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-xl">
                    <p className="mb-1.5 font-medium text-foreground">
                      {label === 0 ? "Today" : `Year ${label as number}`}
                    </p>
                    <div className="space-y-1">
                      <Row label="High" value={fmt(d.high)} color="#10b981" />
                      <Row label="Projected" value={fmt(d.mid)} color="hsl(var(--primary))" />
                      <Row label="Low" value={fmt(d.low)} color="hsl(var(--muted-foreground))" />
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="high"
              stroke="#10b981"
              strokeWidth={1.5}
              fill="url(#gradHigh)"
              dot={false}
              strokeDasharray="4 2"
            />
            <Area
              type="monotone"
              dataKey="mid"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#gradMid)"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              fill="url(#gradLow)"
              dot={false}
              strokeDasharray="3 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/40 pt-4 sm:grid-cols-3">
        <InfoCell label="Total you invest" value={fmt(totalContributed)} />
        <InfoCell label="Projected gain" value={fmt(Math.max(0, finalMid - totalContributed))} accent />
        <InfoCell
          label="Return multiple"
          value={`${(finalMid / Math.max(1, totalContributed)).toFixed(1)}×`}
          accent
        />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </div>
  );
}

function InfoCell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-card/40 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
