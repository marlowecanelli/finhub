"use client";

import * as React from "react";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
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
import { parseBrokerCSV, mergeLots, type MergeStrategy, type ParsedLot } from "@/lib/broker-csv";
import type { Holding } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export type HoldingFormValues = {
  ticker: string;
  shares: number;
  cost_basis: number;
  purchase_date: string;
};

type InputMode = "standard" | "total-invested" | "quick-add" | "multi-lot" | "broker-import";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Holding | null;
  onSubmit: (values: HoldingFormValues) => Promise<void>;
  onBulkSubmit?: (rows: HoldingFormValues[]) => Promise<void>;
};

const MODES: { id: InputMode; label: string; desc: string }[] = [
  { id: "standard",       label: "Per Share",     desc: "Enter cost per share" },
  { id: "total-invested", label: "Total Paid",     desc: "Enter total amount paid" },
  { id: "quick-add",      label: "Quick Add",      desc: "Just ticker & shares" },
  { id: "multi-lot",      label: "Multiple Lots",  desc: "Same ticker, several buys" },
  { id: "broker-import",  label: "Broker Import",  desc: "CSV from Fidelity, Schwab, Robinhood…" },
];

type LotRow = { id: number; shares: string; cost: string; date: string };

let nextId = 1;
function newLot(date = todayISO()): LotRow {
  return { id: nextId++, shares: "", cost: "", date };
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function HoldingFormDialog({ open, onOpenChange, initial, onSubmit, onBulkSubmit }: Props) {
  const isEdit = Boolean(initial);

  // ── shared state ──
  const [mode, setMode] = React.useState<InputMode>("standard");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── single-entry state ──
  const [ticker, setTicker] = React.useState(initial?.ticker ?? "");
  const [shares, setShares] = React.useState(initial?.shares != null ? String(initial.shares) : "");
  const [costBasis, setCostBasis] = React.useState(initial?.cost_basis != null ? String(initial.cost_basis) : "");
  const [totalInvested, setTotalInvested] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState(initial?.purchase_date ?? todayISO());

  // ── multi-lot state ──
  const [lotTicker, setLotTicker] = React.useState("");
  const [lots, setLots] = React.useState<LotRow[]>([newLot(), newLot()]);

  // ── broker import state ──
  const [csvText, setCsvText] = React.useState("");
  const [parseResult, setParseResult] = React.useState<ReturnType<typeof parseBrokerCSV> | null>(null);
  const [mergeStrategy, setMergeStrategy] = React.useState<MergeStrategy>("separate-lots");
  const fileRef = React.useRef<HTMLInputElement>(null);

  // reset on open/close
  React.useEffect(() => {
    if (!open) return;
    setMode("standard");
    setTicker(initial?.ticker ?? "");
    setShares(initial?.shares != null ? String(initial.shares) : "");
    setCostBasis(initial?.cost_basis != null ? String(initial.cost_basis) : "");
    setTotalInvested("");
    setPurchaseDate(initial?.purchase_date ?? todayISO());
    setLotTicker("");
    setLots([newLot(), newLot()]);
    setCsvText("");
    setParseResult(null);
    setMergeStrategy("separate-lots");
    setError(null);
    setSubmitting(false);
  }, [open, initial]);

  // auto-parse CSV whenever text changes
  React.useEffect(() => {
    if (mode !== "broker-import" || !csvText.trim()) { setParseResult(null); return; }
    setParseResult(parseBrokerCSV(csvText));
  }, [csvText, mode]);

  const impliedCostPerShare = React.useMemo(() => {
    const s = Number(shares), t = Number(totalInvested);
    return s > 0 && t >= 0 ? t / s : null;
  }, [shares, totalInvested]);

  const finalLots = React.useMemo<ParsedLot[]>(() => {
    if (!parseResult) return [];
    return mergeLots(parseResult.lots, mergeStrategy);
  }, [parseResult, mergeStrategy]);

  // ── lot helpers ──
  function addLot() { setLots((l) => [...l, newLot(l.at(-1)?.date ?? todayISO())]); }
  function removeLot(id: number) { setLots((l) => l.filter((r) => r.id !== id)); }
  function updateLot(id: number, patch: Partial<LotRow>) {
    setLots((l) => l.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  // ── submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "broker-import") {
      if (finalLots.length === 0) return setError("No valid holdings found — check the format guide below");
      setSubmitting(true);
      try {
        const rows: HoldingFormValues[] = finalLots.map((l) => ({
          ticker: l.ticker,
          shares: l.shares,
          cost_basis: l.cost_basis,
          purchase_date: l.purchase_date,
        }));
        if (onBulkSubmit) await onBulkSubmit(rows);
        else for (const r of rows) await onSubmit(r);
        onOpenChange(false);
      } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
      finally { setSubmitting(false); }
      return;
    }

    if (mode === "multi-lot") {
      if (!lotTicker.trim()) return setError("Ticker is required");
      const validLots = lots.filter((r) => r.shares && Number(r.shares) > 0);
      if (validLots.length === 0) return setError("Add at least one lot with shares > 0");
      setSubmitting(true);
      try {
        for (const r of validLots) {
          await onSubmit({
            ticker: lotTicker.trim().toUpperCase(),
            shares: Number(r.shares),
            cost_basis: Number(r.cost) || 0,
            purchase_date: r.date || todayISO(),
          });
        }
        onOpenChange(false);
      } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
      finally { setSubmitting(false); }
      return;
    }

    // single-entry modes
    const sharesN = Number(shares);
    if (!ticker.trim()) return setError("Ticker is required");
    if (!Number.isFinite(sharesN) || sharesN <= 0) return setError("Shares must be > 0");

    let costPerShare = 0;
    if (mode === "standard") {
      const c = Number(costBasis);
      if (!Number.isFinite(c) || c < 0) return setError("Cost basis must be ≥ 0");
      costPerShare = c;
    } else if (mode === "total-invested") {
      const t = Number(totalInvested);
      if (!Number.isFinite(t) || t < 0) return setError("Total invested must be ≥ 0");
      costPerShare = sharesN > 0 ? t / sharesN : 0;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ticker: ticker.trim().toUpperCase(),
        shares: sharesN,
        cost_basis: costPerShare,
        purchase_date: purchaseDate || todayISO(),
      });
      onOpenChange(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to save"); }
    finally { setSubmitting(false); }
  }

  const activeModes = isEdit ? MODES.filter((m) => m.id !== "multi-lot" && m.id !== "broker-import") : MODES;

  // submit button label
  const submitLabel = (() => {
    if (isEdit) return "Save changes";
    if (mode === "broker-import") return finalLots.length > 0 ? `Import ${finalLots.length} holding${finalLots.length !== 1 ? "s" : ""}` : "Import";
    if (mode === "multi-lot") {
      const n = lots.filter((r) => r.shares && Number(r.shares) > 0).length;
      return n > 0 ? `Add ${n} lot${n !== 1 ? "s" : ""}` : "Add lots";
    }
    return "Add holding";
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-w-lg", mode === "broker-import" && "max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit holding" : "Add holding"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details for this position."
              : "Choose how you'd like to enter your holding."}
          </DialogDescription>
        </DialogHeader>

        {/* Mode picker */}
        {!isEdit && (
          <div className="grid grid-cols-5 gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
            {activeModes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMode(m.id); setError(null); }}
                className={cn(
                  "rounded-md px-1 py-2 text-center text-[11px] font-medium leading-tight transition-colors",
                  mode === m.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Broker Import ── */}
          {mode === "broker-import" && (
            <BrokerImportMode
              csvText={csvText}
              onCsvTextChange={setCsvText}
              parseResult={parseResult}
              mergeStrategy={mergeStrategy}
              onMergeStrategyChange={setMergeStrategy}
              finalLots={finalLots}
              fileRef={fileRef}
            />
          )}

          {/* ── Multi-lot ── */}
          {mode === "multi-lot" && (
            <MultiLotMode
              ticker={lotTicker}
              onTickerChange={setLotTicker}
              lots={lots}
              onAddLot={addLot}
              onRemoveLot={removeLot}
              onUpdateLot={updateLot}
            />
          )}

          {/* ── Single-entry modes ── */}
          {mode !== "broker-import" && mode !== "multi-lot" && (
            <>
              <div className="space-y-2">
                <Label>Ticker</Label>
                <TickerAutocomplete value={ticker} onChange={setTicker} disabled={isEdit} />
                {isEdit && (
                  <p className="text-xs text-muted-foreground">Ticker can&apos;t be changed after creation.</p>
                )}
              </div>

              <div className={cn("grid gap-3", mode !== "quick-add" ? "grid-cols-2" : "grid-cols-1")}>
                <div className="space-y-2">
                  <Label>Shares</Label>
                  <Input
                    type="number" min="0" step="0.0001" inputMode="decimal"
                    value={shares} onChange={(e) => setShares(e.target.value)}
                    placeholder="10" className="font-mono" required
                  />
                </div>

                {mode === "standard" && (
                  <div className="space-y-2">
                    <Label>Cost / share</Label>
                    <Input
                      type="number" min="0" step="0.01" inputMode="decimal"
                      value={costBasis} onChange={(e) => setCostBasis(e.target.value)}
                      placeholder="150.00" className="font-mono" required
                    />
                  </div>
                )}

                {mode === "total-invested" && (
                  <div className="space-y-2">
                    <Label>Total invested ($)</Label>
                    <Input
                      type="number" min="0" step="0.01" inputMode="decimal"
                      value={totalInvested} onChange={(e) => setTotalInvested(e.target.value)}
                      placeholder="1500.00" className="font-mono" required
                    />
                    {impliedCostPerShare != null && Number(shares) > 0 && (
                      <p className="text-xs text-muted-foreground">= ${impliedCostPerShare.toFixed(4)} / share</p>
                    )}
                  </div>
                )}
              </div>

              {mode === "quick-add" && (
                <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Cost basis will be set to $0.00. You can edit this later.
                </p>
              )}

              <div className="space-y-2">
                <Label>Purchase date</Label>
                <Input
                  type="date" value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  max={todayISO()}
                  required={mode !== "quick-add"}
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || (mode === "broker-import" && finalLots.length === 0)}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Multi-lot sub-component ───────────────────────────────────────────────────

function MultiLotMode({
  ticker, onTickerChange, lots, onAddLot, onRemoveLot, onUpdateLot,
}: {
  ticker: string;
  onTickerChange: (v: string) => void;
  lots: LotRow[];
  onAddLot: () => void;
  onRemoveLot: (id: number) => void;
  onUpdateLot: (id: number, patch: Partial<LotRow>) => void;
}) {
  const totalShares = lots.reduce((s, r) => s + (Number(r.shares) || 0), 0);
  const totalCost = lots.reduce((s, r) => s + (Number(r.shares) || 0) * (Number(r.cost) || 0), 0);
  const avgCost = totalShares > 0 ? totalCost / totalShares : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ticker</Label>
        <TickerAutocomplete value={ticker} onChange={onTickerChange} />
        <p className="text-xs text-muted-foreground">
          Add one row per purchase. Great for dollar-cost averaging (DCA) — each lot is stored separately so you can track exact tax basis.
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_1fr_1.2fr_2rem] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground px-1">
        <span>Shares</span>
        <span>Price / share</span>
        <span>Purchase date</span>
        <span />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {lots.map((lot, i) => (
          <div key={lot.id} className="grid grid-cols-[1fr_1fr_1.2fr_2rem] gap-2 items-center">
            <Input
              type="number" min="0" step="0.0001" inputMode="decimal"
              value={lot.shares} onChange={(e) => onUpdateLot(lot.id, { shares: e.target.value })}
              placeholder="10" className="font-mono text-xs h-8"
              aria-label={`Lot ${i + 1} shares`}
            />
            <Input
              type="number" min="0" step="0.01" inputMode="decimal"
              value={lot.cost} onChange={(e) => onUpdateLot(lot.id, { cost: e.target.value })}
              placeholder="150.00" className="font-mono text-xs h-8"
              aria-label={`Lot ${i + 1} price`}
            />
            <Input
              type="date" value={lot.date}
              onChange={(e) => onUpdateLot(lot.id, { date: e.target.value })}
              max={todayISO()} className="text-xs h-8"
              aria-label={`Lot ${i + 1} date`}
            />
            <button
              type="button"
              onClick={() => onRemoveLot(lot.id)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              aria-label="Remove lot"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddLot}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
      >
        <Plus className="h-3 w-3" /> Add another lot
      </button>

      {totalShares > 0 && (
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total shares</p>
            <p className="font-mono font-medium">{totalShares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total invested</p>
            <p className="font-mono font-medium">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg cost / share</p>
            <p className="font-mono font-medium">${avgCost.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Broker import sub-component ───────────────────────────────────────────────

const BROKER_GUIDES: { name: string; steps: string[] }[] = [
  {
    name: "Fidelity",
    steps: [
      "Go to Accounts → Positions",
      "Click the Download icon (top-right of positions table)",
      "Open the CSV and paste all contents here",
    ],
  },
  {
    name: "Robinhood",
    steps: [
      "Go to Account → Reports & Statements",
      "Set date range, click Generate Report → Download CSV",
      "Paste all contents here",
    ],
  },
  {
    name: "Charles Schwab",
    steps: [
      "Go to Accounts → History (or Positions)",
      "Click Export → CSV",
      "Paste all contents here",
    ],
  },
  {
    name: "JP Morgan / Chase",
    steps: [
      "Log in → Investments → Transactions",
      "Click Things you can do → CSV",
      "Paste all contents here",
    ],
  },
  {
    name: "E*Trade",
    steps: [
      "Go to Accounts → Transactions",
      "Click Export, choose CSV",
      "Paste all contents here",
    ],
  },
];

function BrokerImportMode({
  csvText, onCsvTextChange, parseResult, mergeStrategy, onMergeStrategyChange, finalLots, fileRef,
}: {
  csvText: string;
  onCsvTextChange: (v: string) => void;
  parseResult: ReturnType<typeof parseBrokerCSV> | null;
  mergeStrategy: MergeStrategy;
  onMergeStrategyChange: (s: MergeStrategy) => void;
  finalLots: ReturnType<typeof mergeLots>;
  fileRef: React.RefObject<HTMLInputElement>;
}) {
  const [guideOpen, setGuideOpen] = React.useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onCsvTextChange(String(ev.target?.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Textarea + upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Paste your broker CSV</Label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuideOpen((o) => !o)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              How to export from my broker?
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="h-3 w-3" /> Upload file
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <textarea
          value={csvText}
          onChange={(e) => onCsvTextChange(e.target.value)}
          placeholder="Paste the contents of your broker's CSV export here..."
          rows={6}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Broker guides */}
      {guideOpen && (
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-3">
          <p className="text-xs font-medium">How to export from your broker:</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {BROKER_GUIDES.map((b) => (
              <div key={b.name} className="space-y-1">
                <p className="text-xs font-semibold">{b.name}</p>
                <ol className="space-y-0.5">
                  {b.steps.map((s, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                      <span className="shrink-0 font-mono text-primary">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected format badge */}
      {parseResult && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            parseResult.format === "unknown"
              ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
              : "bg-primary/10 text-primary border border-primary/20"
          )}>
            {parseResult.format === "unknown" ? "⚠ Unrecognized" : "✓"} {parseResult.formatLabel}
          </span>
          {parseResult.skipped > 0 && (
            <span className="text-xs text-muted-foreground">{parseResult.skipped} non-buy rows skipped</span>
          )}
        </div>
      )}

      {/* Merge strategy — only relevant if there are duplicate tickers */}
      {parseResult && parseResult.lots.length > 0 && (() => {
        const tickers = parseResult.lots.map((l) => l.ticker);
        const hasDupes = new Set(tickers).size < tickers.length;
        if (!hasDupes) return null;
        return (
          <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
            <p className="text-xs font-medium">
              Multiple purchases detected for the same ticker — how should they be stored?
            </p>
            <div className="flex flex-col gap-2">
              {(["separate-lots", "weighted-average"] as MergeStrategy[]).map((s) => (
                <label key={s} className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="mergeStrategy"
                    value={s}
                    checked={mergeStrategy === s}
                    onChange={() => onMergeStrategyChange(s)}
                    className="mt-0.5"
                  />
                  <span className="text-xs">
                    {s === "separate-lots"
                      ? <><strong>Keep separate lots</strong> — each buy is its own row, exact tax basis preserved</>
                      : <><strong>Merge into one</strong> — blended average cost per share, single row per ticker</>
                    }
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Preview table */}
      {finalLots.length > 0 && (
        <div className="rounded-md border border-border/60 overflow-hidden">
          <div className="bg-muted/30 px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Preview — {finalLots.length} holding{finalLots.length !== 1 ? "s" : ""} to import
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-background/90 backdrop-blur-sm">
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-3 py-1.5 text-left font-medium">Ticker</th>
                  <th className="px-3 py-1.5 text-right font-medium">Shares</th>
                  <th className="px-3 py-1.5 text-right font-medium">Cost / share</th>
                  <th className="px-3 py-1.5 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {finalLots.map((lot, i) => (
                  <tr key={i} className="hover:bg-accent/5">
                    <td className="px-3 py-1.5 font-mono font-semibold">{lot.ticker}</td>
                    <td className="px-3 py-1.5 text-right font-mono">
                      {lot.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                      {lot.cost_basis > 0 ? `$${lot.cost_basis.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">{lot.purchase_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {parseResult && finalLots.length === 0 && csvText.trim() && (
        <p className="text-xs text-muted-foreground">
          No holdings found. Make sure the CSV contains a header row and at least one buy transaction.
        </p>
      )}
    </div>
  );
}
