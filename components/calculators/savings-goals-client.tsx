"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import { GoalCard } from "./goal-card";
import { GoalFormDialog, type GoalFormValues } from "./goal-form-dialog";
import { UpdateProgressDialog } from "./update-progress-dialog";
import { DeleteConfirm } from "@/components/portfolio/delete-confirm";
import type { Goal } from "@/lib/calculators";

type Props = { initialGoals: Goal[] };

export function SavingsGoalsClient({ initialGoals }: Props) {
  const [goals, setGoals] = React.useState<Goal[]>(initialGoals);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [updating, setUpdating] = React.useState<Goal | null>(null);
  const [deleting, setDeleting] = React.useState<Goal | null>(null);

  async function handleSave(values: GoalFormValues) {
    const supabase = createClient();
    if (editing) {
      const { data, error } = await supabase
        .from("goals")
        .update(values)
        .eq("id", editing.id)
        .select()
        .single<Goal>();
      if (error) throw error;
      setGoals((g) => g.map((x) => (x.id === data.id ? data : x)));
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign-in required");
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...values, user_id: user.id })
        .select()
        .single<Goal>();
      if (error) throw error;
      setGoals((g) => [data, ...g]);
    }
    setEditing(null);
  }

  async function handleProgress(amount: number) {
    if (!updating) return;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("goals")
      .update({ current_amount: amount })
      .eq("id", updating.id)
      .select()
      .single<Goal>();
    if (error) throw error;
    setGoals((g) => g.map((x) => (x.id === data.id ? data : x)));
  }

  async function handleDelete() {
    if (!deleting) return;
    const supabase = createClient();
    const { error } = await supabase.from("goals").delete().eq("id", deleting.id);
    if (error) throw error;
    setGoals((g) => g.filter((x) => x.id !== deleting.id));
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Calculator
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Savings goals
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track multiple goals with required pace and projected completion.
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New goal
        </Button>
      </header>

      {goals.length === 0 ? (
        <Empty
          onAdd={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onUpdate={() => setUpdating(g)}
              onEdit={() => {
                setEditing(g);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(g)}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSave}
      />
      <UpdateProgressDialog
        open={Boolean(updating)}
        onOpenChange={(v) => !v && setUpdating(null)}
        goal={updating}
        onSubmit={handleProgress}
      />
      <DeleteConfirm
        open={Boolean(deleting)}
        onOpenChange={(v) => !v && setDeleting(null)}
        ticker={deleting?.name ?? null}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass flex flex-col items-center p-12 text-center"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/30">
        <Target className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold">No goals yet</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Create your first goal — house, retirement, vacation — and track progress with required monthly contributions.
      </p>
      <Button onClick={onAdd} size="lg" className="mt-6">
        <Plus className="h-4 w-4" /> Create your first goal
      </Button>
    </motion.div>
  );
}
