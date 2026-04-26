"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/portfolio";

const PALETTE = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
];

type Props = { holdings: EnrichedHolding[] };

type SliceData = { name: string; value: number };

export function SectorDonut({ holdings }: Props) {
  const totals = new Map<string, number>();
  for (const h of holdings) {
    const key = h.quote?.sector ?? "Unknown";
    totals.set(key, (totals.get(key) ?? 0) + h.marketValue);
  }
  const data: SliceData[] = Array.from(totals.entries())
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div className="glass flex h-full flex-col items-center justify-center p-6 text-sm text-muted-foreground">
        Add holdings to see sector breakdown.
      </div>
    );
  }

  return (
    <div className="glass flex h-full flex-col p-5 md:p-6">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        Sector allocation
      </h2>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="h-[180px] w-full md:h-[200px] md:w-[200px] md:shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius="60%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                isAnimationActive
                animationDuration={700}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]!.payload as SliceData;
                  const pct = total > 0 ? (d.value / total) * 100 : 0;
                  return (
                    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
                      <p className="font-medium">{d.name}</p>
                      <p className="mt-0.5 font-mono text-muted-foreground">
                        {formatCurrency(d.value)} · {pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((d, i) => {
            const pct = total > 0 ? (d.value / total) * 100 : 0;
            return (
              <li key={d.name} className="flex items-center gap-3 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-foreground/90">
                  {d.name}
                </span>
                <span className="font-mono text-xs font-medium">
                  {pct.toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
