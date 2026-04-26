"use client";

import { motion } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { onAdd: () => void };

export function PortfolioEmpty({ onAdd }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass relative flex flex-col items-center overflow-hidden p-10 text-center md:p-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"
      />

      <div className="relative mb-6">
        <Illustration />
      </div>

      <h2 className="relative text-xl font-semibold tracking-tight">
        Your portfolio is empty
      </h2>
      <p className="relative mt-2 max-w-sm text-sm text-muted-foreground">
        Track holdings, allocations, and live performance. Add your first position to
        see real-time P/L, sector breakdown, and performance over time.
      </p>

      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onAdd} size="lg">
          <Plus className="h-4 w-4" /> Add your first holding
        </Button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Live data via Yahoo Finance
        </span>
      </div>
    </motion.div>
  );
}

function Illustration() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="empty-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        x="10"
        y="20"
        width="160"
        height="86"
        rx="14"
        fill="url(#empty-grad)"
        stroke="hsl(var(--border))"
        strokeWidth="1"
      />
      <path
        d="M22 90 L52 70 L78 80 L106 50 L138 60 L168 30"
        stroke="#3b82f6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="52" cy="70" r="3" fill="#3b82f6" />
      <circle cx="78" cy="80" r="3" fill="#3b82f6" />
      <circle cx="106" cy="50" r="3" fill="#3b82f6" />
      <circle cx="138" cy="60" r="3" fill="#3b82f6" />
      <circle
        cx="168"
        cy="30"
        r="5"
        fill="#3b82f6"
        stroke="hsl(var(--background))"
        strokeWidth="2"
      />
    </svg>
  );
}
