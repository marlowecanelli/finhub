"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Trophy,
  Flame,
  RotateCcw,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Target,
  Award,
  BarChart3,
  Activity,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ACHIEVEMENTS,
  STARTING_CASH,
  createInitialState,
  levelFromXp,
  loadState,
  portfolioValue,
  saveState,
  todayKey,
  type PaperPosition,
  type PaperState,
  type PaperTrade,
} from "@/lib/paper-trading";

type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
};

type Benchmark = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
};

type SearchHit = { symbol: string; shortname?: string; longname?: string; quoteType?: string };

function formatMoney(n: number, opts?: { sign?: boolean }): string {
  const s = n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts?.sign && n > 0) return `+${s}`;
  return s;
}

function formatPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const BENCHMARK_LABELS: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "Nasdaq",
  "^DJI": "Dow Jones",
  "BTC-USD": "Bitcoin",
};

export function PaperTradingClient() {
  const [state, setState] = useState<PaperState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [tradeSymbol, setTradeSymbol] = useState<string>("");
  const [tradeQuote, setTradeQuote] = useState<Quote | null>(null);
  const [tradeQty, setTradeQty] = useState<string>("");
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");
  const [searching, setSearching] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<SearchHit[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<{ kind: "win" | "loss" | "info"; text: string } | null>(null);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  // Fetch benchmarks once + every 60s
  useEffect(() => {
    const fetchBench = async () => {
      try {
        const res = await fetch("/api/paper-trading/benchmark", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setBenchmarks(data.benchmarks ?? []);
        }
      } catch {}
    };
    fetchBench();
    const id = setInterval(fetchBench, 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch prices for held symbols
  useEffect(() => {
    const symbols = Object.keys(state.positions);
    if (symbols.length === 0) return;
    let cancelled = false;
    const fetchAll = async () => {
      const entries = await Promise.all(
        symbols.map(async (s) => {
          try {
            const r = await fetch(`/api/paper-trading/quote?symbol=${encodeURIComponent(s)}`, { cache: "no-store" });
            if (!r.ok) return null;
            const j = (await r.json()) as Quote;
            if (typeof j.price === "number") return [s, j.price] as const;
            return null;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const map: Record<string, number> = {};
      for (const e of entries) if (e) map[e[0]] = e[1];
      setPrices((prev) => ({ ...prev, ...map }));
    };
    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [state.positions]);

  // Search (debounced)
  useEffect(() => {
    if (!searching) return;
    if (searchQ.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    searchAbort.current?.abort();
    const ctrl = new AbortController();
    searchAbort.current = ctrl;
    const id = setTimeout(async () => {
      try {
        const r = await fetch(`/api/ticker/search?q=${encodeURIComponent(searchQ)}`, { signal: ctrl.signal });
        if (r.ok) {
          const j = await r.json();
          setSearchResults((j.results ?? []).slice(0, 8));
        }
      } catch {}
    }, 200);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [searchQ, searching]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!unlocked) return;
    const id = setTimeout(() => setUnlocked(null), 4000);
    return () => clearTimeout(id);
  }, [unlocked]);

  const totalValue = useMemo(() => portfolioValue(state, prices), [state, prices]);
  const totalPnl = totalValue - state.startingCash;
  const totalPnlPct = (totalPnl / state.startingCash) * 100;
  const investedValue = totalValue - state.cash;
  const sp500 = benchmarks.find((b) => b.symbol === "^GSPC");
  const level = levelFromXp(state.xp);

  // Check achievements
  useEffect(() => {
    if (!hydrated) return;
    const newly: string[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!state.achievements.includes(a.id) && a.check(state, totalValue)) {
        newly.push(a.id);
      }
    }
    if (newly.length > 0) {
      setState((s) => ({ ...s, achievements: [...s.achievements, ...newly], xp: s.xp + 50 * newly.length }));
      const first = ACHIEVEMENTS.find((a) => a.id === newly[0]);
      if (first) setUnlocked(`${first.emoji} ${first.title} unlocked!`);
    }
  }, [state, totalValue, hydrated]);

  async function fetchQuote(symbol: string) {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;
    try {
      const r = await fetch(`/api/paper-trading/quote?symbol=${encodeURIComponent(sym)}`, { cache: "no-store" });
      if (!r.ok) {
        setTradeQuote(null);
        setToast({ kind: "loss", text: `Couldn't find ${sym}` });
        return;
      }
      const j = (await r.json()) as Quote;
      setTradeQuote(j);
      setTradeSymbol(j.symbol);
      if (typeof j.price === "number") {
        setPrices((p) => ({ ...p, [j.symbol]: j.price as number }));
      }
    } catch {
      setTradeQuote(null);
    }
  }

  function executeTrade() {
    if (!tradeQuote || typeof tradeQuote.price !== "number") return;
    const shares = parseFloat(tradeQty);
    if (!Number.isFinite(shares) || shares <= 0) return;
    const sym = tradeQuote.symbol.toUpperCase();
    const price = tradeQuote.price;
    const cost = shares * price;

    if (tradeSide === "buy") {
      if (cost > state.cash) {
        setToast({ kind: "loss", text: `Insufficient cash. Need ${formatMoney(cost)}` });
        return;
      }
      setState((s) => {
        const existing = s.positions[sym];
        const newShares = (existing?.shares ?? 0) + shares;
        const newAvg = existing
          ? (existing.avgCost * existing.shares + price * shares) / newShares
          : price;
        const trade: PaperTrade = { id: uid(), symbol: sym, side: "buy", shares, price, timestamp: Date.now() };
        const day = todayKey();
        const streak = s.lastTradeDay === day ? s.streak : s.streak + 1;
        return {
          ...s,
          cash: s.cash - cost,
          positions: { ...s.positions, [sym]: { symbol: sym, shares: newShares, avgCost: newAvg } },
          trades: [trade, ...s.trades],
          xp: s.xp + 10,
          lastTradeDay: day,
          streak,
        };
      });
      setToast({ kind: "info", text: `Bought ${shares} ${sym} @ ${formatMoney(price)}` });
    } else {
      const pos = state.positions[sym];
      if (!pos || pos.shares < shares) {
        setToast({ kind: "loss", text: `You only own ${pos?.shares ?? 0} shares of ${sym}` });
        return;
      }
      const realized = (price - pos.avgCost) * shares;
      setState((s) => {
        const existing = s.positions[sym];
        if (!existing) return s;
        const remaining = existing.shares - shares;
        const newPositions = { ...s.positions };
        if (remaining <= 0.0000001) delete newPositions[sym];
        else newPositions[sym] = { symbol: existing.symbol, shares: remaining, avgCost: existing.avgCost };
        const trade: PaperTrade = { id: uid(), symbol: sym, side: "sell", shares, price, timestamp: Date.now(), realizedPnl: realized };
        const day = todayKey();
        const streak = s.lastTradeDay === day ? s.streak : s.streak + 1;
        return {
          ...s,
          cash: s.cash + cost,
          positions: newPositions,
          trades: [trade, ...s.trades],
          xp: s.xp + 10 + (realized > 0 ? Math.min(50, Math.floor(realized / 20)) : 0),
          lastTradeDay: day,
          streak,
        };
      });
      setToast({
        kind: realized >= 0 ? "win" : "loss",
        text: realized >= 0
          ? `🎉 Sold ${shares} ${sym} • +${formatMoney(realized)} profit`
          : `Sold ${shares} ${sym} • ${formatMoney(realized)} loss`,
      });
    }

    setTradeQty("");
    setTradeQuote(null);
    setTradeSymbol("");
  }

  function resetAccount() {
    setState(createInitialState());
    setPrices({});
    setConfirmReset(false);
    setToast({ kind: "info", text: "Account reset — fresh $100,000" });
  }

  function quickBuy(amount: number) {
    if (!tradeQuote?.price) return;
    const sh = amount / tradeQuote.price;
    setTradeQty(sh.toFixed(4));
  }

  const positions = Object.values(state.positions);
  const dayOne = new Date(state.createdAt);
  const daysActive = Math.max(1, Math.floor((Date.now() - state.createdAt) / 86400000));

  // Benchmark relative
  const spChange = sp500?.changePercent ?? null;
  const vsBenchmark = spChange != null ? totalPnlPct - spChange : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Floating toasts */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4">
          <div
            className={cn(
              "rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md text-sm font-medium",
              toast.kind === "win" && "bg-emerald-500/20 border-emerald-500/40 text-emerald-100",
              toast.kind === "loss" && "bg-red-500/20 border-red-500/40 text-red-100",
              toast.kind === "info" && "bg-card border-border text-foreground"
            )}
          >
            {toast.text}
          </div>
        </div>
      )}
      {unlocked && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-top-4">
          <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md px-5 py-3 shadow-xl text-amber-100 font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {unlocked}
          </div>
        </div>
      )}

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-500/10 via-card to-blue-500/10 p-6 md:p-8">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Paper Trading Mode
            </div>
            <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
              Practice without the risk.
            </h1>
            <p className="mt-2 text-muted-foreground max-w-xl">
              You've got a simulated $100,000. Build a portfolio, race the S&P 500, and learn the markets — no real money on the line.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Account value</div>
              <div className={cn(
                "text-3xl md:text-4xl font-semibold tabular-nums tracking-tight",
                totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {formatMoney(totalValue)}
              </div>
              <div className={cn(
                "text-sm font-medium",
                totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {totalPnl >= 0 ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : <ArrowDownRight className="inline h-3.5 w-3.5" />}
                {formatMoney(totalPnl, { sign: true })} ({formatPct(totalPnlPct)})
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Buying Power"
          value={formatMoney(state.cash)}
          sub={`${((state.cash / totalValue) * 100).toFixed(1)}% cash`}
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Invested"
          value={formatMoney(investedValue)}
          sub={`${positions.length} position${positions.length === 1 ? "" : "s"}`}
        />
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="vs S&P 500 Today"
          value={vsBenchmark != null ? formatPct(vsBenchmark) : "—"}
          valueClass={vsBenchmark != null ? (vsBenchmark >= 0 ? "text-emerald-400" : "text-red-400") : ""}
          sub={sp500 && sp500.changePercent != null ? `SPX ${formatPct(sp500.changePercent)}` : "loading..."}
        />
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label={`Lvl ${level.level} • Streak`}
          value={`${state.streak} 🔥`}
          sub={`${level.progress}/${level.toNext} XP to lvl ${level.level + 1}`}
        />
      </div>

      {/* Benchmarks row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3">
            <Activity className="h-3.5 w-3.5" /> Benchmarks
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {benchmarks.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground">Loading market data...</div>
            )}
            {benchmarks.map((b) => {
              const label = BENCHMARK_LABELS[b.symbol] ?? b.name ?? b.symbol;
              const cp = b.changePercent;
              return (
                <div key={b.symbol} className="rounded-xl border bg-card/60 p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-lg font-semibold tabular-nums">
                    {b.price != null ? b.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
                  </div>
                  <div className={cn(
                    "text-xs font-medium",
                    cp == null ? "text-muted-foreground" : cp >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {cp != null ? formatPct(cp) : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Trade panel + Holdings */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Trade panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Place a Trade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={tradeSide === "buy" ? "default" : "outline"}
                onClick={() => setTradeSide("buy")}
                className={cn(tradeSide === "buy" && "bg-emerald-500 text-black hover:bg-emerald-400")}
              >
                Buy
              </Button>
              <Button
                variant={tradeSide === "sell" ? "default" : "outline"}
                onClick={() => setTradeSide("sell")}
                className={cn(tradeSide === "sell" && "bg-red-500 text-white hover:bg-red-400")}
              >
                Sell
              </Button>
            </div>

            <div className="relative">
              <div className="flex gap-2">
                <Input
                  placeholder="Search ticker (AAPL, TSLA...)"
                  value={searchQ}
                  onFocus={() => setSearching(true)}
                  onChange={(e) => {
                    setSearchQ(e.target.value);
                    setSearching(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      fetchQuote(searchQ);
                      setSearching(false);
                    }
                  }}
                />
              </div>
              {searching && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-xl max-h-64 overflow-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      className="w-full text-left px-3 py-2 hover:bg-card border-b last:border-b-0 text-sm"
                      onClick={() => {
                        fetchQuote(r.symbol);
                        setSearchQ(r.symbol);
                        setSearching(false);
                      }}
                    >
                      <div className="font-semibold">{r.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.shortname ?? r.longname ?? r.quoteType}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {tradeQuote && (
              <div className="rounded-xl border bg-card/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{tradeQuote.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">{tradeQuote.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold tabular-nums">
                      {tradeQuote.price != null ? formatMoney(tradeQuote.price) : "—"}
                    </div>
                    <div className={cn(
                      "text-xs",
                      (tradeQuote.changePercent ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                      {tradeQuote.changePercent != null ? formatPct(tradeQuote.changePercent) : ""}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Shares</label>
              <Input
                type="number"
                placeholder="0"
                value={tradeQty}
                onChange={(e) => setTradeQty(e.target.value)}
                step="0.0001"
              />
              {tradeSide === "buy" && tradeQuote?.price && (
                <div className="grid grid-cols-4 gap-1.5">
                  {[1000, 5000, 10000, state.cash].map((amt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => quickBuy(amt)}
                    >
                      {i === 3 ? "Max" : `$${(amt / 1000).toFixed(0)}k`}
                    </Button>
                  ))}
                </div>
              )}
              {tradeQuote?.price && tradeQty && (
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span>Estimated {tradeSide === "buy" ? "cost" : "proceeds"}</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney((parseFloat(tradeQty) || 0) * tradeQuote.price)}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant={tradeSide === "buy" ? "signal" : "default"}
              className={cn(
                "w-full",
                tradeSide === "sell" && "bg-red-500 text-white hover:bg-red-400"
              )}
              disabled={!tradeQuote?.price || !tradeQty || parseFloat(tradeQty) <= 0}
              onClick={executeTrade}
            >
              {tradeSide === "buy" ? "Buy" : "Sell"} {tradeQuote?.symbol ?? ""}
            </Button>
          </CardContent>
        </Card>

        {/* Holdings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            {positions.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                      <th className="pb-2 font-medium">Symbol</th>
                      <th className="pb-2 font-medium text-right">Shares</th>
                      <th className="pb-2 font-medium text-right">Avg Cost</th>
                      <th className="pb-2 font-medium text-right">Price</th>
                      <th className="pb-2 font-medium text-right">Value</th>
                      <th className="pb-2 font-medium text-right">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((p) => {
                      const px = prices[p.symbol];
                      const value = px != null ? px * p.shares : null;
                      const pnl = px != null ? (px - p.avgCost) * p.shares : null;
                      const pnlPct = px != null ? ((px - p.avgCost) / p.avgCost) * 100 : null;
                      return (
                        <tr key={p.symbol} className="border-b last:border-b-0 hover:bg-card/40">
                          <td className="py-3 font-semibold">{p.symbol}</td>
                          <td className="py-3 text-right tabular-nums">{p.shares.toFixed(4)}</td>
                          <td className="py-3 text-right tabular-nums">{formatMoney(p.avgCost)}</td>
                          <td className="py-3 text-right tabular-nums">{px != null ? formatMoney(px) : "..."}</td>
                          <td className="py-3 text-right tabular-nums font-medium">{value != null ? formatMoney(value) : "..."}</td>
                          <td className={cn(
                            "py-3 text-right tabular-nums font-medium",
                            pnl == null ? "" : pnl >= 0 ? "text-emerald-400" : "text-red-400"
                          )}>
                            {pnl != null ? (
                              <>
                                {formatMoney(pnl, { sign: true })}
                                <div className="text-xs opacity-80">{pnlPct != null ? formatPct(pnlPct) : ""}</div>
                              </>
                            ) : "..."}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievements + Trade history */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" /> Achievements
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                {state.achievements.length}/{ACHIEVEMENTS.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {ACHIEVEMENTS.map((a) => {
                const got = state.achievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "rounded-xl border p-3 text-center transition",
                      got
                        ? "bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-amber-500/30"
                        : "bg-card/40 border-border opacity-50"
                    )}
                    title={a.description}
                  >
                    <div className="text-2xl mb-1">{got ? a.emoji : "🔒"}</div>
                    <div className="text-xs font-semibold">{a.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{a.description}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {state.trades.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                Your trades will show up here.
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {state.trades.slice(0, 20).map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border bg-card/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-semibold",
                        t.side === "buy" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                      )}>
                        {t.side.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{t.symbol}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.shares.toFixed(4)} @ {formatMoney(t.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </div>
                      {t.realizedPnl != null && (
                        <div className={cn(
                          "text-xs font-semibold tabular-nums",
                          t.realizedPnl >= 0 ? "text-emerald-400" : "text-red-400"
                        )}>
                          {formatMoney(t.realizedPnl, { sign: true })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        Trading since {dayOne.toLocaleDateString()} • {daysActive} day{daysActive === 1 ? "" : "s"} active • Saved locally to this browser
      </div>

      {/* Reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmReset(false)}>
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-2">Reset account?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This wipes your positions, trades, XP, and achievements. You'll start fresh with $100,000.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={resetAccount}>Reset everything</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
          {icon}
          {label}
        </div>
        <div className={cn("text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 mb-3">
        <TrendingUp className="h-6 w-6 text-emerald-400" />
      </div>
      <div className="font-semibold mb-1">No positions yet</div>
      <div className="text-sm text-muted-foreground max-w-xs mx-auto">
        Search for a ticker, pick how many shares, and hit Buy. Your portfolio will grow here.
      </div>
    </div>
  );
}
