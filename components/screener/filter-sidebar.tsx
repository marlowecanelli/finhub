"use client";

import * as React from "react";
import { RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapSelector } from "./cap-selector";
import { MultiSelect } from "./multi-select";
import { RangeInput } from "./range-input";
import {
  EMPTY_FILTERS,
  type ScreenerFilters,
} from "@/lib/screener";

type Props = {
  filters: ScreenerFilters;
  onChange: (next: ScreenerFilters) => void;
  sectorOptions: string[];
  industryOptions: string[];
  onSavePreset: () => void;
  resultCount: number;
  totalCount: number;
};

export function FilterSidebar({
  filters,
  onChange,
  sectorOptions,
  industryOptions,
  onSavePreset,
  resultCount,
  totalCount,
}: Props) {
  return (
    <aside className="glass space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <CapSelector
        value={filters.caps}
        onChange={(v) => onChange({ ...filters, caps: v })}
      />

      <MultiSelect
        label="Sector"
        options={sectorOptions}
        value={filters.sectors}
        onChange={(v) => {
          // Clear industries that don't belong to the new sectors.
          const newIndustries = filters.industries; // pruning happens upstream from option list
          onChange({ ...filters, sectors: v, industries: newIndustries });
        }}
      />

      <MultiSelect
        label="Industry"
        options={industryOptions}
        value={filters.industries}
        onChange={(v) => onChange({ ...filters, industries: v })}
      />

      <RangeInput
        label="P/E ratio"
        value={{ min: filters.peMin, max: filters.peMax }}
        onChange={(v) => onChange({ ...filters, peMin: v.min, peMax: v.max })}
      />

      <RangeInput
        label="Dividend yield"
        unit="%"
        value={{ min: filters.divMin, max: filters.divMax }}
        onChange={(v) => onChange({ ...filters, divMin: v.min, divMax: v.max })}
      />

      <RangeInput
        label="52-week performance"
        unit="%"
        value={{ min: filters.perfMin, max: filters.perfMax }}
        onChange={(v) => onChange({ ...filters, perfMin: v.min, perfMax: v.max })}
      />

      <RangeInput
        label="Price"
        unit="$"
        value={{ min: filters.priceMin, max: filters.priceMax }}
        onChange={(v) => onChange({ ...filters, priceMin: v.min, priceMax: v.max })}
      />

      <div className="border-t border-border/60 pt-4">
        <p className="mb-3 text-xs text-muted-foreground">
          <span className="font-mono font-semibold text-foreground">
            {resultCount.toLocaleString()}
          </span>{" "}
          of {totalCount.toLocaleString()} match
        </p>
        <Button
          type="button"
          onClick={onSavePreset}
          variant="glass"
          className="w-full"
          size="sm"
        >
          <Save className="h-4 w-4" /> Save screen
        </Button>
      </div>
    </aside>
  );
}
