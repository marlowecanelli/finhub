"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import type { LiveQuote } from "@/lib/portfolio";
import type { BuilderAnswers, BuilderRecommendation, Pick } from "@/lib/builder";
import { AllocationPie } from "./allocation-pie";
import { cn } from "@/lib/utils";

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; portfolioId: string }
  | { kind: "error"; message: string };

type Props = {
  answers: BuilderAnswers;
  recommendation: BuilderRecommendation;
  onRegenerate: () => void;
  onEdit: () => void;
  regenerating: boolean;
};

export function BuilderResults({
  answers,
  recommendation,
  onRegenerate,
  onEdit,
  regenerating,
}: Props) {
  const router = useRouter();
  const [save, setSave] = React.useState<SaveState>({ kind: "idle" });

  const allPicks: Pick[] = [
    ...recommendation.etf_picks,
    ...recommendation.stock_picks,
  ];

  async function handleSave() {
    setSave({ kind: "saving" });
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to save this portfolio.");

      // Resolve current prices to compute share counts.
      const symbols = allPicks.map((p) => p.ticker);
      const quotesRes = await fetch("/api/portfolio/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbols }),
      });
      const quotesJson = (await quotesRes.json()) as { quotes?: LiveQuote[] };
      const priceBySymbol = new Map<string, number>();
      for (const q of quotesJson.quotes ?? []) {
        if (q.price != null) priceBySymbol.set(q.symbol.toUpperCase(), q.price);
      }

      const today = new Date().toISOString().slice(0, 10);
      const total = answers.initialInvestment;

      const holdingsRows = allPicks
        .map((p) => {
          const dollars = (p.allocation_percent / 100) * total;
          const price = priceBySymbol.get(p.ticker.toUpperCase());
          if (!price || price <= 0) return null;
          const shares = Math.max(0.0001, dollars / price);
          return {
            ticker: p.ticker.toUpperCase(),
            shares: Math.round(shares * 10000) / 10000,
            cost_basis: Math.round(price * 100) / 100,
            purchase_date: today,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      if (holdingsRows.length === 0) {
        throw new Error("Could not fetch live prices to size positions.");
      }

      const portfolioName = `AI ${labelGoal(answers.goal)} portfolio`;
      const { data: portfolio, error: pErr } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, name: portfolioName })
        .select("id")
        .single<{ id: string }>();
      if (pErr) throw pErr;

      const { error: hErr } = await supabase.from("holdings").insert(
        holdingsRows.map((h) => ({
          portfolio_id: portfolio.id,
          ...h,
        }))
      );
      if (hErr) throw hErr;

      setSave({ kind: "saved", portfolioId: portfolio.id });
    } catch (err) {
      setSave({
        kind: "error",
        message: err instanceof Error ? err.message : "Failed to save",
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8"
    >
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Recommendation
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Your AI-built portfolio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tailored to {labelGoal(answers.goal)} · {labelHorizon(answers.horizon)} · risk{" "}
              {answers.riskLevel}/5
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit answers
          </Button>
          <Button
            variant="glass"
            size="sm"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={cn("h-4 w-4", regenerating && "animate-spin")} />
            Regenerate
          </Button>
          <SaveButton state={save} onClick={handleSave} />
        </div>
      </header>

      {save.kind === "saved" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-3 text-sm text-[#10b981]"
        >
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Saved as a new portfolio.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/portfolio")}
            className="text-[#10b981] hover:text-[#10b981]"
          >
            Open portfolio <ArrowRight className="h-3 w-3" />
          </Button>
        </motion.div>
      )}

      {save.kind === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {save.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ExpectedReturn
            range={recommendation.expected_return_range}
            rebalance={recommendation.rebalance_frequency}
          />
          <RiskAssessment text={recommendation.risk_assessment} />
        </div>
        <AllocationPie allocation={recommendation.asset_allocation} />
      </div>

      <PicksSection
        title="ETF picks"
        subtitle="Broad, low-cost building blocks."
        picks={recommendation.etf_picks}
        total={answers.initialInvestment}
      />

      {recommendation.stock_picks.length > 0 && (
        <PicksSection
          title="Individual stock picks"
          subtitle="Aggressive allocation only — concentration risk applies."
          picks={recommendation.stock_picks}
          total={answers.initialInvestment}
          accent="amber"
        />
      )}

      <Disclaimer />
    </motion.div>
  );
}

function ExpectedReturn({
  range,
  rebalance,
}: {
  range: { low: number; high: number };
  rebalance: string;
}) {
  return (
    <div className="glass relative overflow-hidden p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent"
      />
      <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Expected annual return
          </div>
          <p className="font-mono text-3xl font-semibold tracking-tight">
            {range.low.toFixed(1)}% – {range.high.toFixed(1)}%
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Long-run estimate, not a guarantee.
          </p>
        </div>
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <RefreshCw className="h-3 w-3" /> Rebalance
          </div>
          <p className="text-base font-semibold">{rebalance}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Rebalance back to target weights to control drift.
          </p>
        </div>
      </div>
    </div>
  );
}

function RiskAssessment({ text }: { text: string }) {
  return (
    <div className="glass p-5 md:p-6">
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
        Risk assessment
      </h3>
      <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
    </div>
  );
}

function PicksSection({
  title,
  subtitle,
  picks,
  total,
  accent,
}: {
  title: string;
  subtitle: string;
  picks: Pick[];
  total: number;
  accent?: "amber";
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {picks.map((p) => {
          const dollars = (p.allocation_percent / 100) * total;
          return (
            <Link
              key={`${p.ticker}-${p.allocation_percent}`}
              href={`/ticker/${encodeURIComponent(p.ticker)}`}
              className="glass glass-hover group flex flex-col gap-3 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-base font-semibold">{p.ticker}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.name}</p>
                </div>
                <div
                  className={cn(
                    "rounded-md px-2 py-0.5 font-mono text-xs font-semibold ring-1 ring-inset",
                    accent === "amber"
                      ? "bg-amber-500/10 text-amber-500 ring-amber-500/30"
                      : "bg-primary/10 text-primary ring-primary/30"
                  )}
                >
                  {p.allocation_percent}%
                </div>
              </div>
              <p className="text-xs leading-relaxed text-foreground/85">
                {p.rationale}
              </p>
              <p className="text-[11px] text-muted-foreground">
                ≈ ${Math.round(dollars).toLocaleString()} at recommended allocation
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-500">
      <div className="mb-1 inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider">
        <AlertTriangle className="h-3.5 w-3.5" /> Disclaimer
      </div>
      Educational recommendations only. Not financial advice. Consult a licensed advisor before
      making investment decisions.
    </div>
  );
}

function SaveButton({
  state,
  onClick,
}: {
  state: SaveState;
  onClick: () => void;
}) {
  const saving = state.kind === "saving";
  const saved = state.kind === "saved";
  return (
    <Button onClick={onClick} disabled={saving || saved} size="sm">
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {saved ? "Saved" : saving ? "Saving…" : "Save to Portfolio"}
    </Button>
  );
}

function labelGoal(g: BuilderAnswers["goal"]): string {
  switch (g) {
    case "retirement": return "Retirement";
    case "house": return "House";
    case "wealth": return "Wealth-building";
    case "short-term": return "Short-term";
    default: return "general";
  }
}

function labelHorizon(h: BuilderAnswers["horizon"]): string {
  switch (h) {
    case "short": return "<3 years";
    case "medium": return "3–10 years";
    case "long": return "10+ years";
    default: return "—";
  }
}
