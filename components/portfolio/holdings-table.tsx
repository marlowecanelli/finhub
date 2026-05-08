"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/portfolio";

type SortField =
  | "ticker"
  | "shares"
  | "cost_basis"
  | "price"
  | "marketValue"
  | "dayChange"
  | "dayChangePct"
  | "totalPL"
  | "totalPLPct";

type SortDir = "asc" | "desc";

type Props = {
  rows: EnrichedHolding[];
  onEdit: (h: EnrichedHolding) => void;
  onDelete: (h: EnrichedHolding) => void;
};

function sortRows(
  rows: EnrichedHolding[],
  field: SortField,
  dir: SortDir
): EnrichedHolding[] {
  const multiplier = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let va: string | number;
    let vb: string | number;
    switch (field) {
      case "ticker":
        return multiplier * a.ticker.localeCompare(b.ticker);
      case "shares":
        va = a.shares; vb = b.shares; break;
      case "cost_basis":
        va = a.cost_basis; vb = b.cost_basis; break;
      case "price":
        va = a.quote?.price ?? 0; vb = b.quote?.price ?? 0; break;
      case "marketValue":
        va = a.marketValue; vb = b.marketValue; break;
      case "dayChange":
        va = a.dayChange; vb = b.dayChange; break;
      case "dayChangePct":
        va = a.dayChangePct; vb = b.dayChangePct; break;
      case "totalPL":
        va = a.totalPL; vb = b.totalPL; break;
      case "totalPLPct":
        va = a.totalPLPct; vb = b.totalPLPct; break;
      default:
        return 0;
    }
    return multiplier * ((va as number) - (vb as number));
  });
}

const SORT_LABELS: Record<SortField, string> = {
  ticker: "Ticker (A–Z)",
  shares: "Shares",
  cost_basis: "Cost / Share",
  price: "Current Price",
  marketValue: "Market Value",
  dayChange: "Day Change $",
  dayChangePct: "Day Change %",
  totalPL: "Total P/L $",
  totalPLPct: "Total P/L %",
};

export function HoldingsTable({ rows, onEdit, onDelete }: Props) {
  const [sortField, setSortField] = React.useState<SortField>("marketValue");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const sorted = React.useMemo(
    () => sortRows(rows, sortField, sortDir),
    [rows, sortField, sortDir]
  );

  return (
    <section className="glass overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold">Holdings</h2>
        <SortPicker
          field={sortField}
          dir={sortDir}
          onChange={(f, d) => { setSortField(f); setSortDir(d); }}
        />
      </div>

      <DesktopTable
        rows={sorted}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <MobileCards rows={sorted} onEdit={onEdit} onDelete={onDelete} />
    </section>
  );
}

/* ── Dropdown sort picker (shown on mobile + as a convenience on desktop) ── */

function SortPicker({
  field,
  dir,
  onChange,
}: {
  field: SortField;
  dir: SortDir;
  onChange: (f: SortField, d: SortDir) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
      >
        <ArrowUpDown className="h-3 w-3" />
        Sort: {SORT_LABELS[field]}
        {dir === "asc" ? " ↑" : " ↓"}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] overflow-hidden rounded-lg border border-border/60 bg-popover shadow-lg">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sort by
          </div>
          {(Object.keys(SORT_LABELS) as SortField[]).map((f) => {
            const isActive = f === field;
            return (
              <button
                key={f}
                type="button"
                onClick={() => {
                  if (isActive) {
                    onChange(f, dir === "asc" ? "desc" : "asc");
                  } else {
                    onChange(f, "desc");
                  }
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-accent/10",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {SORT_LABELS[f]}
                {isActive && (
                  dir === "asc"
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Desktop table ── */

type TableProps = Props & {
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
};

function SortIcon({ field, active, dir }: { field: SortField; active: SortField; dir: SortDir }) {
  if (field !== active) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-30" />;
  return dir === "asc"
    ? <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />
    : <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />;
}

function Th({
  field,
  label,
  active,
  dir,
  onSort,
  align = "right",
}: {
  field: SortField;
  label: string;
  active: SortField;
  dir: SortDir;
  onSort: (f: SortField) => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cn(
        "cursor-pointer select-none px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
        align === "right" ? "text-right" : "text-left"
      )}
      onClick={() => onSort(field)}
    >
      {label}
      <SortIcon field={field} active={active} dir={dir} />
    </th>
  );
}

function DesktopTable({ rows, sortField, sortDir, onSort, onEdit, onDelete }: TableProps) {
  const router = useRouter();
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left">
            <Th field="ticker" label="Ticker" active={sortField} dir={sortDir} onSort={onSort} align="left" />
            <Th field="shares" label="Shares" active={sortField} dir={sortDir} onSort={onSort} />
            <Th field="cost_basis" label="Cost Basis" active={sortField} dir={sortDir} onSort={onSort} />
            <Th field="price" label="Current Price" active={sortField} dir={sortDir} onSort={onSort} />
            <Th field="marketValue" label="Market Value" active={sortField} dir={sortDir} onSort={onSort} />
            <Th field="dayChangePct" label="Day Change" active={sortField} dir={sortDir} onSort={onSort} />
            <Th field="totalPLPct" label="Total P/L" active={sortField} dir={sortDir} onSort={onSort} />
            <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
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

/* ── Mobile cards ── */

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
