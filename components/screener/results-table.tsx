"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sparkline } from "./sparkline";
import { cn, formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import type { ScreenerRow, SortKey, SortState } from "@/lib/screener";

type Props = {
  rows: ScreenerRow[]; // already filtered + sorted, full set
  sort: SortState;
  onSort: (next: SortState) => void;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
};

const COLUMNS: { key: SortKey | null; label: string; align?: "right"; cls?: string }[] = [
  { key: "symbol", label: "Ticker" },
  { key: "name", label: "Company", cls: "hidden lg:table-cell" },
  { key: "price", label: "Price", align: "right" },
  { key: "changePct", label: "Day", align: "right" },
  { key: "marketCap", label: "Market Cap", align: "right" },
  { key: "peRatio", label: "P/E", align: "right" },
  { key: "dividendYield", label: "Div Yield", align: "right", cls: "hidden md:table-cell" },
  { key: "fiftyTwoChange", label: "52W", align: "right", cls: "hidden md:table-cell" },
  { key: "volume", label: "Volume", align: "right", cls: "hidden lg:table-cell" },
  { key: null, label: "Trend", align: "right" },
];

export function ResultsTable({ rows, sort, onSort, page, pageSize, onPage }: Props) {
  const router = useRouter();
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <section className="glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-left",
                    col.align === "right" && "text-right",
                    col.cls
                  )}
                >
                  {col.key ? (
                    <button
                      type="button"
                      onClick={() => {
                        const dir =
                          sort.key === col.key && sort.dir === "desc"
                            ? "asc"
                            : "desc";
                        onSort({ key: col.key, dir });
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                        sort.key === col.key && "text-foreground"
                      )}
                    >
                      {col.label}
                      {sort.key === col.key &&
                        (sort.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {slice.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No tickers match these filters.
                </td>
              </tr>
            ) : (
              slice.map((r) => {
                const up = (r.changePct ?? 0) >= 0;
                const w52up = (r.fiftyTwoChange ?? 0) >= 0;
                return (
                  <tr
                    key={r.symbol}
                    onClick={() => router.push(`/ticker/${encodeURIComponent(r.symbol)}`)}
                    className="cursor-pointer transition-colors hover:bg-accent/5"
                  >
                    <td className="px-4 py-3 font-mono font-semibold">{r.symbol}</td>
                    <td className="hidden truncate px-4 py-3 text-foreground/90 lg:table-cell">
                      {r.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.price != null ? formatCurrency(r.price) : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-mono",
                        up ? "text-[#10b981]" : "text-[#ef4444]"
                      )}
                    >
                      {r.changePct != null ? formatPercent(r.changePct) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.marketCap != null ? formatCompact(r.marketCap) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {r.peRatio != null ? r.peRatio.toFixed(1) : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono md:table-cell">
                      {r.dividendYield != null
                        ? `${(r.dividendYield * 100).toFixed(2)}%`
                        : "—"}
                    </td>
                    <td
                      className={cn(
                        "hidden px-4 py-3 text-right font-mono md:table-cell",
                        w52up ? "text-[#10b981]" : "text-[#ef4444]"
                      )}
                    >
                      {r.fiftyTwoChange != null
                        ? formatPercent(r.fiftyTwoChange)
                        : "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-right font-mono lg:table-cell">
                      {r.volume != null ? formatCompact(r.volume) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Sparkline
                          symbol={r.symbol}
                          changePct={r.changePct}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-mono font-medium text-foreground">
            {total === 0 ? 0 : safePage * pageSize + 1}–
            {Math.min(total, (safePage + 1) * pageSize)}
          </span>{" "}
          of <span className="font-mono font-medium text-foreground">{total}</span>
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            aria-label="Previous page"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs">
            {safePage + 1} / {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            aria-label="Next page"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
