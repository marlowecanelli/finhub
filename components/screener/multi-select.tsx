"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  placeholder?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
};

export function MultiSelect({ label, placeholder = "Any", options, value, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  function toggle(v: string) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }

  const filtered = options.filter((o) =>
    filter ? o.toLowerCase().includes(filter.toLowerCase()) : true
  );

  const summary =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? value.join(", ")
        : `${value.length} selected`;

  return (
    <div ref={ref} className="relative">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background/50 px-3 text-left text-sm transition-colors",
          open && "ring-2 ring-ring",
          value.length === 0 && "text-muted-foreground"
        )}
      >
        <span className="truncate">{summary}</span>
        <div className="flex items-center gap-1.5">
          {value.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange([]);
                }
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              aria-label={`Clear ${label}`}
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-xl">
          <div className="border-b border-border/60 p-2">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={`Filter ${label.toLowerCase()}…`}
              className="h-8 w-full rounded-md border border-border/60 bg-background/50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-xs text-muted-foreground">No matches</li>
            ) : (
              filtered.map((o) => {
                const selected = value.includes(o);
                return (
                  <li key={o}>
                    <button
                      type="button"
                      onClick={() => toggle(o)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        selected ? "bg-primary/10 text-foreground" : "hover:bg-accent/10"
                      )}
                    >
                      <span className="truncate">{o}</span>
                      {selected && <Check className="h-3 w-3 text-primary" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
