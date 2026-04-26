"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  helpText?: string;
};

export function CalcInput({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = "any",
  min,
  placeholder,
  helpText,
}: Props) {
  const [text, setText] = React.useState<string>(value == null ? "" : String(value));

  // Sync external changes (e.g. preset, reset).
  React.useEffect(() => {
    const next = value == null ? "" : String(value);
    if (next !== text && document.activeElement?.id !== id) {
      setText(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handle(v: string) {
    setText(v);
    if (v.trim() === "") {
      onChange(null);
      return;
    }
    const n = Number(v);
    if (Number.isFinite(n)) onChange(n);
  }

  return (
    <div>
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div
        className={cn(
          "mt-1.5 flex items-center overflow-hidden rounded-lg border border-input bg-background/50 transition-colors focus-within:ring-2 focus-within:ring-ring"
        )}
      >
        {prefix && (
          <span className="select-none border-r border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={text}
          placeholder={placeholder}
          onChange={(e) => handle(e.target.value)}
          className="h-10 w-full bg-transparent px-3 font-mono text-sm focus:outline-none"
        />
        {suffix && (
          <span className="select-none border-l border-border/60 bg-muted/40 px-3 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {helpText && (
        <p className="mt-1 text-[11px] text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}
