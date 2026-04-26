"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/portfolio";

type Props = {
  rows: EnrichedHolding[];
  onEdit: (h: EnrichedHolding) => void;
  onDelete: (h: EnrichedHolding) => void;
};

export function HoldingsTable({ rows, onEdit, onDelete }: Props) {
  return (
    <section className="glass overflow-hidden">
      <div className="border-b border-border/60 px-5 py-4">
        <h2 className="text-sm font-semibold">Holdings</h2>
      </div>

      <DesktopTable rows={rows} onEdit={onEdit} onDelete={onDelete} />
      <MobileCards rows={rows} onEdit={onEdit} onDelete={onDelete} />
    </section>
  );
}

function DesktopTable({ rows, onEdit, onDelete }: Props) {
  const router = useRouter();
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3">Ticker</th>
            <th className="px-5 py-3 text-right">Shares</th>
            <th className="px-5 py-3 text-right">Cost Basis</th>
            <th className="px-5 py-3 text-right">Current Price</th>
            <th className="px-5 py-3 text-right">Market Value</th>
            <th className="px-5 py-3 text-right">Day Change</th>
            <th className="px-5 py-3 text-right">Total P/L</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((r) => {
            const dayUp = r.dayChange >= 0;
            const plUp = r.totalPL >= 0;
            return (
              <tr
                key={r.id}
                className="cursor-pointer transition-colors hover:bg-accent/5"
                onClick={() => router.push(`/ticker/${encodeURIComponent(r.ticker)}`)}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{r.ticker}</span>
                    {r.quote?.name && (
                      <span className="hidden truncate text-xs text-muted-foreground lg:inline">
                        {r.quote.name}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {r.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </td>
                <td className="px-5 py-3 text-right font-mono text-muted-foreground">
                  {formatCurrency(r.cost_basis)}
                </td>
                <td className="px-5 py-3 text-right font-mono">
                  {r.quote?.price != null ? (
                    <AnimatedNumber
                      value={r.quote.price}
                      format={(n) => formatCurrency(n)}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-5 py-3 text-right font-mono font-medium">
                  <AnimatedNumber
                    value={r.marketValue}
                    format={(n) => formatCurrency(n)}
                  />
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-mono",
                    dayUp ? "text-[#10b981]" : "text-[#ef4444]"
                  )}
                >
                  {dayUp ? "+" : ""}
                  {formatCurrency(r.dayChange)}
                  <div className="text-[11px] opacity-80">
                    {formatPercent(r.dayChangePct)}
                  </div>
                </td>
                <td
                  className={cn(
                    "px-5 py-3 text-right font-mono",
                    plUp ? "text-[#10b981]" : "text-[#ef4444]"
                  )}
                >
                  {plUp ? "+" : ""}
                  {formatCurrency(r.totalPL)}
                  <div className="text-[11px] opacity-80">
                    {formatPercent(r.totalPLPct)}
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <div
                    className="inline-flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(r)}
                      aria-label={`Edit ${r.ticker}`}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(r)}
                      aria-label={`Delete ${r.ticker}`}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({ rows, onEdit, onDelete }: Props) {
  const router = useRouter();
  return (
    <ul className="divide-y divide-border/60 md:hidden">
      {rows.map((r) => {
        const plUp = r.totalPL >= 0;
        const dayUp = r.dayChange >= 0;
        return (
          <li
            key={r.id}
            onClick={() => router.push(`/ticker/${encodeURIComponent(r.ticker)}`)}
            className="cursor-pointer space-y-3 p-4 transition-colors active:bg-accent/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-base font-semibold">{r.ticker}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.quote?.name ?? "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-base font-semibold">
                  <AnimatedNumber
                    value={r.marketValue}
                    format={(n) => formatCurrency(n)}
                  />
                </p>
                <p
                  className={cn(
                    "font-mono text-xs font-medium",
                    plUp ? "text-[#10b981]" : "text-[#ef4444]"
                  )}
                >
                  {plUp ? "+" : ""}
                  {formatCurrency(r.totalPL)} ({formatPercent(r.totalPLPct)})
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Stat label="Shares" value={r.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} />
              <Stat label="Cost" value={formatCurrency(r.cost_basis)} />
              <Stat
                label="Day"
                value={`${dayUp ? "+" : ""}${formatPercent(r.dayChangePct)}`}
                tone={dayUp ? "up" : "down"}
              />
            </div>
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" onClick={() => onEdit(r)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(r)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "font-mono text-xs font-medium",
          tone === "up" && "text-[#10b981]",
          tone === "down" && "text-[#ef4444]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
