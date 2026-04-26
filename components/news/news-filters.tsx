"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/screener/multi-select";
import { cn } from "@/lib/utils";

export type NewsFilterState = {
  ticker: string;
  sectors: string[];
  impact: "all" | "high" | "breaking";
};

type Props = {
  value: NewsFilterState;
  onChange: (v: NewsFilterState) => void;
  sectorOptions: string[];
  totalCount: number;
  filteredCount: number;
};

const IMPACTS: { key: NewsFilterState["impact"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "high", label: "High" },
  { key: "breaking", label: "Breaking" },
];

export function NewsFilters({
  value,
  onChange,
  sectorOptions,
  totalCount,
  filteredCount,
}: Props) {
  const dirty =
    value.ticker !== "" || value.sectors.length > 0 || value.impact !== "all";

  return (
    <div className="glass space-y-3 p-4 md:flex md:items-end md:gap-4 md:space-y-0">
      <div className="md:flex-1 md:min-w-0">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Ticker</p>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.ticker}
            onChange={(e) =>
              onChange({ ...value, ticker: e.target.value.toUpperCase() })
            }
            placeholder="AAPL, NVDA…"
            className="h-9 pl-8 font-mono uppercase placeholder:normal-case"
          />
        </div>
      </div>

      <div className="md:w-56">
        <MultiSelect
          label="Sector"
          options={sectorOptions}
          value={value.sectors}
          onChange={(v) => onChange({ ...value, sectors: v })}
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Impact</p>
        <div className="inline-flex rounded-lg border border-border/60 bg-background/50 p-0.5">
          {IMPACTS.map((i) => (
            <button
              key={i.key}
              type="button"
              onClick={() => onChange({ ...value, impact: i.key })}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
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

      <div className="flex items-end justify-between gap-2 md:items-center md:justify-end">
        <p className="text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">
            {filteredCount}
          </span>{" "}
          / {totalCount}
        </p>
        {dirty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({ ticker: "", sectors: [], impact: "all" })
            }
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>
    </div>
  );
}
