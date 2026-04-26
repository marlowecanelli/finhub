"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/portfolio";

type Props = { holdings: EnrichedHolding[] };

export function GainersLosers({ holdings }: Props) {
  const sorted = [...holdings]
    .filter((h) => h.quote?.price != null)
    .sort((a, b) => b.dayChangePct - a.dayChangePct);
  const gainers = sorted.slice(0, 3);
  const losers = sorted.slice(-3).reverse();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card title="Top gainers (today)" rows={gainers} kind="up" />
      <Card title="Top losers (today)" rows={losers} kind="down" />
    </div>
  );
}

function Card({
  title,
  rows,
  kind,
}: {
  title: string;
  rows: EnrichedHolding[];
  kind: "up" | "down";
}) {
  const color = kind === "up" ? "text-[#10b981]" : "text-[#ef4444]";
  const Icon = kind === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="glass p-5">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No data yet.</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/ticker/${encodeURIComponent(r.ticker)}`}
                className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-accent/5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold">{r.ticker}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.quote?.name ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">
                    {formatCurrency(r.quote?.price ?? 0)}
                  </p>
                  <p
                    className={cn(
                      "inline-flex items-center gap-0.5 font-mono text-xs font-medium",
                      color
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {formatPercent(r.dayChangePct)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
