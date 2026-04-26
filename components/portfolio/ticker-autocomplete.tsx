"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  symbol: string;
  name: string;
  exchange: string | null;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: Suggestion) => void;
  disabled?: boolean;
};

export function TickerAutocomplete({ value, onChange, onSelect, disabled }: Props) {
  const [results, setResults] = React.useState<Suggestion[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const q = value.trim();
    if (q.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/ticker/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        const data = await r.json();
        setResults(data.results ?? []);
        setHighlight(0);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [value]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function pick(s: Suggestion) {
    onChange(s.symbol.toUpperCase());
    onSelect?.(s);
    setOpen(false);
    setResults([]);
    inputRef.current?.blur();
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlight]) {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        placeholder="Ticker (e.g. AAPL)"
        className="h-10 w-full rounded-lg border border-input bg-background/50 pl-9 pr-3 font-mono text-sm uppercase placeholder:text-muted-foreground placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      />
      {open && (loading || results.length > 0) && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-xl">
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </div>
          ) : (
            <ul className="p-1">
              {results.map((r, i) => (
                <li key={`${r.symbol}-${i}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(r)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      i === highlight ? "bg-accent/10" : "hover:bg-accent/10"
                    )}
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold">{r.symbol}</span>
                      <p className="truncate text-xs text-muted-foreground">{r.name}</p>
                    </div>
                    {r.exchange && (
                      <span className="shrink-0 rounded bg-muted/60 px-1 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                        {r.exchange}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
