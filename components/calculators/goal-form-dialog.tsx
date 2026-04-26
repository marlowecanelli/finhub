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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalcInput } from "./calc-input";
import type { Goal } from "@/lib/calculators";

export type GoalFormValues = {
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string; // ISO date
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Goal | null;
  onSubmit: (v: GoalFormValues) => Promise<void>;
};

export function GoalFormDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const isEdit = Boolean(initial);
  const [name, setName] = React.useState(initial?.name ?? "");
  const [target, setTarget] = React.useState<number | null>(initial?.target_amount ?? null);
  const [current, setCurrent] = React.useState<number | null>(initial?.current_amount ?? 0);
  const [date, setDate] = React.useState<string>(
    initial?.target_date ??
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setTarget(initial?.target_amount ?? null);
    setCurrent(initial?.current_amount ?? 0);
    setDate(
      initial?.target_date ??
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );
    setError(null);
    setSubmitting(false);
  }, [open, initial]);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Name required");
    if (target == null || target <= 0) return setError("Target must be > 0");
    if (current == null || current < 0) return setError("Current must be ≥ 0");
    if (!date) return setError("Target date required");
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        target_amount: target,
        current_amount: current,
        target_date: date,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit goal" : "New goal"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this savings goal." : "Set a target amount and a date."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="House down payment"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CalcInput
              id="goal-target"
              label="Target amount"
              prefix="$"
              value={target}
              onChange={setTarget}
            />
            <CalcInput
              id="goal-current"
              label="Current amount"
              prefix="$"
              value={current}
              onChange={setCurrent}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-date">Target date</Label>
            <Input
              id="goal-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              required
            />
          </div>

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
              {isEdit ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
