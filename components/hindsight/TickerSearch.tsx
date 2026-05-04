"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  symbol: string;
  name: string;
  exchange: string | null;
  type: string | null;
};

type Props = {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  accent?: "gain" | "pain";
  className?: string;
};

export function TickerSearch({
  value,
  onChange,
  placeholder = "Search ticker, e.g. AAPL",
  accent = "gain",
  className,
}: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function runSearch(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/ticker/search?q=${encodeURIComponent(q)}`);
        const j = await r.json();
        setResults(j.results ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function pick(s: Suggestion) {
    onChange(s.symbol);
    setQuery(s.symbol);
    setOpen(false);
  }

  const ringColor =
    accent === "gain"
      ? "focus-within:ring-hindsight-gain/40 focus-within:border-hindsight-gain/50"
      : "focus-within:ring-hindsight-pain/40 focus-within:border-hindsight-pain/50";

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 transition-all",
          "focus-within:bg-black/60 focus-within:ring-2",
          ringColor
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setQuery(v);
            runSearch(v);
          }}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter" && open && results[active]) {
              e.preventDefault();
              pick(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="h-11 w-full bg-transparent font-mono text-sm uppercase tracking-wide text-white placeholder:text-white/30 focus:outline-none"
          spellCheck={false}
          autoComplete="off"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border border-white/10 bg-[#0e1119] shadow-2xl">
          {results.map((r, i) => (
            <button
              key={r.symbol + i}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors",
                i === active ? "bg-white/5" : "hover:bg-white/[0.03]"
              )}
            >
              <div className="min-w-0">
                <div className="font-mono text-sm uppercase text-white">
                  {r.symbol}
                </div>
                <div className="truncate text-[11px] text-white/50">
                  {r.name}
                </div>
              </div>
              <div className="shrink-0 text-[10px] uppercase tracking-widest text-white/40">
                {r.exchange ?? r.type ?? ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
