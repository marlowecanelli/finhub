"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  canBack: boolean;
  canNext: boolean;
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
  children: React.ReactNode;
};

export function StepShell({
  step,
  total,
  title,
  subtitle,
  canBack,
  canNext,
  nextLabel = "Continue",
  onBack,
  onNext,
  children,
}: Props) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <header className="space-y-1.5">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Step {step} of {total}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </header>

      <div>{children}</div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={!canBack}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!canNext} className="gap-1" size="lg">
          {nextLabel} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
