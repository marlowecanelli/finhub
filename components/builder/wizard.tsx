"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  Briefcase,
  Building2,
  Globe,
  GraduationCap,
  Hammer,
  Home,
  Leaf,
  Loader2,
  MessageSquarePlus,
  Mountain,
  PiggyBank,
  Rocket,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ANSWERS,
  isComplete,
  type BuilderAnswers,
  type BuilderRecommendation,
  type Experience,
  type Goal,
  type Horizon,
  type TaxAccount,
} from "@/lib/builder";
import { CalcInput } from "@/components/calculators/calc-input";
import { OptionCard } from "./option-card";
import { RiskSlider } from "./risk-slider";
import { StepShell } from "./step-shell";
import { BuilderResults } from "./results";
import { emitEvent } from "@/lib/achievements/client";

const STORAGE_KEY = "finhub-builder-answers-v2";
const TOTAL_STEPS = 9;

const GOAL_OPTIONS: { key: Goal; title: string; description: string; icon: typeof Home }[] = [
  { key: "retirement", title: "Retirement", description: "Long-horizon nest egg.", icon: Mountain },
  { key: "house", title: "House", description: "Down payment in a few years.", icon: Home },
  { key: "wealth", title: "General Wealth", description: "Grow capital over time.", icon: PiggyBank },
  { key: "short-term", title: "Short-Term", description: "Cash needed soon.", icon: Wallet },
];

const HORIZON_OPTIONS: { key: Horizon; title: string; description: string; icon: typeof Rocket }[] = [
  { key: "short", title: "Less than 3 years", description: "Capital preservation matters.", icon: Wallet },
  { key: "medium", title: "3 – 10 years", description: "Balance growth and stability.", icon: Hammer },
  { key: "long", title: "10+ years", description: "Time to ride out cycles.", icon: Rocket },
];

const EXPERIENCE_OPTIONS: { key: Experience; title: string; description: string; icon: typeof Star }[] = [
  { key: "beginner", title: "Beginner", description: "New to investing.", icon: Star },
  { key: "intermediate", title: "Intermediate", description: "Comfortable with ETFs and funds.", icon: GraduationCap },
  { key: "advanced", title: "Advanced", description: "Trade individual stocks regularly.", icon: Sparkles },
];

const TAX_OPTIONS: { key: TaxAccount; title: string; description: string; icon: typeof Wallet }[] = [
  { key: "taxable", title: "Taxable Brokerage", description: "Standard account, capital gains taxed.", icon: Banknote },
  { key: "ira", title: "Traditional IRA", description: "Tax-deferred growth, taxed on withdrawal.", icon: PiggyBank },
  { key: "roth", title: "Roth IRA", description: "After-tax contributions, tax-free growth.", icon: TrendingUp },
  { key: "401k", title: "401(k)", description: "Employer-sponsored, pre-tax contributions.", icon: Building2 },
];

const PREF_OPTIONS: {
  key: keyof BuilderAnswers["preferences"];
  title: string;
  description: string;
  icon: typeof Leaf;
}[] = [
  { key: "esg", title: "ESG", description: "Sustainability-focused funds.", icon: Leaf },
  { key: "dividend", title: "Dividend Income", description: "Income-paying equities.", icon: PiggyBank },
  { key: "growth", title: "Growth", description: "Higher-growth tech & innovation.", icon: TrendingUp },
  { key: "value", title: "Value", description: "Undervalued companies at a discount.", icon: TrendingDown },
  { key: "international", title: "International", description: "Exposure outside the US.", icon: Globe },
  { key: "smallCap", title: "Small Cap", description: "Higher growth, higher volatility.", icon: Sparkles },
  { key: "realEstate", title: "Real Estate (REITs)", description: "Inflation hedge & income.", icon: Building2 },
  { key: "crypto", title: "Crypto Exposure", description: "Bitcoin / crypto ETFs.", icon: Sparkles },
];

const STEP_LABELS = [
  "Goal",
  "Horizon",
  "Risk",
  "Capital",
  "Monthly",
  "Preferences",
  "Tax Account",
  "Experience",
  "Details",
];

const CONTEXT_EXAMPLES = [
  "I already own Apple stock and want to avoid too much tech exposure.",
  "I'm self-employed with variable income — keep things simple.",
  "I want to focus on dividend income to supplement my salary.",
  "I'd prefer to exclude defense and fossil fuel companies.",
  "I'm close to retirement and want to reduce volatility soon.",
];

export function BuilderWizard() {
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<BuilderAnswers>(DEFAULT_ANSWERS);
  const [submitting, setSubmitting] = React.useState(false);
  const [recommendation, setRecommendation] =
    React.useState<BuilderRecommendation | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [contextPlaceholder, setContextPlaceholder] = React.useState(CONTEXT_EXAMPLES[0]);

  // Hydrate from localStorage.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as BuilderAnswers;
        setAnswers({ ...DEFAULT_ANSWERS, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist on change.
  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // quota — ignore
    }
  }, [answers]);

  // Rotate placeholder examples.
  React.useEffect(() => {
    const id = setInterval(() => {
      setContextPlaceholder(CONTEXT_EXAMPLES[Math.floor(Math.random() * CONTEXT_EXAMPLES.length)]);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  function update<K extends keyof BuilderAnswers>(key: K, value: BuilderAnswers[K]) {
    setAnswers((p) => ({ ...p, [key]: value }));
  }

  const stepValid = React.useMemo(() => {
    switch (step) {
      case 1: return answers.goal != null;
      case 2: return answers.horizon != null;
      case 3: return answers.riskLevel >= 1 && answers.riskLevel <= 5;
      case 4: return answers.initialInvestment > 0;
      case 5: return answers.monthlyContribution >= 0;
      case 6: return true; // preferences — optional
      case 7: return answers.taxAccount != null;
      case 8: return answers.experience != null;
      case 9: return !submitting; // custom context — optional
      default: return false;
    }
  }, [step, answers, submitting]);

  async function generate() {
    if (!isComplete(answers)) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/ai/portfolio-builder", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to generate");
      setRecommendation(data as BuilderRecommendation);
      void emitEvent("ai_query_sent", { surface: "builder" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setRecommendation(null);
    setError(null);
    setStep(1);
  }

  if (recommendation) {
    return (
      <BuilderResults
        answers={answers}
        recommendation={recommendation}
        onRegenerate={() => {
          setRecommendation(null);
          void generate();
        }}
        onEdit={startOver}
        regenerating={submitting}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
      <header className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/30">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Builder
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            AI Portfolio Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer a few questions — we&apos;ll suggest an allocation tailored to your situation.
          </p>
        </div>
      </header>

      <ProgressBar step={step} total={TOTAL_STEPS} labels={STEP_LABELS} onJump={(s) => {
        // only allow jumping to already-completed steps
        if (s < step) setStep(s);
      }} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepShell
            step={1}
            total={TOTAL_STEPS}
            title="What's your investment goal?"
            subtitle="The end goal shapes the recommended risk and asset mix."
            canBack={false}
            canNext={stepValid}
            onBack={() => {}}
            onNext={() => setStep(2)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((o) => (
                <OptionCard
                  key={o.key}
                  icon={o.icon}
                  title={o.title}
                  description={o.description}
                  selected={answers.goal === o.key}
                  onClick={() => update("goal", o.key)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            step={2}
            total={TOTAL_STEPS}
            title="What's your time horizon?"
            subtitle="Longer horizons can absorb more volatility and unlock higher-growth allocations."
            canBack
            canNext={stepValid}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {HORIZON_OPTIONS.map((o) => (
                <OptionCard
                  key={o.key}
                  icon={o.icon}
                  title={o.title}
                  description={o.description}
                  selected={answers.horizon === o.key}
                  onClick={() => update("horizon", o.key)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            step={3}
            total={TOTAL_STEPS}
            title="How much risk can you stomach?"
            subtitle="Drag the slider — historical drawdown ranges shown for each level."
            canBack
            canNext={stepValid}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          >
            <RiskSlider
              value={answers.riskLevel}
              onChange={(v) => update("riskLevel", v)}
            />
          </StepShell>
        )}

        {step === 4 && (
          <StepShell
            step={4}
            total={TOTAL_STEPS}
            title="How much are you starting with?"
            subtitle="Your initial lump-sum investment."
            canBack
            canNext={stepValid}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          >
            <div className="glass max-w-md p-5">
              <CalcInput
                id="initial"
                label="Initial investment"
                prefix="$"
                value={answers.initialInvestment}
                onChange={(v) =>
                  update("initialInvestment", Math.max(0, v ?? 0))
                }
              />
            </div>
          </StepShell>
        )}

        {step === 5 && (
          <StepShell
            step={5}
            total={TOTAL_STEPS}
            title="Monthly contribution"
            subtitle="Regular deposits compound significantly over time."
            canBack
            canNext={stepValid}
            onBack={() => setStep(4)}
            onNext={() => setStep(6)}
          >
            <div className="glass max-w-md p-5">
              <CalcInput
                id="monthly"
                label="Monthly contribution"
                prefix="$"
                value={answers.monthlyContribution}
                onChange={(v) =>
                  update("monthlyContribution", Math.max(0, v ?? 0))
                }
                helpText="Set to 0 if you only plan a one-time investment."
              />
            </div>
          </StepShell>
        )}

        {step === 6 && (
          <StepShell
            step={6}
            total={TOTAL_STEPS}
            title="Any investment preferences?"
            subtitle="Optional — pick any that apply. These shape ETF and sector selection."
            canBack
            canNext
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PREF_OPTIONS.map((o) => (
                <OptionCard
                  key={o.key}
                  icon={o.icon}
                  title={o.title}
                  description={o.description}
                  selected={answers.preferences[o.key]}
                  onClick={() =>
                    update("preferences", {
                      ...answers.preferences,
                      [o.key]: !answers.preferences[o.key],
                    })
                  }
                />
              ))}
            </div>
            {Object.values(answers.preferences).some(Boolean) && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs text-primary"
              >
                {Object.values(answers.preferences).filter(Boolean).length} preference
                {Object.values(answers.preferences).filter(Boolean).length > 1 ? "s" : ""} selected
              </motion.p>
            )}
          </StepShell>
        )}

        {step === 7 && (
          <StepShell
            step={7}
            total={TOTAL_STEPS}
            title="Where will you hold this portfolio?"
            subtitle="Account type affects which funds are most tax-efficient for you."
            canBack
            canNext={stepValid}
            onBack={() => setStep(6)}
            onNext={() => setStep(8)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TAX_OPTIONS.map((o) => (
                <OptionCard
                  key={o.key}
                  icon={o.icon}
                  title={o.title}
                  description={o.description}
                  selected={answers.taxAccount === o.key}
                  onClick={() => update("taxAccount", o.key)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 8 && (
          <StepShell
            step={8}
            total={TOTAL_STEPS}
            title="What's your experience level?"
            subtitle="We tune the complexity and number of holdings accordingly."
            canBack
            canNext={stepValid}
            onBack={() => setStep(7)}
            onNext={() => setStep(9)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {EXPERIENCE_OPTIONS.map((o) => (
                <OptionCard
                  key={o.key}
                  icon={o.icon}
                  title={o.title}
                  description={o.description}
                  selected={answers.experience === o.key}
                  onClick={() => update("experience", o.key)}
                />
              ))}
            </div>
          </StepShell>
        )}

        {step === 9 && (
          <StepShell
            step={9}
            total={TOTAL_STEPS}
            title="Anything else you'd like to tell us?"
            subtitle="Optional — describe constraints, goals, or preferences in your own words. The AI will honor them."
            canBack
            canNext={stepValid}
            nextLabel={submitting ? "Generating…" : "Generate my portfolio"}
            onBack={() => setStep(8)}
            onNext={() => void generate()}
          >
            <div className="space-y-4">
              <div className="glass overflow-hidden rounded-2xl">
                <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5">
                  <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Your custom instructions</span>
                </div>
                <textarea
                  value={answers.customContext}
                  onChange={(e) => update("customContext", e.target.value)}
                  placeholder={contextPlaceholder}
                  rows={5}
                  maxLength={500}
                  className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
                  <span className="text-[11px] text-muted-foreground">
                    Examples: exclusions, sector focus, income needs, existing holdings
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {answers.customContext.length}/500
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CONTEXT_EXAMPLES.slice(0, 4).map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => update("customContext", ex)}
                    className="rounded-xl border border-border/40 bg-card/30 px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    &ldquo;{ex}&rdquo;
                  </button>
                ))}
              </div>

              {submitting && (
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Generating your portfolio…
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </StepShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({
  step,
  total,
  labels,
  onJump,
}: {
  step: number;
  total: number;
  labels: string[];
  onJump: (s: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < step - 1;
          const active = i === step - 1;
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => onJump(i + 1)}
              disabled={i >= step - 1}
              animate={{
                opacity: done || active ? 1 : 0.25,
                scaleY: active ? 1.5 : 1,
              }}
              transition={{ duration: 0.25 }}
              title={labels[i]}
              className={cn(
                "h-1.5 flex-1 origin-center rounded-full transition-colors",
                done ? "bg-primary/70 cursor-pointer" : active ? "bg-primary" : "bg-muted cursor-not-allowed"
              )}
            />
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Step <span className="font-mono font-medium text-foreground">{step}</span> of {total} —{" "}
          <span className="text-foreground/80">{labels[step - 1]}</span>
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {Math.round(((step - 1) / total) * 100)}%
        </p>
      </div>
    </div>
  );
}
