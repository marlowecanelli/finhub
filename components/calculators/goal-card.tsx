"use client";

import { motion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ticker/animated-number";
import { projectGoal, type Goal } from "@/lib/calculators";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  goal: Goal;
  onUpdate: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const STATUS_LABEL: Record<ReturnType<typeof projectGoal>["status"], { text: string; cls: string }> = {
  complete: { text: "Goal reached", cls: "bg-[#10b981]/10 text-[#10b981] ring-[#10b981]/30" },
  ahead: { text: "Ahead of pace", cls: "bg-[#10b981]/10 text-[#10b981] ring-[#10b981]/30" },
  "on-track": { text: "On track", cls: "bg-primary/10 text-primary ring-primary/30" },
  behind: { text: "Behind pace", cls: "bg-[#ef4444]/10 text-[#ef4444] ring-[#ef4444]/30" },
  "no-pace": { text: "No history yet", cls: "bg-muted/60 text-muted-foreground" },
};

export function GoalCard({ goal, onUpdate, onEdit, onDelete }: Props) {
  const p = projectGoal(goal);
  const targetDate = new Date(goal.target_date);
  const status = STATUS_LABEL[p.status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass relative overflow-hidden p-5"
    >
      {p.status === "complete" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#10b981]/15 via-transparent to-transparent"
        />
      )}
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold tracking-tight">
              {goal.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Target {targetDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset",
              status.cls
            )}
          >
            {status.text}
          </span>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-2xl font-semibold tracking-tight">
              <AnimatedNumber value={goal.current_amount} format={(n) => formatCurrency(n)} />
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              of {formatCurrency(goal.target_amount)}
            </span>
          </div>
          <ProgressBar pct={p.pctComplete} status={p.status} />
          <p className="mt-1 text-right text-xs font-mono font-medium text-muted-foreground">
            {p.pctComplete.toFixed(1)}%
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Cell
            label="Required / month"
            value={formatCurrency(p.requiredMonthly)}
            sub={p.monthsToTarget > 0 ? `over ${Math.ceil(p.monthsToTarget)} mo` : "due now"}
          />
          <Cell
            label="Projected"
            value={
              p.projectedCompletion
                ? p.projectedCompletion.toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })
                : "—"
            }
            sub={
              p.observedMonthlyPace > 0
                ? `${formatCurrency(p.observedMonthlyPace)}/mo pace`
                : "no pace yet"
            }
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={onUpdate} className="flex-1">
            <Plus className="h-4 w-4" /> Update progress
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={`Edit ${goal.name}`}
            className="h-9 w-9"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${goal.name}`}
            className="h-9 w-9 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function ProgressBar({
  pct,
  status,
}: {
  pct: number;
  status: ReturnType<typeof projectGoal>["status"];
}) {
  const color =
    status === "complete" || status === "ahead"
      ? "bg-[#10b981]"
      : status === "behind"
        ? "bg-[#ef4444]"
        : "bg-primary";
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/60">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`h-full ${color} shadow-[0_0_12px_rgba(255,255,255,0.1)_inset]`}
      />
    </div>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono text-sm font-semibold">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
