"use client";

import { useEffect, useState } from "react";

type Tick = {
  symbol: string;
  label: string;
  price: number | null;
  changePct: number | null;
};

const MARKET_SYMBOLS = [
  { y: "^GSPC", label: "S&P 500" },
  { y: "^IXIC", label: "NASDAQ" },
  { y: "^DJI", label: "DOW" },
  { y: "^RUT", label: "RUSSELL" },
  { y: "^VIX", label: "VIX" },
  { y: "BTC-USD", label: "BTC" },
  { y: "ETH-USD", label: "ETH" },
  { y: "GC=F", label: "GOLD" },
  { y: "CL=F", label: "OIL" },
  { y: "DX-Y.NYB", label: "DXY" },
  { y: "^TNX", label: "10Y" },
];

function formatPrice(symbol: string, price: number | null): string {
  if (price == null) return "—";
  if (symbol === "BTC-USD" || symbol === "ETH-USD") {
    return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TickItem({ tick }: { tick: Tick }) {
  const up = (tick.changePct ?? 0) >= 0;
  return (
    <span className="inline-flex items-center gap-2.5 px-6 py-1 text-[13px] tracking-wide whitespace-nowrap">
      <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[0.18em]">
        {tick.label}
      </span>
      <span className="font-mono text-foreground tabular-nums">
        {formatPrice(tick.symbol, tick.price)}
      </span>
      <span
        className={`font-mono text-xs tabular-nums ${
          up ? "text-[hsl(var(--signal))]" : "text-[hsl(348_95%_65%)]"
        }`}
      >
        {tick.changePct == null
          ? ""
          : `${up ? "▲" : "▼"} ${Math.abs(tick.changePct).toFixed(2)}%`}
      </span>
      <span className="text-border">/</span>
    </span>
  );
}

export function MarqueeTicker() {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/markets/extended");
        const json = await res.json();
        if (json.data) {
          setTicks(
            MARKET_SYMBOLS.map((m) => {
              const q = json.data.find(
                (d: { symbol: string }) => d.symbol === m.y
              );
              return {
                symbol: m.y,
                label: m.label,
                price: q?.price ?? null,
                changePct: q?.changePct ?? null,
              };
            })
          );
        }
      } catch {
        // silent — leave placeholder
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (ticks.length === 0) {
    // Skeleton fallback while loading
    return (
      <div className="border-y border-border/60 bg-background/40 backdrop-blur-md">
        <div className="marquee">
          <div className="marquee-track" style={{ ["--marquee-duration" as string]: "60s" }}>
            {Array(2)
              .fill(0)
              .map((_, idx) => (
                <span key={idx} className="inline-flex">
                  {MARKET_SYMBOLS.map((m) => (
                    <span
                      key={m.y + idx}
                      className="inline-flex items-center gap-2.5 px-6 py-1 text-[13px] whitespace-nowrap"
                    >
                      <span className="font-mono text-[10px] uppercase text-muted-foreground tracking-[0.18em]">
                        {m.label}
                      </span>
                      <span className="font-mono text-muted-foreground/40">
                        ——
                      </span>
                      <span className="text-border">/</span>
                    </span>
                  ))}
                </span>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-y border-border/60 bg-background/40 backdrop-blur-md">
      <div className="marquee">
        <div
          className="marquee-track"
          style={{ ["--marquee-duration" as string]: "60s" }}
        >
          {[...ticks, ...ticks].map((t, idx) => (
            <TickItem key={t.symbol + idx} tick={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
