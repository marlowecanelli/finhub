"use client";

import { Search, X, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/screener/multi-select";
import { cn } from "@/lib/utils";

export type NewsFilterState = {
  search: string;
  tickers: string[];
  sectors: string[];
  sources: string[];
  timeRange: "1h" | "6h" | "24h" | "7d" | "all";
  impact: "all" | "high" | "breaking";
  sort: "newest" | "oldest" | "impact";
};

export const DEFAULT_FILTERS: NewsFilterState = {
  search: "",
  tickers: [],
  sectors: [],
  sources: [],
  timeRange: "all",
  impact: "all",
  sort: "newest",
};

type Props = {
  value: NewsFilterState;
  onChange: (v: NewsFilterState) => void;
  tickerOptions: string[];
  sectorOptions: string[];
  sourceOptions: string[];
  totalCount: number;
  filteredCount: number;
};

const IMPACTS: { key: NewsFilterState["impact"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High impact" },
  { key: "breaking", label: "Breaking" },
];

const TIME_RANGES: { key: NewsFilterState["timeRange"]; label: string }[] = [
  { key: "1h", label: "1H" },
  { key: "6h", label: "6H" },
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "all", label: "All" },
];

const SORTS: { key: NewsFilterState["sort"]; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "impact", label: "Most impactful" },
];

export function NewsFilters({
  value,
  onChange,
  tickerOptions,
  sectorOptions,
  sourceOptions,
  totalCount,
  filteredCount,
}: Props) {
  const dirty =
    value.search !== "" ||
    value.tickers.length > 0 ||
    value.sectors.length > 0 ||
    value.sources.length > 0 ||
    value.timeRange !== "all" ||
    value.impact !== "all" ||
    value.sort !== "newest";

  return (
    <div className="glass space-y-3 p-4">
      {/* Row 1: keyword search + time range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Search</p>
          <Search className="pointer-events-none absolute bottom-2.5 left-3 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.target.value })}
            placeholder="Search headlines and summaries…"
            className="h-9 w-full rounded-lg border border-input bg-background/50 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Time range</p>
          <div className="inline-flex rounded-lg border border-border/60 bg-background/50 p-0.5">
            {TIME_RANGES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onChange({ ...value, timeRange: t.key })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-colors",
                  value.timeRange === t.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={value.timeRange === t.key}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: tickers, sectors, sources, impact */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MultiSelect
          label="Tickers"
          placeholder="Any ticker"
          options={tickerOptions}
          value={value.tickers}
          onChange={(v) => onChange({ ...value, tickers: v })}
        />
        <MultiSelect
          label="Sector"
          placeholder="Any sector"
          options={sectorOptions}
          value={value.sectors}
          onChange={(v) => onChange({ ...value, sectors: v })}
        />
        <MultiSelect
          label="Source"
          placeholder="Any source"
          options={sourceOptions}
          value={value.sources}
          onChange={(v) => onChange({ ...value, sources: v })}
        />
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Impact</p>
          <div className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-background/50 p-0.5">
            {IMPACTS.map((i) => (
              <button
                key={i.key}
                type="button"
                onClick={() => onChange({ ...value, impact: i.key })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-left text-xs font-medium transition-colors",
                  value.impact === i.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={value.impact === i.key}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: sort + results count + clear */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Sort:</span>
          <div className="inline-flex rounded-lg border border-border/60 bg-background/50 p-0.5">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => onChange({ ...value, sort: s.key })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  value.sort === s.key
                    ? "bg-foreground/10 text-foreground ring-1 ring-inset ring-foreground/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={value.sort === s.key}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-mono font-semibold text-foreground">{filteredCount}</span>
            {" "}/ {totalCount} articles
          </p>
          {dirty && (
            <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_FILTERS)}>
              <X className="h-3 w-3" /> Clear all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
