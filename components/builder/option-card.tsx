"use client";

import * as React from "react";
import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
};

export function OptionCard({ icon: Icon, title, description, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col items-start overflow-hidden rounded-2xl border p-5 text-left transition-all",
        selected
          ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.5)_inset,0_8px_24px_-12px_hsl(var(--primary)/0.4)]"
          : "border-border/60 bg-card/40 hover:border-white/20 hover:bg-card/60"
      )}
    >
      {selected && (
        <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}
      {Icon && (
        <div
          className={cn(
            "mb-3 flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
            selected
              ? "bg-primary/20 text-primary ring-1 ring-inset ring-primary/40"
              : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </button>
  );
}
