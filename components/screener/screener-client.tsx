"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Filter as FilterIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterSidebar } from "./filter-sidebar";
import { ResultsTable } from "./results-table";
import { SavePresetDialog } from "./save-preset-dialog";
import { PresetMenu } from "./preset-menu";
import {
  applyFilters,
  applySort,
  filtersToParams,
  parseFilters,
  type ScreenerFilters,
  type ScreenerPreset,
  type ScreenerRow,
  type SortState,
} from "@/lib/screener";

const PAGE_SIZE = 50;

type Props = {
  initialRows: ScreenerRow[];
  refreshedAt: string | null;
};

export function ScreenerClient({ initialRows, refreshedAt }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [rows, setRows] = React.useState<ScreenerRow[]>(initialRows);
  const [refreshing, setRefreshing] = React.useState(false);
  const [snapshotAt, setSnapshotAt] = React.useState<string | null>(refreshedAt);
  const [filters, setFilters] = React.useState<ScreenerFilters>(() =>
    parseFilters(new URLSearchParams(params.toString()))
  );
  const [sort, setSort] = React.useState<SortState>({ key: "marketCap", dir: "desc" });
  const [page, setPage] = React.useState(0);
  const [saveOpen, setSaveOpen] = React.useState(false);
  const [presets, setPresets] = React.useState<ScreenerPreset[]>([]);

  // Sync filters into the URL (replace, no scroll).
  React.useEffect(() => {
    const next = filtersToParams(filters).toString();
    const current = params.toString();
    if (next === current) return;
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    setPage(0);
  }, [filters, pathname, router, params]);

  // Load saved presets once.
  React.useEffect(() => {
    fetch("/api/screener/presets")
      .then((r) => r.json())
      .then((d: { presets?: ScreenerPreset[] }) => setPresets(d.presets ?? []))
      .catch(() => {
        // unauth or unconfigured — silent
      });
  }, []);

  const sectorOptions = React.useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.sector).filter((x): x is string => Boolean(x)))).sort(),
    [rows]
  );

  // Industry options narrow with selected sectors so the dropdown stays useful.
  const industryOptions = React.useMemo(() => {
    const pool = filters.sectors.length
      ? rows.filter((r) => r.sector && filters.sectors.includes(r.sector))
      : rows;
    return Array.from(
      new Set(pool.map((r) => r.industry).filter((x): x is string => Boolean(x)))
    ).sort();
  }, [rows, filters.sectors]);

  const filtered = React.useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const sorted = React.useMemo(() => applySort(filtered, sort), [filtered, sort]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/screener?refresh=1", { cache: "no-store" });
      const data = (await r.json()) as { rows: ScreenerRow[]; refreshedAt: string };
      setRows(data.rows);
      setSnapshotAt(data.refreshedAt);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDeletePreset(id: string) {
    setPresets((p) => p.filter((x) => x.id !== id));
    await fetch(`/api/screener/presets/${id}`, { method: "DELETE" }).catch(() => {
      // best-effort; UI stays in sync optimistically
    });
  }

  function exportCsv() {
    const cols = [
      "Symbol",
      "Name",
      "Sector",
      "Industry",
      "Price",
      "ChangePct",
      "MarketCap",
      "PE",
      "DividendYield",
      "FiftyTwoLow",
      "FiftyTwoHigh",
      "FiftyTwoChangePct",
      "Volume",
    ];
    const lines = [cols.join(",")];
    for (const r of sorted) {
      lines.push(
        [
          r.symbol,
          csvEscape(r.name ?? ""),
          csvEscape(r.sector ?? ""),
          csvEscape(r.industry ?? ""),
          r.price ?? "",
          r.changePct ?? "",
          r.marketCap ?? "",
          r.peRatio ?? "",
          r.dividendYield ?? "",
          r.fiftyTwoLow ?? "",
          r.fiftyTwoHigh ?? "",
          r.fiftyTwoChange ?? "",
          r.volume ?? "",
        ].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finhub-screener-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sidebar = (
    <FilterSidebar
      filters={filters}
      onChange={setFilters}
      sectorOptions={sectorOptions}
      industryOptions={industryOptions}
      onSavePreset={() => setSaveOpen(true)}
      resultCount={sorted.length}
      totalCount={rows.length}
    />
  );

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Screener
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Find stocks by the numbers
          </h1>
          {snapshotAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Snapshot refreshed {new Date(snapshotAt).toLocaleString()} · refreshes daily
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="glass" size="sm" className="lg:hidden">
                <FilterIcon className="h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] overflow-y-auto p-0">
              <SheetTitle className="sr-only">Filters</SheetTitle>
              <div className="p-4">{sidebar}</div>
            </SheetContent>
          </Sheet>

          <PresetMenu
            presets={presets}
            onApply={(p) => setFilters(p.filters)}
            onDelete={handleDeletePreset}
          />
          <Button variant="ghost" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">{sidebar}</div>
        <ResultsTable
          rows={sorted}
          sort={sort}
          onSort={setSort}
          page={page}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      </div>

      <SavePresetDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        filters={filters}
        onSaved={(p) => setPresets((prev) => [p, ...prev])}
      />
    </div>
  );
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
