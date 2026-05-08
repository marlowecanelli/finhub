"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Props = { series: { t: number; v: number }[] };

type TooltipPayload = {
  active?: boolean;
  payload?: Array<{ payload: { t: number; sharpe: number } }>;
};

const formatMonth = (t: number): string =>
  new Date(t * 1000).toLocaleDateString("en-US", { month: "short", year: "2-digit" });

export function RollingSharpeChart({ series }: Props) {
  const data = series.map((p) => ({ t: p.t, sharpe: p.v }));
  const latest = series[series.length - 1]?.v ?? 0;
  const latestColor = latest >= 1 ? "text-[#10b981]" : latest >= 0 ? "text-foreground" : "text-destructive";

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-medium tracking-tight">Rolling Sharpe (60d)</h3>
          <p className="mt-1 text-xs text-muted-foreground">Risk-adjusted return on a moving 60-day window</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Current</p>
          <p className={"mt-0.5 font-mono text-base font-semibold tabular-nums " + latestColor}>{latest.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
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
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={36} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.4} strokeDasharray="2 2" />
            <ReferenceLine y={1} stroke="hsl(var(--primary))" strokeOpacity={0.3} strokeDasharray="2 4" />
            <Tooltip content={<RsTooltip />} />
            <Line type="monotone" dataKey="sharpe" stroke="hsl(var(--primary))" strokeWidth={1.75} dot={false} isAnimationActive animationDuration={700} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RsTooltip(props: TooltipPayload) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 p-2.5 text-xs shadow-xl backdrop-blur-xl">
      <p className="font-mono text-[10px] text-muted-foreground">
        {new Date(datum.t * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
      </p>
      <p className="mt-0.5 font-mono font-semibold text-primary">{datum.sharpe.toFixed(2)}</p>
    </div>
  );
}
