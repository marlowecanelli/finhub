"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase";
import type { LiveQuote } from "@/lib/portfolio";
import type { BuilderAnswers, BuilderRecommendation, Pick } from "@/lib/builder";
import { RISK_LABELS } from "@/lib/builder";
import { AllocationPie } from "./allocation-pie";
import { ProjectedGrowthChart } from "./projected-growth-chart";
import { AnalyticsDashboard } from "@/components/portfolio/analytics/dashboard";
import { cn } from "@/lib/utils";

type SaveState =
  | { kind: "idle" }
  | { kind: "naming" }
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
  const [portfolioName, setPortfolioName] = React.useState(
    `AI ${labelGoal(answers.goal)} Portfolio`
  );
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  const allPicks: Pick[] = [
    ...recommendation.etf_picks,
    ...recommendation.stock_picks,
  ];

  React.useEffect(() => {
    if (save.kind === "naming") {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [save.kind]);

  async function handleSave() {
    setSave({ kind: "saving" });
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in to save this portfolio.");

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

      const { data: portfolio, error: pErr } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, name: portfolioName.trim() || `AI ${labelGoal(answers.goal)} Portfolio` })
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

  function handleExport() {
    const lines: string[] = [
      `# ${recommendation.portfolio_archetype}`,
      `Generated: ${new Date(recommendation.generated_at).toLocaleDateString()}`,
      "",
      `## Summary`,
      `Goal: ${labelGoal(answers.goal)}`,
      `Horizon: ${labelHorizon(answers.horizon)}`,
      `Risk: ${answers.riskLevel}/5 (${RISK_LABELS[answers.riskLevel - 1]})`,
      `Initial: $${answers.initialInvestment.toLocaleString()}`,
      `Monthly: $${answers.monthlyContribution.toLocaleString()}`,
      `Tax account: ${answers.taxAccount ?? "—"}`,
      "",
      `## Asset Allocation`,
      `Stocks: ${recommendation.asset_allocation.stocks}%`,
      `Bonds: ${recommendation.asset_allocation.bonds}%`,
      `Alternatives: ${recommendation.asset_allocation.alternatives}%`,
      `Cash: ${recommendation.asset_allocation.cash}%`,
      "",
      `## ETF Picks`,
      ...recommendation.etf_picks.map((p) => `${p.ticker} (${p.allocation_percent}%) — ${p.name}: ${p.rationale}`),
    ];
    if (recommendation.stock_picks.length > 0) {
      lines.push("", `## Individual Stocks`);
      lines.push(...recommendation.stock_picks.map((p) => `${p.ticker} (${p.allocation_percent}%) — ${p.name}: ${p.rationale}`));
    }
    lines.push("", `## Risk Assessment`, recommendation.risk_assessment);
    lines.push("", `Expected return: ${recommendation.expected_return_range.low}%–${recommendation.expected_return_range.high}%`);
    lines.push(`Rebalance: ${recommendation.rebalance_frequency}`);
    lines.push("", "Educational purposes only. Not financial advice.");

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(recommendation.portfolio_archetype ?? "portfolio").replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8"
    >
      {/* Archetype banner */}
      <ArchetypeBanner
        archetype={recommendation.portfolio_archetype}
        description={recommendation.archetype_description}
        riskLevel={answers.riskLevel}
      />

      {/* Header */}
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
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge label={labelGoal(answers.goal)} />
              <Badge label={labelHorizon(answers.horizon)} />
              <Badge label={`Risk ${answers.riskLevel}/5`} />
              {answers.taxAccount && <Badge label={labelTax(answers.taxAccount)} />}
              {answers.experience && <Badge label={capitalize(answers.experience)} />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Edit answers
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export
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
          {save.kind !== "saved" && save.kind !== "naming" && (
            <Button
              size="sm"
              onClick={() => setSave({ kind: "naming" })}
              disabled={save.kind === "saving"}
            >
              {save.kind === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {save.kind === "saving" ? "Saving…" : "Save to Portfolio"}
            </Button>
          )}
          {save.kind === "saved" && (
            <Button size="sm" variant="ghost" disabled className="text-emerald-500">
              <BookmarkCheck className="h-4 w-4" /> Saved
            </Button>
          )}
        </div>
      </header>

      {/* Save name dialog */}
      <AnimatePresence>
        {save.kind === "naming" && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass overflow-hidden rounded-2xl border border-primary/30"
          >
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <Save className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-medium">Name your portfolio</span>
              <button
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => setSave({ kind: "idle" })}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-3 p-4">
              <input
                ref={nameInputRef}
                value={portfolioName}
                onChange={(e) => setPortfolioName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSave()}
                className="flex-1 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                placeholder="My portfolio name…"
                maxLength={80}
              />
              <Button onClick={() => void handleSave()} size="sm">
                Save <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save success */}
      <AnimatePresence>
        {save.kind === "saved" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 p-3 text-sm text-[#10b981]"
          >
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Saved as &ldquo;{portfolioName}&rdquo;
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/portfolio?id=${save.portfolioId}`)}
              className="text-[#10b981] hover:text-[#10b981]"
            >
              Open portfolio <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {save.kind === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {save.message}
        </div>
      )}

      {/* Main grid */}
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

      {/* Projected growth chart */}
      <ProjectedGrowthChart answers={answers} recommendation={recommendation} />

      {/* ETF picks */}
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

      <AnalyticsDashboard
        title="Projected Risk & Performance"
        positions={allPicks.map((p) => ({ symbol: p.ticker, value: p.allocation_percent }))}
      />

      <Disclaimer />
    </motion.div>
  );
}

function ArchetypeBanner({
  archetype,
  description,
  riskLevel,
}: {
  archetype: string;
  description: string;
  riskLevel: number;
}) {
  const gradient =
    riskLevel <= 2
      ? "from-emerald-500/10 via-transparent to-transparent"
      : riskLevel <= 3
      ? "from-blue-500/10 via-transparent to-transparent"
      : riskLevel <= 4
      ? "from-violet-500/10 via-transparent to-transparent"
      : "from-orange-500/10 via-transparent to-transparent";

  const accent =
    riskLevel <= 2
      ? "text-emerald-400"
      : riskLevel <= 3
      ? "text-blue-400"
      : riskLevel <= 4
      ? "text-violet-400"
      : "text-orange-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-5 md:p-6",
      )}
    >
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", gradient)}
      />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/40 ring-1 ring-inset ring-border/40">
          <Sparkles className={cn("h-5 w-5", accent)} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Your investor archetype
          </p>
          <h2 className={cn("mt-0.5 text-xl font-bold tracking-tight md:text-2xl", accent)}>
            {archetype}
          </h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/50 bg-card/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {label}
    </span>
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
            <Clock className="h-3 w-3" /> Rebalance
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

function labelGoal(g: BuilderAnswers["goal"]): string {
  switch (g) {
    case "retirement": return "Retirement";
    case "house": return "House";
    case "wealth": return "Wealth-building";
    case "short-term": return "Short-term";
    default: return "General";
  }
}

function labelHorizon(h: BuilderAnswers["horizon"]): string {
  switch (h) {
    case "short": return "<3 yrs";
    case "medium": return "3–10 yrs";
    case "long": return "10+ yrs";
    default: return "—";
  }
}

function labelTax(t: BuilderAnswers["taxAccount"]): string {
  switch (t) {
    case "taxable": return "Taxable";
    case "ira": return "IRA";
    case "roth": return "Roth IRA";
    case "401k": return "401(k)";
    default: return "—";
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
