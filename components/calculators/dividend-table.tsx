"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { DividendYearRow } from "@/lib/calculators";

type Props = { rows: DividendYearRow[] };

export function DividendTable({ rows }: Props) {
  const [open, setOpen] = React.useState(false);
  if (rows.length === 0) return null;

  return (
    <div className="glass overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-accent/5"
        aria-expanded={open}
      >
        <div>
          <h3 className="text-sm font-semibold">Year-by-year breakdown</h3>
          <p className="text-xs text-muted-foreground">
            {rows.length} {rows.length === 1 ? "year" : "years"} · click to {open ? "hide" : "view"}
          </p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="overflow-x-auto border-t border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 text-left">Year</th>
                <th className="px-5 py-3 text-right">Contributions</th>
                <th className="px-5 py-3 text-right">Dividends (year)</th>
                <th className="px-5 py-3 text-right">Dividends (total)</th>
                <th className="px-5 py-3 text-right">Portfolio value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.year}>
                  <td className="px-5 py-2 font-mono">Y{r.year}</td>
                  <td className="px-5 py-2 text-right font-mono text-muted-foreground">
                    {formatCurrency(r.contributions)}
                  </td>
                  <td className="px-5 py-2 text-right font-mono text-[#10b981]">
                    +{formatCurrency(r.dividendsReceivedYear)}
                  </td>
                  <td className="px-5 py-2 text-right font-mono">
                    {formatCurrency(r.dividendsReceivedTotal)}
                  </td>
                  <td className="px-5 py-2 text-right font-mono font-semibold">
                    {formatCurrency(r.portfolioValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
