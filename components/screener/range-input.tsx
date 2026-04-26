"use client";

import { Input } from "@/components/ui/input";

type Props = {
  label: string;
  unit?: string;
  step?: string;
  min?: string;
  max?: number | null;
  value: { min: number | null; max: number | null };
  onChange: (next: { min: number | null; max: number | null }) => void;
};

export function RangeInput({ label, unit, step = "any", value, onChange }: Props) {
  function parse(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {unit && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          placeholder="Min"
          value={value.min ?? ""}
          onChange={(e) => onChange({ ...value, min: parse(e.target.value) })}
          className="h-9 font-mono text-xs"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="number"
          inputMode="decimal"
          step={step}
          placeholder="Max"
          value={value.max ?? ""}
          onChange={(e) => onChange({ ...value, max: parse(e.target.value) })}
          className="h-9 font-mono text-xs"
        />
      </div>
    </div>
  );
}
