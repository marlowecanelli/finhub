"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Eye, TrendingDown, BarChart2, RefreshCw, Calendar,
  Zap, Building2, Moon, CalendarDays, Landmark, Star, Filter,
  ChevronLeft, ChevronRight, FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  live?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Insider Activity",       href: "/research/insider-trading",  icon: Eye,          live: true },
  { label: "Short Interest",         href: "/research/short-interest",   icon: TrendingDown, live: true },
  { label: "Macro Dashboard",        href: "/research/macro",            icon: BarChart2 },
  { label: "Sector Rotation",        href: "/research/sector-rotation",  icon: RefreshCw },
  { label: "Earnings Intelligence",  href: "/research/earnings",         icon: Calendar,     live: true },
  { label: "Options Flow",           href: "/research/options-flow",     icon: Zap,          live: true },
  { label: "Institutional",          href: "/research/institutional",    icon: Building2 },
  { label: "Dark Pool",              href: "/research/dark-pool",        icon: Moon,         live: true },
  { label: "Econ Calendar",          href: "/research/calendar",         icon: CalendarDays },
  { label: "Congress Trades",        href: "/research/congress-trades",  icon: Landmark },
  { label: "Analyst Ratings",        href: "/research/analyst-ratings",  icon: Star },
  { label: "Val. Screener",          href: "/research/screener",         icon: Filter },
];

export function ResearchSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col flex-shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "border-r",
        collapsed ? "w-12" : "w-[220px]"
      )}
      style={{ background: "#0D0F14", borderColor: "#1E2130", minHeight: "100vh" }}
    >
      {/* Logo / Title */}
      <div
        className="flex items-center gap-2.5 px-3 py-4 border-b"
        style={{ borderColor: "#1E2130" }}
      >
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded"
          style={{ background: "#00D4FF18", border: "1px solid #00D4FF30" }}
        >
          <FlaskConical size={14} style={{ color: "#00D4FF" }} />
        </div>
        {!collapsed && (
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase font-mono" style={{ color: "#C8D0E7" }}>
            Research
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-none">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium transition-all duration-200",
                active
                  ? "text-[#C8D0E7]"
                  : "text-[#717A94] hover:text-[#C8D0E7]"
              )}
            >
              {/* Active left border */}
              {active && (
                <span
                  className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                  style={{ background: "#00D4FF" }}
                />
              )}

              {/* Active BG */}
              <span
                className={cn(
                  "absolute inset-x-0 inset-y-0 rounded-sm transition-opacity",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
                style={{ background: active ? "#00D4FF08" : "#FFFFFF05" }}
              />

              <Icon
                size={14}
                className="relative z-10 flex-shrink-0"
                style={{ color: active ? "#00D4FF" : undefined }}
              />

              {!collapsed && (
                <span className="relative z-10 truncate">{item.label}</span>
              )}

              {!collapsed && item.live && (
                <span className="relative z-10 ml-auto flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot"
                    style={{ background: "#39FF14" }}
                  />
                  <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "#39FF14" }}>
                    LIVE
                  </span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2" style={{ borderColor: "#1E2130" }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex w-full items-center justify-center rounded p-1.5 text-[#3A3F52] hover:text-[#717A94] transition-colors hover:bg-[#1E2130]"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
