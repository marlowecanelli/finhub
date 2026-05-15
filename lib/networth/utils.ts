import type {
  Asset,
  Liability,
  Snapshot,
  NetWorthState,
  AssetCategory,
  LiabilityCategory,
} from "./types";

export function formatMoney(n: number, currency = "USD", compact = false): string {
  if (compact && Math.abs(n) >= 10000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatMoneyInt(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

// Parse "50k" -> 50000, "1.5m" -> 1500000, "250" -> 250
export function parseSmartNumber(input: string): number | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase().replace(/[$,_\s]/g, "");
  if (!cleaned) return null;
  const m = cleaned.match(/^(-?\d*\.?\d+)([kmb])?$/);
  if (!m || !m[1]) return null;
  let n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const suffix = m[2];
  if (suffix === "k") n *= 1_000;
  else if (suffix === "m") n *= 1_000_000;
  else if (suffix === "b") n *= 1_000_000_000;
  return n;
}

export function isoToday(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function totalAssetsOf(assets: Asset[]): number {
  return assets
    .filter((a) => !a.archived)
    .reduce((s, a) => s + (Number(a.value) || 0), 0);
}

export function totalLiabilitiesOf(liabilities: Liability[]): number {
  return liabilities
    .filter((l) => !l.archived)
    .reduce((s, l) => s + (Number(l.balance) || 0), 0);
}

export function liquidNetWorthOf(assets: Asset[], liabilities: Liability[]): number {
  const liquidAssets = assets
    .filter((a) => !a.archived && a.isLiquid)
    .reduce((s, a) => s + (Number(a.value) || 0), 0);
  return liquidAssets - totalLiabilitiesOf(liabilities);
}

export function buildSnapshot(
  assets: Asset[],
  liabilities: Liability[],
  date = isoToday()
): Snapshot {
  const assetBreakdown: Partial<Record<AssetCategory, number>> = {};
  for (const a of assets) {
    if (a.archived) continue;
    assetBreakdown[a.category] = (assetBreakdown[a.category] ?? 0) + a.value;
  }
  const liabilityBreakdown: Partial<Record<LiabilityCategory, number>> = {};
  for (const l of liabilities) {
    if (l.archived) continue;
    liabilityBreakdown[l.category] = (liabilityBreakdown[l.category] ?? 0) + l.balance;
  }
  const totalAssets = totalAssetsOf(assets);
  const totalLiabilities = totalLiabilitiesOf(liabilities);
  return {
    date,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    liquidNetWorth: liquidNetWorthOf(assets, liabilities),
    assetBreakdown,
    liabilityBreakdown,
  };
}

// Standard age-based vehicle depreciation
const DEPRECIATION_CURVES: Record<string, number[]> = {
  // values are fraction REMAINING at end of each year, year 1 first
  standard: [0.80, 0.68, 0.612, 0.563, 0.518, 0.477, 0.438, 0.403, 0.371, 0.342],
  luxury:   [0.70, 0.55, 0.45, 0.378, 0.328, 0.295, 0.265, 0.239, 0.215, 0.193],
  truck:    [0.85, 0.76, 0.70, 0.658, 0.619, 0.582, 0.547, 0.514, 0.483, 0.454],
  classic:  [0.99, 0.9801, 0.9703, 0.9606, 0.9510, 0.9415, 0.9321, 0.9228, 0.9136, 0.9045],
  flat:     [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};

export function depreciatedValue(
  purchasePrice: number,
  purchaseDate: string,
  curve: keyof typeof DEPRECIATION_CURVES = "standard"
): number {
  const ageDays = daysBetween(purchaseDate, isoToday());
  if (ageDays <= 0) return purchasePrice;
  const years = ageDays / 365.25;
  const c = (DEPRECIATION_CURVES[curve] || DEPRECIATION_CURVES.standard) as number[];
  const first = c[0] ?? 0.8;
  const last = c[c.length - 1] ?? 0.3;
  if (years <= 1) {
    return purchasePrice * (1 - (1 - first) * years);
  }
  const yi = Math.min(Math.floor(years), c.length - 1);
  const yNext = Math.min(yi + 1, c.length - 1);
  const frac = years - yi;
  const prev = c[yi - 1] ?? first;
  const next = c[yNext] ?? last;
  const remaining = prev + (next - prev) * frac;
  if (years > c.length) {
    const extra = years - c.length;
    return purchasePrice * last * Math.pow(0.95, extra);
  }
  return Math.max(purchasePrice * remaining, purchasePrice * 0.1);
}

// Compute trailing N-day velocity in $/month
export function trailingVelocity(snapshots: Snapshot[], days = 90): number {
  if (snapshots.length < 2) return 0;
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  if (!latest || !first) return 0;
  const cutoff = new Date(latest.date);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const earlier = sorted.find((s) => s.date >= cutoffStr) ?? first;
  const dayCount = Math.max(daysBetween(earlier.date, latest.date), 1);
  const totalChange = latest.netWorth - earlier.netWorth;
  return (totalChange / dayCount) * 30;
}

// Forecast future net worth via velocity
export function projectForward(latestNW: number, velocityPerMonth: number, months: number): number {
  return latestNW + velocityPerMonth * months;
}

export function debtFreeMonths(liabilities: Liability[]): number | null {
  let total = 0;
  let monthlyPay = 0;
  let weighted = 0;
  for (const l of liabilities) {
    if (l.archived) continue;
    if (!l.minimumPayment || l.minimumPayment <= 0) continue;
    total += l.balance;
    monthlyPay += l.minimumPayment;
    weighted += (l.interestRate ?? 0) * l.balance;
  }
  if (total <= 0 || monthlyPay <= 0) return null;
  const apr = total > 0 ? weighted / total : 0;
  const r = apr / 12;
  if (r <= 0) return Math.ceil(total / monthlyPay);
  // n = -ln(1 - rB/P) / ln(1+r)
  const ratio = (r * total) / monthlyPay;
  if (ratio >= 1) return null; // payments don't cover interest
  const n = -Math.log(1 - ratio) / Math.log(1 + r);
  return Math.ceil(n);
}

export function formatMonths(n: number): string {
  const y = Math.floor(n / 12);
  const m = n % 12;
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

export function newId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function changeSince(snapshots: Snapshot[], days: number): { delta: number; pct: number } | null {
  if (snapshots.length === 0) return null;
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  if (!latest || !first) return null;
  if (days === 0) return { delta: 0, pct: 0 };
  const cutoff = new Date(latest.date);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const earlier = [...sorted].reverse().find((s) => s.date <= cutoffStr) ?? first;
  const delta = latest.netWorth - earlier.netWorth;
  const pct = earlier.netWorth !== 0 ? (delta / Math.abs(earlier.netWorth)) * 100 : 0;
  return { delta, pct };
}

export function allTimeChange(snapshots: Snapshot[]): { delta: number; pct: number } | null {
  if (snapshots.length < 2) return null;
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  if (!latest || !first) return null;
  const delta = latest.netWorth - first.netWorth;
  const pct = first.netWorth !== 0 ? (delta / Math.abs(first.netWorth)) * 100 : 0;
  return { delta, pct };
}

export const EMPTY_STATE: NetWorthState = {
  version: 1,
  assets: [],
  liabilities: [],
  snapshots: [],
  annotations: [],
  goals: [],
  achievements: [],
  activity: [],
  settings: {
    privacyDefault: "off",
    currency: "USD",
  },
};
