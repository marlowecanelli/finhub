"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Loader2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EnrichedHolding } from "@/lib/portfolio";
import type { EtfDetail } from "@/app/api/etf/[symbol]/route";

type Props = {
  enriched: EnrichedHolding[];
};

// Well-known ETFs across asset classes / exchanges for discovery suggestion
const FEATURED_ETFS: Array<{ symbol: string; name: string; category: string; exchange: string }> = [
  // US Equity — NYSE ARCA
  { symbol: "SPY",  name: "SPDR S&P 500 ETF Trust",          category: "US Large Cap",          exchange: "NYSE ARCA" },
  { symbol: "IVV",  name: "iShares Core S&P 500 ETF",        category: "US Large Cap",          exchange: "NYSE ARCA" },
  { symbol: "VOO",  name: "Vanguard S&P 500 ETF",            category: "US Large Cap",          exchange: "NYSE ARCA" },
  { symbol: "QQQ",  name: "Invesco QQQ Trust",               category: "US Large Cap Growth",   exchange: "NASDAQ" },
  { symbol: "VTI",  name: "Vanguard Total Stock Market ETF", category: "US Total Market",       exchange: "NYSE ARCA" },
  { symbol: "IWM",  name: "iShares Russell 2000 ETF",        category: "US Small Cap",          exchange: "NYSE ARCA" },
  // Fixed Income — NYSE ARCA
  { symbol: "TLT",  name: "iShares 20+ Year Treasury Bond",  category: "Long Government",       exchange: "NYSE ARCA" },
  { symbol: "AGG",  name: "iShares Core US Aggregate Bond",  category: "Core Bond",             exchange: "NYSE ARCA" },
  { symbol: "BND",  name: "Vanguard Total Bond Market ETF",  category: "Core Bond",             exchange: "NYSE ARCA" },
  { symbol: "SHY",  name: "iShares 1-3 Year Treasury Bond",  category: "Short Government",      exchange: "NYSE ARCA" },
  { symbol: "HYG",  name: "iShares iBoxx High Yield Corp",   category: "High Yield Bond",       exchange: "NYSE ARCA" },
  { symbol: "LQD",  name: "iShares iBoxx Inv Grade Corp",    category: "Corp Bond",             exchange: "NYSE ARCA" },
  // International — NYSE ARCA
  { symbol: "EFA",  name: "iShares MSCI EAFE ETF",           category: "Foreign Large Blend",   exchange: "NYSE ARCA" },
  { symbol: "EEM",  name: "iShares MSCI Emerging Markets",   category: "Diversified EM",        exchange: "NYSE ARCA" },
  { symbol: "VEA",  name: "Vanguard FTSE Developed Markets", category: "Foreign Large Blend",   exchange: "NYSE ARCA" },
  { symbol: "VWO",  name: "Vanguard FTSE Emerging Markets",  category: "Diversified EM",        exchange: "NYSE ARCA" },
  // Sector — NYSE ARCA
  { symbol: "XLK",  name: "Technology Select Sector SPDR",   category: "Technology Sector",     exchange: "NYSE ARCA" },
  { symbol: "XLF",  name: "Financial Select Sector SPDR",    category: "Financial Sector",      exchange: "NYSE ARCA" },
  { symbol: "XLV",  name: "Health Care Select Sector SPDR",  category: "Healthcare Sector",     exchange: "NYSE ARCA" },
  { symbol: "XLE",  name: "Energy Select Sector SPDR",       category: "Energy Sector",         exchange: "NYSE ARCA" },
  { symbol: "XLI",  name: "Industrial Select Sector SPDR",   category: "Industrials Sector",    exchange: "NYSE ARCA" },
  // Commodities — NYSE ARCA
  { symbol: "GLD",  name: "SPDR Gold Shares",                category: "Commodities - Gold",    exchange: "NYSE ARCA" },
  { symbol: "SLV",  name: "iShares Silver Trust",            category: "Commodities - Silver",  exchange: "NYSE ARCA" },
  // Real Estate — NYSE ARCA
  { symbol: "VNQ",  name: "Vanguard Real Estate ETF",        category: "Real Estate",           exchange: "NYSE ARCA" },
  // Dividend / Income — NYSE ARCA / Cboe
  { symbol: "SCHD", name: "Schwab US Dividend Equity ETF",   category: "Large Cap Value",       exchange: "NYSE ARCA" },
  { symbol: "VYM",  name: "Vanguard High Dividend Yield ETF", category: "Large Cap Value",      exchange: "NYSE ARCA" },
  // Thematic — NASDAQ / Cboe
  { symbol: "ARKK", name: "ARK Innovation ETF",              category: "Thematic - Innovation", exchange: "NYSE ARCA" },
  { symbol: "ICLN", name: "iShares Global Clean Energy ETF", category: "Thematic - Clean Energy", exchange: "NASDAQ" },
  // Crypto Futures — Cboe / NYSE ARCA
  { symbol: "BITO", name: "ProShares Bitcoin Strategy ETF",  category: "Cryptocurrency",        exchange: "NYSE ARCA" },
];

// Color palette for bars
const PALETTE = [
  "#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444",
  "#06b6d4","#ec4899","#84cc16","#f97316","#14b8a6",
];

export function EtfPanel({ enriched }: Props) {
  const etfHoldings = enriched.filter(
    (h) => h.quote?.assetType === "ETF" || h.quote?.assetType === "MUTUALFUND"
  );

  if (etfHoldings.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">ETF Breakdown</h2>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
          {etfHoldings.length} fund{etfHoldings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {etfHoldings.map((h) => (
          <EtfCard key={h.id} holding={h} />
        ))}
      </div>

      <FeaturedEtfs heldSymbols={etfHoldings.map((h) => h.ticker)} />
    </section>
  );
}

/* ── Per-ETF expandable card ── */

function EtfCard({ holding }: { holding: EnrichedHolding }) {
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<EtfDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || detail || loading) return;
    setLoading(true);
    setError(null);
    fetch(`/api/etf/${encodeURIComponent(holding.ticker)}`)
      .then((r) => r.json())
      .then((d: EtfDetail & { error?: string }) => {
        if (d.error) setError(d.error);
        else setDetail(d);
      })
      .catch(() => setError("Failed to load ETF data"))
      .finally(() => setLoading(false));
  }, [open, holding.ticker, detail, loading]);

  const q = holding.quote;
  const expenseRatio = q?.expenseRatio ?? detail?.expenseRatio ?? null;
  const category = q?.etfCategory ?? detail?.category ?? null;
  const family = q?.etfFamily ?? detail?.family ?? null;
  const exchange = q?.exchange ?? detail?.exchange ?? null;

  return (
    <div className="glass overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/5"
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-base font-semibold">{holding.ticker}</span>
            <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-500">
              ETF
            </span>
            {exchange && (
              <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {exchange}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{q?.name ?? holding.ticker}</p>
          <div className="flex items-center gap-3 flex-wrap mt-0.5">
            {category && (
              <MetaPill label={category} />
            )}
            {family && (
              <MetaPill label={family} />
            )}
            {expenseRatio != null && (
              <MetaPill label={`${(expenseRatio * 100).toFixed(2)}% expense ratio`} accent />
            )}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <p className="font-mono text-sm font-semibold">
            {holding.marketValue > 0
              ? `$${holding.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {holding.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })} shares
          </p>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground mt-1" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground mt-1" />
          )}
        </div>
      </button>

      {/* Expandable detail */}
      {open && (
        <div className="border-t border-border/60 px-5 py-4">
          {loading && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading fund details…
            </div>
          )}
          {error && (
            <p className="py-2 text-xs text-muted-foreground">Could not load fund details.</p>
          )}
          {detail && !loading && (
            <div className="space-y-6">
              {/* Fund info grid */}
              <FundInfoGrid detail={detail} />

              {/* Asset allocation */}
              {hasAllocation(detail) && <AssetAllocation detail={detail} />}

              {/* Top holdings */}
              {detail.topHoldings.length > 0 && (
                <TopHoldings holdings={detail.topHoldings} />
              )}

              {/* Sector weights */}
              {detail.sectorWeightings.length > 0 && (
                <SectorWeights sectors={detail.sectorWeightings} />
              )}

              {/* Bond info */}
              {(detail.duration != null || detail.maturity != null || detail.bondRatings.length > 0) && (
                <BondInfo detail={detail} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaPill({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        accent
          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          : "bg-muted/50 text-muted-foreground border border-border/60"
      )}
    >
      {label}
    </span>
  );
}

/* ── Fund info grid ── */

function FundInfoGrid({ detail }: { detail: EtfDetail }) {
  const items = [
    { label: "Category", value: detail.category },
    { label: "Fund Family", value: detail.family },
    { label: "Legal Type", value: detail.legalType },
    { label: "Exchange", value: detail.exchange },
    {
      label: "Expense Ratio",
      value: detail.expenseRatio != null
        ? `${(detail.expenseRatio * 100).toFixed(2)}% / yr`
        : null,
    },
  ].filter((i) => i.value);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
          <p className="mt-0.5 text-sm font-medium">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Asset allocation ── */

function hasAllocation(detail: EtfDetail) {
  return (
    detail.stockPosition != null ||
    detail.bondPosition != null ||
    detail.cashPosition != null ||
    detail.otherPosition != null
  );
}

type AllocSlice = { label: string; pct: number; color: string };

function AssetAllocation({ detail }: { detail: EtfDetail }) {
  const slices: AllocSlice[] = [
    { label: "Stocks", pct: (detail.stockPosition ?? 0) * 100, color: "#3b82f6" },
    { label: "Bonds", pct: (detail.bondPosition ?? 0) * 100, color: "#10b981" },
    { label: "Cash", pct: (detail.cashPosition ?? 0) * 100, color: "#f59e0b" },
    { label: "Other", pct: (detail.otherPosition ?? 0) * 100, color: "#8b5cf6" },
  ].filter((s) => s.pct > 0.01);

  if (slices.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Asset Allocation
      </p>
      {/* Stacked bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {slices.map((s) => (
          <div
            key={s.label}
            style={{ width: `${s.pct}%`, background: s.color }}
            title={`${s.label}: ${s.pct.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {slices.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="font-mono text-xs font-medium">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Top holdings ── */

function TopHoldings({ holdings }: { holdings: EtfDetail["topHoldings"] }) {
  const shown = holdings.slice(0, 10);
  const maxPct = Math.max(...shown.map((h) => h.pct));

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Top {shown.length} Holdings
      </p>
      <div className="space-y-1.5">
        {shown.map((h, i) => (
          <div key={`${h.symbol ?? h.name ?? i}`} className="flex items-center gap-2">
            <span className="w-20 shrink-0 font-mono text-xs font-semibold truncate">
              {h.symbol ?? "—"}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted/40">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(h.pct / maxPct) * 100}%`,
                    background: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                {(h.pct * 100).toFixed(2)}%
              </span>
            </div>
            {h.name && (
              <span className="hidden lg:block w-40 shrink-0 truncate text-[11px] text-muted-foreground">
                {h.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sector weights ── */

function SectorWeights({ sectors }: { sectors: EtfDetail["sectorWeightings"] }) {
  const shown = sectors.slice(0, 10);
  const maxPct = Math.max(...shown.map((s) => s.pct));

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sector Weights
      </p>
      <div className="space-y-1.5">
        {shown.map((s, i) => (
          <div key={s.sector} className="flex items-center gap-2">
            <span className="w-40 shrink-0 text-xs text-foreground/80 truncate">{s.sector}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted/40">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(s.pct / maxPct) * 100}%`,
                    background: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                {(s.pct * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Bond info ── */

function BondInfo({ detail }: { detail: EtfDetail }) {
  return (
    <div className="space-y-3">
      {(detail.duration != null || detail.maturity != null) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {detail.duration != null && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Duration</p>
              <p className="mt-0.5 font-mono text-sm font-medium">{detail.duration.toFixed(1)} yrs</p>
            </div>
          )}
          {detail.maturity != null && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Maturity</p>
              <p className="mt-0.5 font-mono text-sm font-medium">{detail.maturity.toFixed(1)} yrs</p>
            </div>
          )}
        </div>
      )}

      {detail.bondRatings.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Credit Quality
          </p>
          <div className="space-y-1.5">
            {detail.bondRatings.slice(0, 8).map((r, i) => {
              const maxPct = Math.max(...detail.bondRatings.map((x) => x.pct));
              return (
                <div key={r.rating} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-foreground/80">{r.rating}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted/40">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(r.pct / maxPct) * 100}%`,
                          background: PALETTE[i % PALETTE.length],
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
                      {(r.pct * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Featured ETF discovery grid ── */

const CATEGORY_ORDER = [
  "US Large Cap",
  "US Large Cap Growth",
  "US Total Market",
  "US Small Cap",
  "Long Government",
  "Core Bond",
  "Short Government",
  "High Yield Bond",
  "Corp Bond",
  "Foreign Large Blend",
  "Diversified EM",
  "Technology Sector",
  "Financial Sector",
  "Healthcare Sector",
  "Energy Sector",
  "Industrials Sector",
  "Commodities - Gold",
  "Commodities - Silver",
  "Real Estate",
  "Large Cap Value",
  "Thematic - Innovation",
  "Thematic - Clean Energy",
  "Cryptocurrency",
];

function FeaturedEtfs({ heldSymbols }: { heldSymbols: string[] }) {
  const [expanded, setExpanded] = React.useState(false);

  const byCategory = React.useMemo(() => {
    const map = new Map<string, typeof FEATURED_ETFS>();
    for (const etf of FEATURED_ETFS) {
      if (!map.has(etf.category)) map.set(etf.category, []);
      map.get(etf.category)!.push(etf);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      etfs: map.get(c)!,
    }));
  }, []);

  return (
    <div className="glass overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-accent/5"
      >
        <div>
          <p className="text-sm font-semibold">ETF Discovery</p>
          <p className="text-xs text-muted-foreground">
            Popular ETFs across {byCategory.length} categories and multiple exchanges
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-5 py-4 space-y-5">
          {byCategory.map(({ category, etfs }) => (
            <div key={category}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {etfs.map((etf) => {
                  const held = heldSymbols.includes(etf.symbol);
                  return (
                    <div
                      key={etf.symbol}
                      className={cn(
                        "flex items-start justify-between rounded-lg border p-3 gap-2",
                        held
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/60 bg-card/30"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs font-bold">{etf.symbol}</span>
                          {held && (
                            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                              HELD
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                          {etf.name}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground whitespace-nowrap">
                        {etf.exchange}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
