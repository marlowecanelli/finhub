"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Zap,
  LayoutGrid,
  Trophy,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EnrichedHolding, PortfolioTotals } from "@/lib/portfolio";

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  enriched: EnrichedHolding[];
  totals: PortfolioTotals;
};

type ParsedSection = {
  name: string;
  content: string;
};

// ─── Section config ───────────────────────────────────────────────────────────

const SECTION_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    accent: string;
    border: string;
    bg: string;
    label: string;
  }
> = {
  VERDICT: {
    icon: Trophy,
    accent: "text-primary",
    border: "border-primary/40",
    bg: "bg-primary/5",
    label: "Verdict",
  },
  "CONCENTRATION RISK": {
    icon: AlertTriangle,
    accent: "text-amber-400",
    border: "border-amber-400/40",
    bg: "bg-amber-400/5",
    label: "Concentration Risk",
  },
  "SECTOR BIAS": {
    icon: LayoutGrid,
    accent: "text-purple-400",
    border: "border-purple-400/40",
    bg: "bg-purple-400/5",
    label: "Sector Bias",
  },
  "WHAT'S DRAGGING YOU DOWN": {
    icon: TrendingDown,
    accent: "text-destructive",
    border: "border-destructive/40",
    bg: "bg-destructive/5",
    label: "What's Dragging You Down",
  },
  "BRIGHT SPOTS": {
    icon: TrendingUp,
    accent: "text-[#10b981]",
    border: "border-[#10b981]/40",
    bg: "bg-[#10b981]/5",
    label: "Bright Spots",
  },
  "ACTION ITEMS": {
    icon: Zap,
    accent: "text-sky-400",
    border: "border-sky-400/40",
    bg: "bg-sky-400/5",
    label: "Action Items",
  },
};

const SECTION_ORDER = [
  "VERDICT",
  "CONCENTRATION RISK",
  "SECTOR BIAS",
  "WHAT'S DRAGGING YOU DOWN",
  "BRIGHT SPOTS",
  "ACTION ITEMS",
];

// ─── Parsing ──────────────────────────────────────────────────────────────────

function parseSections(text: string): ParsedSection[] {
  const headerRegex = /^## (.+)$/gm;
  const parts: Array<{ name: string; start: number; headerEnd: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = headerRegex.exec(text)) !== null) {
    parts.push({
      name: match[1]!.trim().toUpperCase(),
      start: match.index,
      headerEnd: match.index + match[0]!.length,
    });
  }
  if (parts.length === 0) return [];
  return parts.map((p, i) => {
    const end = i + 1 < parts.length ? parts[i + 1]!.start : text.length;
    const content = text.slice(p.headerEnd + 1, end).trim();
    return { name: p.name, content };
  });
}

function extractGrade(verdictContent: string): string | null {
  const m = verdictContent.match(/\b([A-F][+-]?)\b/);
  return m?.[1] ?? null;
}

function gradeColor(grade: string): string {
  if (grade.startsWith("A")) return "text-[#10b981]";
  if (grade.startsWith("B")) return "text-sky-400";
  if (grade.startsWith("C")) return "text-amber-400";
  return "text-destructive";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionItemsList({ text }: { text: string }) {
  const lines = text
    .split(/\n/)
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter((l) => l.length > 0 && !/^##/.test(l));

  if (lines.length === 0) {
    return <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>;
  }

  return (
    <ol className="space-y-2">
      {lines.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-400/20 font-mono text-[11px] font-semibold text-sky-400">
            {i + 1}
          </span>
          <span className="text-foreground/90">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionCard({
  section,
  isLast,
  isStreaming,
}: {
  section: ParsedSection;
  isLast: boolean;
  isStreaming: boolean;
}) {
  const cfg = SECTION_CONFIG[section.name];
  if (!cfg) return null;
  const Icon = cfg.icon;
  const isVerdict = section.name === "VERDICT";
  const isActions = section.name === "ACTION ITEMS";
  const grade = isVerdict ? extractGrade(section.content) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "overflow-hidden rounded-xl border p-5",
        cfg.border,
        cfg.bg,
        "backdrop-blur-sm"
      )}
    >
      {/* Card header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg border",
              cfg.border,
              cfg.bg
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", cfg.accent)} />
          </div>
          <span
            className={cn(
              "font-mono text-[10px] font-semibold uppercase tracking-[0.18em]",
              cfg.accent
            )}
          >
            {cfg.label}
          </span>
        </div>
        {isVerdict && grade && (
          <span
            className={cn(
              "font-display text-3xl font-bold leading-none tabular-nums",
              gradeColor(grade)
            )}
          >
            {grade}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="text-sm leading-relaxed text-foreground/85">
        {isActions ? (
          <ActionItemsList text={section.content} />
        ) : (
          <p className="whitespace-pre-line">
            {section.content}
            {isLast && isStreaming && (
              <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-current align-middle opacity-70" />
            )}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function ProgressBar({ sections, total }: { sections: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min((sections / total) * 100, 95);
  return (
    <div className="h-0.5 w-full overflow-hidden rounded-full bg-border/60">
      <motion.div
        className="h-full rounded-full bg-primary/60"
        initial={{ width: "0%" }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiAnalyst({ enriched, totals }: Props) {
  const [status, setStatus] = React.useState<"idle" | "streaming" | "done" | "error">("idle");
  const [fullText, setFullText] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const sections = React.useMemo(() => parseSections(fullText), [fullText]);

  const hasAnyHoldings = enriched.length > 0 && totals.totalValue > 0;

  async function runAnalysis() {
    setStatus("streaming");
    setFullText("");
    setErrorMsg(null);

    const totalValue = totals.totalValue;
    const payload = {
      holdings: enriched.map((h) => ({
        ticker: h.ticker,
        shares: h.shares,
        costBasis: h.cost_basis,
        marketValue: h.marketValue,
        totalPL: h.totalPL,
        totalPLPct: h.totalPLPct,
        dayChangePct: h.dayChangePct,
        sector: h.quote?.sector ?? null,
        weight: totalValue > 0 ? (h.marketValue / totalValue) * 100 : 0,
      })),
      totalValue: totals.totalValue,
      totalCost: totals.totalCost,
      totalPL: totals.totalPL,
      totalPLPct: totals.totalPLPct,
    };

    try {
      const res = await fetch("/api/ai/portfolio-analyst", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Request failed");
        setErrorMsg(text || "Request failed");
        setStatus("error");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setFullText(acc);
      }

      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setStatus("error");
    }
  }

  const orderedSections = React.useMemo(() => {
    const map = new Map(sections.map((s) => [s.name, s]));
    return SECTION_ORDER.map((k) => map.get(k)).filter(Boolean) as ParsedSection[];
  }, [sections]);

  const isStreaming = status === "streaming";
  const lastSectionName = sections[sections.length - 1]?.name ?? null;

  return (
    <section className="glass relative overflow-hidden p-6 md:p-8">
      {/* Decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(700px 260px at 0% 0%, hsl(var(--primary) / 0.10), transparent 60%), radial-gradient(500px 200px at 100% 100%, hsl(260 80% 60% / 0.07), transparent 60%)",
        }}
      />

      <div className="relative">
        {/* Header row */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Section
            </span>
            <div>
              <h2 className="flex items-center gap-2 font-display text-xl font-medium tracking-tight">
                <Brain className="h-4 w-4 text-primary" />
                AI Portfolio Analyst
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/25">
                  <Sparkles className="h-2.5 w-2.5" />
                  Haiku · ~$0.01
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                {status === "idle"
                  ? "Get a candid roast + praise of your portfolio — concentration risk, sector bias, underperformers"
                  : status === "streaming"
                  ? `Analyzing ${enriched.length} holding${enriched.length !== 1 ? "s" : ""} · ${orderedSections.length} of ${SECTION_ORDER.length} sections complete`
                  : status === "done"
                  ? `${SECTION_ORDER.length} sections · ${enriched.length} holdings analyzed`
                  : "Analysis failed"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "done" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void runAnalysis()}
                disabled={isStreaming}
              >
                <RefreshCw className="h-4 w-4" />
                Re-analyze
              </Button>
            )}
            {(status === "idle" || status === "error") && (
              <Button
                size="sm"
                onClick={() => void runAnalysis()}
                disabled={!hasAnyHoldings}
              >
                <Brain className="h-4 w-4" />
                Analyze Portfolio
              </Button>
            )}
            {isStreaming && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground ring-1 ring-inset ring-border/60">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Thinking
              </div>
            )}
          </div>
        </div>

        {/* Progress bar while streaming */}
        {isStreaming && (
          <div className="mb-6">
            <ProgressBar sections={orderedSections.length} total={SECTION_ORDER.length} />
          </div>
        )}

        {/* Error state */}
        {status === "error" && errorMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Analysis failed</p>
              <p className="mt-0.5 text-xs opacity-80">{errorMsg}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void runAnalysis()}>
              Retry
            </Button>
          </div>
        )}

        {/* Idle CTA */}
        {status === "idle" && !hasAnyHoldings && (
          <p className="text-sm text-muted-foreground">
            Add holdings with live price data to run an analysis.
          </p>
        )}

        {/* Sections */}
        {(isStreaming || status === "done") && orderedSections.length > 0 && (
          <AnimatePresence initial={false}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {orderedSections.map((section) => (
                <div
                  key={section.name}
                  className={cn(
                    section.name === "VERDICT" && "lg:col-span-2",
                    section.name === "ACTION ITEMS" && "lg:col-span-2"
                  )}
                >
                  <SectionCard
                    section={section}
                    isLast={section.name === lastSectionName}
                    isStreaming={isStreaming}
                  />
                </div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Streaming spinner when no sections parsed yet */}
        {isStreaming && orderedSections.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Analyzing holdings...
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
