"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalcInput } from "./calc-input";
import { formatCurrency } from "@/lib/utils";
import type { Goal } from "@/lib/calculators";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  goal: Goal | null;
  onSubmit: (newAmount: number) => Promise<void>;
};

export function UpdateProgressDialog({ open, onOpenChange, goal, onSubmit }: Props) {
  const [mode, setMode] = React.useState<"add" | "set">("add");
  const [delta, setDelta] = React.useState<number | null>(null);
  const [absolute, setAbsolute] = React.useState<number | null>(goal?.current_amount ?? 0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setMode("add");
    setDelta(null);
    setAbsolute(goal?.current_amount ?? 0);
    setError(null);
    setSubmitting(false);
  }, [open, goal]);

  if (!goal) return null;

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    setError(null);
    let next: number;
    if (mode === "add") {
      if (delta == null || !Number.isFinite(delta)) return setError("Enter an amount");
      next = goal.current_amount + delta;
    } else {
      if (absolute == null || absolute < 0) return setError("Enter a valid amount");
      next = absolute;
    }
    if (next < 0) next = 0;
    setSubmitting(true);
    try {
      await onSubmit(next);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update progress</DialogTitle>
          <DialogDescription>
            Currently {formatCurrency(goal.current_amount)} of{" "}
            {formatCurrency(goal.target_amount)} for &quot;{goal.name}&quot;.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handle} className="space-y-4">
          <div className="inline-flex rounded-lg border border-border/60 bg-background/50 p-0.5">
            {(["add", "set"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "add" ? "Add deposit" : "Set total"}
              </button>
            ))}
          </div>

          {mode === "add" ? (
            <CalcInput
              id="add-amt"
              label="Amount to add"
              prefix="$"
              value={delta}
              onChange={setDelta}
              placeholder="500"
            />
          ) : (
            <CalcInput
              id="set-amt"
              label="New total amount"
              prefix="$"
              value={absolute}
              onChange={setAbsolute}
            />
          )}

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
