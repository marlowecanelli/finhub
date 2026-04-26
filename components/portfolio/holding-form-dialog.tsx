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
import { TickerAutocomplete } from "./ticker-autocomplete";
import type { Holding } from "@/lib/portfolio";

export type HoldingFormValues = {
  ticker: string;
  shares: number;
  cost_basis: number;
  purchase_date: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Holding | null;
  onSubmit: (values: HoldingFormValues) => Promise<void>;
};

export function HoldingFormDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const isEdit = Boolean(initial);
  const [ticker, setTicker] = React.useState(initial?.ticker ?? "");
  const [shares, setShares] = React.useState<string>(
    initial?.shares != null ? String(initial.shares) : ""
  );
  const [costBasis, setCostBasis] = React.useState<string>(
    initial?.cost_basis != null ? String(initial.cost_basis) : ""
  );
  const [purchaseDate, setPurchaseDate] = React.useState<string>(
    initial?.purchase_date ?? new Date().toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTicker(initial?.ticker ?? "");
    setShares(initial?.shares != null ? String(initial.shares) : "");
    setCostBasis(initial?.cost_basis != null ? String(initial.cost_basis) : "");
    setPurchaseDate(initial?.purchase_date ?? new Date().toISOString().slice(0, 10));
    setError(null);
    setSubmitting(false);
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const sharesN = Number(shares);
    const costN = Number(costBasis);

    if (!ticker.trim()) return setError("Ticker is required");
    if (!Number.isFinite(sharesN) || sharesN <= 0) return setError("Shares must be > 0");
    if (!Number.isFinite(costN) || costN < 0) return setError("Cost basis must be ≥ 0");
    if (!purchaseDate) return setError("Purchase date is required");

    setSubmitting(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        shares: sharesN,
        cost_basis: costN,
        purchase_date: purchaseDate,
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
          <DialogTitle>{isEdit ? "Edit holding" : "Add holding"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this position."
              : "Add a stock or ETF to your portfolio."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker</Label>
            <TickerAutocomplete
              value={ticker}
              onChange={setTicker}
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Ticker can&apos;t be changed after creation.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares</Label>
              <Input
                id="shares"
                type="number"
                min="0"
                step="0.0001"
                inputMode="decimal"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="10"
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost / share</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                placeholder="150.00"
                className="font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Purchase date</Label>
            <Input
              id="date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
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
              {isEdit ? "Save changes" : "Add holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
