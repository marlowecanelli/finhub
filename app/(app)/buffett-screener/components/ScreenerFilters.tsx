"use client";

import type { BuffettLabel } from "@/lib/buffett/types";

export type FilterState = {
  sectors: string[];
  marketCapBucket: "" | "Small" | "Mid" | "Large" | "Mega";
  dividendFilter: "" | "any" | "above2" | "above4";
  minScore: number;
};

interface ScreenerFiltersProps {
  filters: FilterState;
  availableSectors: string[];
  onChange: (filters: FilterState) => void;
}

const MARKET_CAP_BUCKETS = [
  { value: "", label: "Any" },
  { value: "Small", label: "Small (<$2B)" },
  { value: "Mid", label: "Mid ($2–10B)" },
  { value: "Large", label: "Large ($10–200B)" },
  { value: "Mega", label: "Mega (>$200B)" },
] as const;

const DIVIDEND_OPTIONS = [
  { value: "", label: "Any" },
  { value: "any", label: "Pays dividend" },
  { value: "above2", label: "> 2%" },
  { value: "above4", label: "> 4%" },
] as const;

export function ScreenerFilters({ filters, availableSectors, onChange }: ScreenerFiltersProps) {
  function toggleSector(sector: string) {
    const next = filters.sectors.includes(sector)
      ? filters.sectors.filter((s) => s !== sector)
      : [...filters.sectors, sector];
    onChange({ ...filters, sectors: next });
  }

  return (
    <div className="sticky top-0 z-10 border-b border-[#D9D2C2]/60 bg-[#F7F3EC]/95 backdrop-blur dark:border-[#2A2520] dark:bg-[#100E0C]/95 py-4 px-4 md:px-0">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end gap-4">
          {/* Sector multi-select */}
          <div className="min-w-[200px] flex-1">
            <label className="block font-sans text-[0.68rem] uppercase tracking-wider text-[#B08A3E] mb-1.5">
              Sector
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSectors.map((sector) => (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  className={`rounded-full px-2.5 py-0.5 font-sans text-[0.68rem] font-medium transition-colors ${
                    filters.sectors.includes(sector)
                      ? "bg-[#B08A3E] text-white"
                      : "border border-[#D9D2C2] text-[#1A1814]/60 hover:border-[#B08A3E] dark:border-[#2A2520] dark:text-[#F7F3EC]/50"
                  }`}
                >
                  {sector}
                </button>
              ))}
              {filters.sectors.length > 0 && (
                <button
                  onClick={() => onChange({ ...filters, sectors: [] })}
                  className="rounded-full px-2 py-0.5 font-sans text-[0.68rem] text-[#8C2A2A] hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Market Cap */}
          <div>
            <label className="block font-sans text-[0.68rem] uppercase tracking-wider text-[#B08A3E] mb-1.5">
              Market Cap
            </label>
            <select
              value={filters.marketCapBucket}
              onChange={(e) =>
                onChange({
                  ...filters,
                  marketCapBucket: e.target.value as FilterState["marketCapBucket"],
                })
              }
              className="rounded-lg border border-[#D9D2C2] bg-transparent px-3 py-1.5 font-sans text-[0.8rem] text-[#1A1814] dark:border-[#2A2520] dark:text-[#F7F3EC]"
            >
              {MARKET_CAP_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dividend */}
          <div>
            <label className="block font-sans text-[0.68rem] uppercase tracking-wider text-[#B08A3E] mb-1.5">
              Dividend Yield
            </label>
            <select
              value={filters.dividendFilter}
              onChange={(e) =>
                onChange({
                  ...filters,
                  dividendFilter: e.target.value as FilterState["dividendFilter"],
                })
              }
              className="rounded-lg border border-[#D9D2C2] bg-transparent px-3 py-1.5 font-sans text-[0.8rem] text-[#1A1814] dark:border-[#2A2520] dark:text-[#F7F3EC]"
            >
              {DIVIDEND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Min Score slider */}
          <div className="min-w-[160px]">
            <label className="block font-sans text-[0.68rem] uppercase tracking-wider text-[#B08A3E] mb-1.5">
              Min Buffett Score: <span className="font-semibold">{filters.minScore.toFixed(0)}</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={filters.minScore}
              onChange={(e) =>
                onChange({ ...filters, minScore: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#B08A3E]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
