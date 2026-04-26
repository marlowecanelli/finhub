"use client";

import * as React from "react";
import { BookmarkCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ScreenerPreset } from "@/lib/screener";

type Props = {
  presets: ScreenerPreset[];
  onApply: (p: ScreenerPreset) => void;
  onDelete: (id: string) => Promise<void>;
};

export function PresetMenu({ presets, onApply, onDelete }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="sm">
          <BookmarkCheck className="h-4 w-4" />
          Saved screens {presets.length > 0 ? `(${presets.length})` : ""}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        <DropdownMenuLabel>Saved screens</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {presets.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No saved screens yet.
          </p>
        ) : (
          presets.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onSelect={(e) => {
                e.preventDefault();
                onApply(p);
              }}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{p.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void onDelete(p.id);
                }}
                aria-label={`Delete ${p.name}`}
                className="rounded p-0.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
