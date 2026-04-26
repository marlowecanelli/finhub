"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AssetAllocation } from "@/lib/builder";

const COLORS: Record<keyof AssetAllocation, string> = {
  stocks: "#3b82f6",
  bonds: "#10b981",
  alternatives: "#f59e0b",
  cash: "#8b5cf6",
};

const LABELS: Record<keyof AssetAllocation, string> = {
  stocks: "Stocks",
  bonds: "Bonds",
  alternatives: "Alternatives",
  cash: "Cash",
};

type Props = { allocation: AssetAllocation };

export function AllocationPie({ allocation }: Props) {
  const data = (Object.entries(allocation) as [keyof AssetAllocation, number][])
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: LABELS[k], value: v, color: COLORS[k] }));

  return (
    <div className="glass flex h-full flex-col p-5 md:p-6">
      <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
        Asset allocation
      </h3>
      <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-center">
        <div className="h-[200px] w-full md:h-[220px] md:w-[220px] md:shrink-0">
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
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]!.payload as { name: string; value: number; color: string };
                  return (
                    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-muted-foreground">{p.value}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-3 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: d.color }}
              />
              <span className="flex-1 text-foreground/90">{d.name}</span>
              <span className="font-mono text-xs font-medium">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
