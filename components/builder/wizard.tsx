"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Briefcase,
  Globe,
  GraduationCap,
  Hammer,
  Home,
  Leaf,
  Loader2,
  Mountain,
  PiggyBank,
  Rocket,
  Sparkles,
  Star,
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
} from "@/lib/builder";
import { CalcInput } from "@/components/calculators/calc-input";
import { OptionCard } from "./option-card";
import { RiskSlider } from "./risk-slider";
import { StepShell } from "./step-shell";
import { BuilderResults } from "./results";

const STORAGE_KEY = "finhub-builder-answers";
const TOTAL_STEPS = 7;

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

const PREF_OPTIONS: {
  key: keyof BuilderAnswers["preferences"];
  title: string;
  description: string;
  icon: typeof Leaf;
}[] = [
  { key: "esg", title: "ESG", description: "Sustainability-focused funds.", icon: Leaf },
  { key: "dividend", title: "Dividend-focused", description: "Income-paying equities.", icon: PiggyBank },
  { key: "growth", title: "Growth-focused", description: "Higher-growth tech and innovation.", icon: Rocket },
  { key: "international", title: "International", description: "Exposure outside the US.", icon: Globe },
  { key: "crypto", title: "Crypto exposure", description: "Bitcoin / crypto ETFs.", icon: Sparkles },
];

export function BuilderWizard() {
  const [step, setStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<BuilderAnswers>(DEFAULT_ANSWERS);
  const [submitting, setSubmitting] = React.useState(false);
  const [recommendation, setRecommendation] =
    React.useState<BuilderRecommendation | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
      case 6: return true; // optional
      case 7: return answers.experience != null;
      default: return false;
    }
  }, [step, answers]);

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

  // Results screen takes over when we have a recommendation.
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

      <ProgressBar step={step} total={TOTAL_STEPS} />

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
            subtitle="Longer horizons can absorb more volatility."
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
            subtitle="Regular deposits compound over time."
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
            title="Any preferences?"
            subtitle="Optional — pick any that apply."
            canBack
            canNext
            onBack={() => setStep(5)}
            onNext={() => setStep(7)}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </StepShell>
        )}

        {step === 7 && (
          <StepShell
            step={7}
            total={TOTAL_STEPS}
            title="What's your experience level?"
            subtitle="We tune the recommendation accordingly."
            canBack
            canNext={stepValid && !submitting}
            nextLabel={submitting ? "Generating…" : "Generate recommendation"}
            onBack={() => setStep(6)}
            onNext={() => void generate()}
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

            {submitting && (
              <div className="mt-6 flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Asking Claude for a tailored allocation…
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </StepShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="space-y-2">
      <div className="flex h-1.5 gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const done = i < step;
          const active = i === step - 1;
          return (
            <motion.div
              key={i}
              animate={{
                opacity: done || active ? 1 : 0.25,
                scaleY: active ? 1.15 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex-1 origin-center rounded-full transition-colors",
                done || active ? "bg-primary" : "bg-muted"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
