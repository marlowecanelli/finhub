export type ScreenerRow = {
  symbol: string;
  name: string | null;
  sector: string | null;
  industry: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null; // raw fraction (0.012 = 1.2%)
  fiftyTwoHigh: number | null;
  fiftyTwoLow: number | null;
  fiftyTwoChange: number | null; // percent vs 52w low
  volume: number | null;
  prevClose: number | null;
};

export const CAP_BUCKETS = [
  { key: "Micro", label: "Micro", min: 0, max: 300_000_000 },
  { key: "Small", label: "Small", min: 300_000_000, max: 2_000_000_000 },
  { key: "Mid", label: "Mid", min: 2_000_000_000, max: 10_000_000_000 },
  { key: "Large", label: "Large", min: 10_000_000_000, max: 200_000_000_000 },
  { key: "Mega", label: "Mega", min: 200_000_000_000, max: Number.POSITIVE_INFINITY },
] as const;

export type CapBucketKey = (typeof CAP_BUCKETS)[number]["key"];

export type ScreenerFilters = {
  caps: CapBucketKey[]; // empty = all
  sectors: string[]; // empty = all
  industries: string[]; // empty = all
  peMin: number | null;
  peMax: number | null;
  divMin: number | null; // percent (1.5 = 1.5%)
  divMax: number | null;
  perfMin: number | null; // percent
  perfMax: number | null;
  priceMin: number | null;
  priceMax: number | null;
};

export const EMPTY_FILTERS: ScreenerFilters = {
  caps: [],
  sectors: [],
  industries: [],
  peMin: null,
  peMax: null,
  divMin: null,
  divMax: null,
  perfMin: null,
  perfMax: null,
  priceMin: null,
  priceMax: null,
};

export function applyFilters(
  rows: ScreenerRow[],
  f: ScreenerFilters
): ScreenerRow[] {
  return rows.filter((r) => {
    if (f.caps.length > 0) {
      if (r.marketCap == null) return false;
      const inAny = f.caps.some((k) => {
        const b = CAP_BUCKETS.find((x) => x.key === k);
        return b ? r.marketCap! >= b.min && r.marketCap! < b.max : false;
      });
      if (!inAny) return false;
    }
    if (f.sectors.length > 0 && (!r.sector || !f.sectors.includes(r.sector))) {
      return false;
    }
    if (
      f.industries.length > 0 &&
      (!r.industry || !f.industries.includes(r.industry))
    ) {
      return false;
    }
    if (f.peMin != null && (r.peRatio == null || r.peRatio < f.peMin)) return false;
    if (f.peMax != null && (r.peRatio == null || r.peRatio > f.peMax)) return false;

    const divPct = r.dividendYield != null ? r.dividendYield * 100 : null;
    if (f.divMin != null && (divPct == null || divPct < f.divMin)) return false;
    if (f.divMax != null && (divPct == null || divPct > f.divMax)) return false;

    if (f.perfMin != null && (r.fiftyTwoChange == null || r.fiftyTwoChange < f.perfMin)) return false;
    if (f.perfMax != null && (r.fiftyTwoChange == null || r.fiftyTwoChange > f.perfMax)) return false;

    if (f.priceMin != null && (r.price == null || r.price < f.priceMin)) return false;
    if (f.priceMax != null && (r.price == null || r.price > f.priceMax)) return false;

    return true;
  });
}

export type SortKey =
  | "symbol"
  | "name"
  | "price"
  | "changePct"
  | "marketCap"
  | "peRatio"
  | "dividendYield"
  | "fiftyTwoChange"
  | "volume";

export type SortState = { key: SortKey; dir: "asc" | "desc" };

export function applySort(rows: ScreenerRow[], s: SortState): ScreenerRow[] {
  const sign = s.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[s.key];
    const bv = b[s.key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1; // nulls last regardless of dir
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * sign;
    }
    return String(av).localeCompare(String(bv)) * sign;
  });
}

export function filtersToParams(f: ScreenerFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.caps.length) p.set("caps", f.caps.join(","));
  if (f.sectors.length) p.set("sectors", f.sectors.join(","));
  if (f.industries.length) p.set("industries", f.industries.join(","));
  if (f.peMin != null) p.set("pe_min", String(f.peMin));
  if (f.peMax != null) p.set("pe_max", String(f.peMax));
  if (f.divMin != null) p.set("div_min", String(f.divMin));
  if (f.divMax != null) p.set("div_max", String(f.divMax));
  if (f.perfMin != null) p.set("perf_min", String(f.perfMin));
  if (f.perfMax != null) p.set("perf_max", String(f.perfMax));
  if (f.priceMin != null) p.set("price_min", String(f.priceMin));
  if (f.priceMax != null) p.set("price_max", String(f.priceMax));
  return p;
}

export function parseFilters(p: URLSearchParams): ScreenerFilters {
  const arr = (k: string) =>
    (p.get(k) ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  const num = (k: string) => {
    const v = p.get(k);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const caps = arr("caps").filter((x): x is CapBucketKey =>
    CAP_BUCKETS.some((b) => b.key === x)
  );
  return {
    caps,
    sectors: arr("sectors"),
    industries: arr("industries"),
    peMin: num("pe_min"),
    peMax: num("pe_max"),
    divMin: num("div_min"),
    divMax: num("div_max"),
    perfMin: num("perf_min"),
    perfMax: num("perf_max"),
    priceMin: num("price_min"),
    priceMax: num("price_max"),
  };
}

export type ScreenerPreset = {
  id: string;
  name: string;
  filters: ScreenerFilters;
  created_at: string;
};
