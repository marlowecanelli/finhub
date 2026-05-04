"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";
import { useMemo } from "react";

export type ChartSeries = {
  key: string;
  label: string;
  data: { date: string; value: number }[];
  color: string;
  /** "area" renders a filled gradient. "line" is a clean stroke. */
  variant?: "area" | "line";
  /** Make the line dashed (e.g. for "panic sold" comparison) */
  dashed?: boolean;
};

export type EventMarker = {
  date: string;
  label: string;
};

type Props = {
  series: ChartSeries[];
  events?: EventMarker[];
  height?: number;
  yPrefix?: string;
  accent: "gain" | "pain";
};

const ACCENT_HEX = {
  gain: "#c8a85a",
  pain: "#a8324a",
  benchmark: "#7c8aa3",
};

function formatTooltipDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatY(v: number, prefix: string) {
  if (Math.abs(v) >= 1_000_000)
    return `${prefix}${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${prefix}${(v / 1_000).toFixed(1)}k`;
  return `${prefix}${v.toFixed(0)}`;
}

export function HistoricalChart({
  series,
  events = [],
  height = 360,
  yPrefix = "$",
  accent,
}: Props) {
  // Merge series into a single rows-by-date dataset
  const merged = useMemo(() => {
    const dateSet = new Set<string>();
    for (const s of series) for (const p of s.data) dateSet.add(p.date);
    const dates = Array.from(dateSet).sort();
    const maps = series.map(
      (s) => new Map(s.data.map((p) => [p.date, p.value]))
    );
    return dates.map((d) => {
      const row: Record<string, string | number> = { date: d };
      series.forEach((s, i) => {
        const v = maps[i]?.get(d);
        if (v != null) row[s.key] = v;
      });
      return row;
    });
  }, [series]);

  if (!merged.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-white/5 bg-black/20 text-sm text-white/40"
        style={{ height }}
      >
        No data to chart.
      </div>
    );
  }

  const eventDates = new Set(events.map((e) => e.date));
  const lineAccent = ACCENT_HEX[accent];

  return (
    <div className="relative w-full">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={merged}
          margin={{ top: 16, right: 24, bottom: 24, left: 8 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`grad-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            stroke="#ffffff"
            strokeOpacity={0.04}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#ffffff60", fontSize: 11 }}
            tickFormatter={(d) => {
              const dt = new Date(d);
              return dt.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              });
            }}
            stroke="#ffffff10"
            minTickGap={48}
          />
          <YAxis
            tick={{ fill: "#ffffff60", fontSize: 11 }}
            tickFormatter={(v) => formatY(v, yPrefix)}
            stroke="#ffffff10"
            width={70}
            domain={["dataMin", "dataMax"]}
          />
          <Tooltip
            cursor={{ stroke: lineAccent, strokeOpacity: 0.3, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const evt = eventDates.has(String(label))
                ? events.find((e) => e.date === label)
                : null;
              return (
                <div className="rounded-md border border-white/10 bg-[#0a0c12]/95 p-3 shadow-2xl backdrop-blur-md">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-white/50">
                    {formatTooltipDate(String(label))}
                  </div>
                  {payload.map((p) => {
                    const s = series.find((x) => x.key === p.dataKey);
                    if (!s) return null;
                    return (
                      <div
                        key={p.dataKey as string}
                        className="flex items-center justify-between gap-6 text-sm"
                      >
                        <span className="flex items-center gap-2 text-white/70">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: s.color }}
                          />
                          {s.label}
                        </span>
                        <span
                          className="font-mono tabular-nums text-white"
                          style={{ color: s.color }}
                        >
                          {yPrefix}
                          {Number(p.value).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    );
                  })}
                  {evt && (
                    <div className="mt-2 border-t border-white/10 pt-2 text-[11px] italic text-white/60">
                      {evt.label}
                    </div>
                  )}
                </div>
              );
            }}
          />

          {events.map((e) => (
            <ReferenceLine
              key={e.date}
              x={e.date}
              stroke={lineAccent}
              strokeOpacity={0.35}
              strokeDasharray="3 3"
              label={{
                value: e.label,
                position: "insideTopRight",
                fill: "#ffffff70",
                fontSize: 10,
                style: { fontFamily: "var(--font-inter)" },
              }}
            />
          ))}

          {series.map((s) =>
            s.variant === "line" ? (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={1.5}
                strokeDasharray={s.dashed ? "5 4" : undefined}
                dot={false}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              />
            ) : (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
