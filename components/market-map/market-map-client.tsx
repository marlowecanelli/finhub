"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Treemap } from "recharts";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { IndexKey } from "@/lib/index-constituents";

type CellData = {
  symbol: string;
  name: string;
  weight: number;
  sector: string;
  changePct: number;
  price: number | null;
};

type TooltipState = {
  data: CellData;
  x: number;
  y: number;
} | null;

const INDEX_LABELS: Record<IndexKey, string> = {
  sp500: "S&P 500",
  nasdaq100: "Nasdaq 100",
  dow30: "Dow 30",
};

function heatColor(pct: number): string {
  const clamped = Math.max(-5, Math.min(5, pct));
  if (clamped >= 0) {
    const t = clamped / 5;
    const r = Math.round(22 - 22 * t + 30 * (1 - t));
    const g = Math.round(41 + 122 * t);
    const b = Math.round(59 - 15 * t);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = -clamped / 5;
    const r = Math.round(30 + 155 * t);
    const g = Math.round(41 - 13 * t);
    const b = Math.round(59 - 31 * t);
    return `rgb(${r},${g},${b})`;
  }
}

function fmtPct(n: number) {
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

function fmtPrice(price: number | null, symbol: string) {
  if (price == null) return "—";
  if (symbol.includes("BTC") || price > 50000) {
    return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return "$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MarketMapClient({ initialIndex }: { initialIndex: string }) {
  const router = useRouter();
  const validInitial = (["sp500", "nasdaq100", "dow30"].includes(initialIndex)
    ? initialIndex
    : "sp500") as IndexKey;

  const [activeIndex, setActiveIndex] = useState<IndexKey>(validInitial);
  const [cells, setCells] = useState<CellData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDims({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fetchData = useCallback(async (idx: IndexKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market-map?index=${idx}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCells(json.data ?? []);
      setLastUpdated(new Date());
    } catch {
      setError("Could not load market data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeIndex);
    const id = setInterval(() => fetchData(activeIndex), 60_000);
    return () => clearInterval(id);
  }, [activeIndex, fetchData]);

  const switchIndex = (idx: IndexKey) => {
    setActiveIndex(idx);
    router.replace(`/market-map?index=${idx}`, { scroll: false });
  };

  const treemapData = cells.map((c) => ({
    name: c.symbol,
    value: c.weight,
    symbol: c.symbol,
    fullName: c.name,
    sector: c.sector,
    changePct: c.changePct,
    price: c.price,
  }));

  const avgChange =
    cells.length > 0
      ? cells.reduce((sum, c) => sum + c.changePct * (c.weight / 100), 0) /
        cells.reduce((s, c) => s + c.weight / 100, 0)
      : 0;

  const gainers = cells.filter((c) => c.changePct > 0).length;
  const losers = cells.filter((c) => c.changePct < 0).length;

  return (
    <div className="flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3 md:px-8">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex flex-1 items-center gap-3">
            <h1 className="font-display text-xl font-medium tracking-tight">
              Market Map
            </h1>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              · {INDEX_LABELS[activeIndex]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-right">
            {lastUpdated && (
              <span className="hidden font-mono text-[10px] text-muted-foreground md:block">
                Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </span>
            )}
            <button
              onClick={() => fetchData(activeIndex)}
              disabled={loading}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-border hover:text-foreground disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 md:px-8">
        {/* ── Controls row ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Index tabs */}
          <div className="flex gap-1 rounded-xl border border-border/60 bg-card/40 p-1 backdrop-blur">
            {(["sp500", "nasdaq100", "dow30"] as IndexKey[]).map((idx) => (
              <button
                key={idx}
                onClick={() => switchIndex(idx)}
                className={`rounded-lg px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-all duration-200 ${
                  activeIndex === idx
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {INDEX_LABELS[idx]}
              </button>
            ))}
          </div>

          {/* Summary stats */}
          {!loading && cells.length > 0 && (
            <div className="flex items-center gap-6">
              <Stat
                label="Index Avg"
                value={fmtPct(avgChange)}
                positive={avgChange >= 0}
              />
              <Stat label="Advancing" value={String(gainers)} positive={true} />
              <Stat label="Declining" value={String(losers)} positive={false} />
            </div>
          )}
        </div>

        {/* ── Treemap ── */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-[#070b12]"
          style={{ height: "calc(100vh - 220px)", minHeight: 500 }}
          onMouseMove={(e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
          }}
          onMouseLeave={() => setTooltip(null)}
        >
          {loading && <SkeletonMap />}

          {error && (
            <div className="flex h-full items-center justify-center">
              <p className="font-mono text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {!loading && !error && treemapData.length > 0 && dims.w > 0 && dims.h > 0 && (
              <Treemap
                width={dims.w}
                height={dims.h}
                data={treemapData}
                dataKey="value"
                isAnimationActive={false}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                content={((rawProps: Record<string, unknown>) => {
                  const {
                    x, y, width, height,
                    symbol, fullName, changePct, price, depth,
                  } = rawProps as {
                    x: number; y: number; width: number; height: number;
                    symbol: string; fullName: string; changePct: number;
                    price: number | null; depth: number;
                  };

                  if (!symbol || depth === 0 || (width as number) < 3 || (height as number) < 3) {
                    return <g />;
                  }

                  const color = heatColor(changePct ?? 0);
                  const w = width as number;
                  const h = height as number;
                  const showSymbol = w > 36 && h > 26;
                  const showPct = w > 52 && h > 44;
                  const showName = w > 90 && h > 64;
                  const symSize = Math.min(15, Math.max(9, w / 7));
                  const pctSize = Math.max(8, symSize - 3);
                  const nameSize = Math.max(8, symSize - 5);

                  return (
                    <g>
                      <rect
                        x={(x as number) + 1}
                        y={(y as number) + 1}
                        width={w - 2}
                        height={h - 2}
                        fill={color}
                        rx={3}
                        style={{ cursor: "pointer", transition: "filter 0.15s" }}
                        onMouseEnter={() =>
                          setTooltip({
                            data: { symbol, name: fullName, weight: 0, sector: "", changePct, price },
                            x: mouseRef.current.x,
                            y: mouseRef.current.y,
                          })
                        }
                        onMouseMove={() =>
                          setTooltip((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  x: mouseRef.current.x,
                                  y: mouseRef.current.y,
                                }
                              : prev
                          )
                        }
                        onMouseLeave={() => setTooltip(null)}
                      />
                      {/* Subtle inner highlight */}
                      <rect
                        x={(x as number) + 1}
                        y={(y as number) + 1}
                        width={w - 2}
                        height={Math.min(3, h - 2)}
                        fill="rgba(255,255,255,0.08)"
                        rx={3}
                        style={{ pointerEvents: "none" }}
                      />
                      {showSymbol && (
                        <text
                          x={(x as number) + w / 2}
                          y={(y as number) + h / 2 + (showPct ? (showName ? -16 : -8) : 0)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.95)"
                          fontSize={symSize}
                          fontWeight={700}
                          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                          style={{ pointerEvents: "none", letterSpacing: "0.04em" }}
                        >
                          {symbol}
                        </text>
                      )}
                      {showPct && (
                        <text
                          x={(x as number) + w / 2}
                          y={(y as number) + h / 2 + (showName ? 4 : 8)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={
                            (changePct ?? 0) >= 0
                              ? "rgba(134,239,172,0.9)"
                              : "rgba(252,165,165,0.9)"
                          }
                          fontSize={pctSize}
                          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
                          style={{ pointerEvents: "none" }}
                        >
                          {fmtPct(changePct ?? 0)}
                        </text>
                      )}
                      {showName && (
                        <text
                          x={(x as number) + w / 2}
                          y={(y as number) + h / 2 + 20}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="rgba(255,255,255,0.45)"
                          fontSize={nameSize}
                          fontFamily="Inter, sans-serif"
                          style={{ pointerEvents: "none" }}
                        >
                          {(fullName as string)?.length > 14
                            ? (fullName as string).slice(0, 14) + "…"
                            : fullName}
                        </text>
                      )}
                    </g>
                  );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                }) as any}
              />
          )}

          {/* Floating tooltip */}
          {tooltip && (
            <HoverTooltip tooltip={tooltip} />
          )}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center justify-center gap-4 pb-2">
          <LegendBar />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="text-right">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 font-mono text-sm font-medium tabular-nums"
        style={{ color: positive ? "hsl(142 72% 60%)" : "hsl(348 95% 65%)" }}
      >
        {value}
      </p>
    </div>
  );
}

function HoverTooltip({ tooltip }: { tooltip: NonNullable<TooltipState> }) {
  const { data, x, y } = tooltip;

  return (
    <div
      className="pointer-events-none fixed z-50 min-w-[160px] rounded-xl border border-border/80 bg-card/95 p-3 shadow-xl backdrop-blur-xl"
      style={{
        left: x + 14,
        top: y - 10,
        transform: "translateY(-50%)",
      }}
    >
      <p className="font-mono text-xs font-bold tracking-wide text-foreground">
        {data.symbol}
      </p>
      <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
        {data.name}
      </p>
      <div className="mt-2 border-t border-border/60 pt-2">
        <div className="flex justify-between gap-4">
          <span className="font-mono text-[10px] text-muted-foreground">Price</span>
          <span className="font-mono text-[11px] tabular-nums text-foreground">
            {fmtPrice(data.price, data.symbol)}
          </span>
        </div>
        <div className="mt-1 flex justify-between gap-4">
          <span className="font-mono text-[10px] text-muted-foreground">Change</span>
          <span
            className="font-mono text-[11px] tabular-nums font-medium"
            style={{
              color:
                data.changePct >= 0 ? "hsl(142 72% 60%)" : "hsl(348 95% 65%)",
            }}
          >
            {fmtPct(data.changePct)}
          </span>
        </div>
      </div>
    </div>
  );
}

function LegendBar() {
  const stops = [-5, -3, -1, 0, 1, 3, 5];
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[9px] text-muted-foreground">Bearish</span>
      <div
        className="h-2.5 w-40 rounded-full"
        style={{
          background: `linear-gradient(to right, ${heatColor(-5)}, ${heatColor(-2.5)}, ${heatColor(0)}, ${heatColor(2.5)}, ${heatColor(5)})`,
        }}
      />
      <div className="flex gap-2">
        {stops.map((v) => (
          <span key={v} className="font-mono text-[9px] text-muted-foreground">
            {v > 0 ? `+${v}` : v}%
          </span>
        ))}
      </div>
      <span className="font-mono text-[9px] text-muted-foreground">Bullish</span>
    </div>
  );
}

function SkeletonMap() {
  return (
    <div className="absolute inset-0 flex flex-col gap-1 p-1">
      {[40, 25, 20, 15].map((h, i) => (
        <div key={i} className="flex flex-1 gap-1" style={{ flex: h }}>
          {[60, 30, 10].map((w, j) => (
            <div
              key={j}
              className="animate-pulse rounded bg-white/5"
              style={{ flex: w }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
