"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Coins,
  Receipt,
  History,
  Target,
  Lightbulb,
  Trophy,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SUB_NAV = [
  { href: "/networth", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/networth/assets", label: "Assets", icon: Coins },
  { href: "/networth/liabilities", label: "Liabilities", icon: Receipt },
  { href: "/networth/history", label: "History", icon: History },
  { href: "/networth/goals", label: "Goals", icon: Target },
  { href: "/networth/insights", label: "Insights", icon: Lightbulb },
  { href: "/networth/achievements", label: "Achievements", icon: Trophy },
  { href: "/networth/settings", label: "Settings", icon: Settings },
];

export function NetWorthSubNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/5 bg-white/[0.02] p-1.5 backdrop-blur">
      {SUB_NAV.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-all",
              active
                ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 text-white shadow-sm ring-1 ring-emerald-400/30"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
