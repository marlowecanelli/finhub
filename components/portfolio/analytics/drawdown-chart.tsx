"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = { series: { t: number; v: number }[]; maxDrawdown: number };

type TooltipPayload = {
  active?: boolean;
  payload?: Array<{ payload: { t: number; dd: number } }>;
};

const formatMonth = (t: number): string =>
  new Date(t * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

const formatPct = (v: number): string => v.toFixed(0) + "%";

export function DrawdownChart({ series, maxDrawdown }: Props) {
  const data = series.map((p) => ({ t: p.t, dd: p.v * 100 }));

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-medium tracking-tight">Underwater Chart</h3>
          <p className="mt-1 text-xs text-muted-foreground">Drawdown from running peak</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Max Drawdown</p>
          <p className="mt-0.5 font-mono text-base font-semibold tabular-nums text-destructive">
            {(maxDrawdown * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} opacity={0.4} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatMonth}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatPct}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<DDTooltip />} />
            <Area
              type="monotone"
              dataKey="dd"
              stroke="hsl(var(--destructive))"
              strokeWidth={1.5}
              fill="url(#ddGradient)"
              isAnimationActive
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DDTooltip(props: TooltipPayload) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 p-2.5 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-mono text-[10px] text-muted-foreground">
        {new Date(datum.t * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
      </p>
      <p className="mt-0.5 font-mono font-semibold text-destructive">{datum.dd.toFixed(2)}%</p>
    </div>
  );
}
