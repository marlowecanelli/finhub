"use client";

import { CAP_BUCKETS, type CapBucketKey } from "@/lib/screener";
import { cn } from "@/lib/utils";

type Props = {
  value: CapBucketKey[];
  onChange: (v: CapBucketKey[]) => void;
};

export function CapSelector({ value, onChange }: Props) {
  function toggle(k: CapBucketKey) {
    if (value.includes(k)) onChange(value.filter((x) => x !== k));
    else onChange([...value, k]);
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Market cap</p>
      <div className="flex flex-wrap gap-1.5">
        {CAP_BUCKETS.map((b) => {
          const active = value.includes(b.key);
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => toggle(b.key)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/15 text-foreground ring-1 ring-inset ring-primary/30"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:bg-accent/10 hover:text-foreground"
              )}
            >
              {b.label}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/70">
        Micro &lt;$300M · Small &lt;$2B · Mid &lt;$10B · Large &lt;$200B · Mega ≥$200B
      </p>
    </div>
  );
}
