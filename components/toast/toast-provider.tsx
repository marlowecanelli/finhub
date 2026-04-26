"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastKind = "success" | "error" | "info" | "warning";
export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  duration?: number; // ms
};

type ToastInput = Omit<Toast, "id">;
type ToastContextValue = {
  toast: (t: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
};

const Ctx = React.createContext<ToastContextValue | null>(null);

const STYLE: Record<ToastKind, { icon: React.ReactNode; ring: string; bg: string }> = {
  success: { icon: <CheckCircle2 className="h-4 w-4" />, ring: "ring-[#10b981]/40", bg: "bg-[#10b981]/10 text-[#10b981]" },
  error:   { icon: <XCircle className="h-4 w-4" />, ring: "ring-destructive/40", bg: "bg-destructive/10 text-destructive" },
  info:    { icon: <Info className="h-4 w-4" />, ring: "ring-primary/40", bg: "bg-primary/10 text-primary" },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, ring: "ring-amber-500/40", bg: "bg-amber-500/10 text-amber-500" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: ToastInput) => {
      const id = Math.random().toString(36).slice(2, 10);
      const next: Toast = { id, duration: 4000, ...t };
      setToasts((prev) => [...prev, next]);
      if (next.duration && next.duration > 0) {
        window.setTimeout(() => dismiss(id), next.duration);
      }
      return id;
    },
    [dismiss]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (title, description) => toast({ kind: "success", title, description }),
      error: (title, description) => toast({ kind: "error", title, description, duration: 6000 }),
      info: (title, description) => toast({ kind: "info", title, description }),
      warning: (title, description) => toast({ kind: "warning", title, description }),
    }),
    [toast, dismiss]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <Viewport toasts={toasts} dismiss={dismiss} />
    </Ctx.Provider>
  );
}

function Viewport({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const style = STYLE[t.kind];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border/60 bg-popover/95 p-3 shadow-2xl backdrop-blur-xl"
            >
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset",
                  style.ring,
                  style.bg
                )}
              >
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside <ToastProvider>");
  return v;
}
