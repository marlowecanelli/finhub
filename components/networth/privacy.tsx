"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type PrivacyCtx = { blurred: boolean; toggle: () => void };
const Ctx = createContext<PrivacyCtx>({ blurred: false, toggle: () => {} });

export function PrivacyProvider({ children, initialBlurred = false }: { children: React.ReactNode; initialBlurred?: boolean }) {
  const [blurred, setBlurred] = useState(initialBlurred);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("finhub:networth:privacy") : null;
    if (stored === "1") setBlurred(true);
  }, []);
  const toggle = () => {
    setBlurred((b) => {
      const next = !b;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("finhub:networth:privacy", next ? "1" : "0");
      }
      return next;
    });
  };
  return <Ctx.Provider value={{ blurred, toggle }}>{children}</Ctx.Provider>;
}

export function usePrivacy() {
  return useContext(Ctx);
}

export function PrivateNumber({ children, className }: { children: React.ReactNode; className?: string }) {
  const { blurred } = usePrivacy();
  return (
    <span className={cn(blurred && "select-none blur-md transition-all", className)}>
      {children}
    </span>
  );
}

export function PrivacyToggleButton({ className }: { className?: string }) {
  const { blurred, toggle } = usePrivacy();
  return (
    <button
      onClick={toggle}
      title={blurred ? "Show numbers" : "Hide numbers"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white",
        className
      )}
    >
      {blurred ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
