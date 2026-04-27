"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/use-ui-store";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "sticky top-0 z-30 hidden h-screen shrink-0 border-r border-border/60 bg-card/30 backdrop-blur-xl transition-[width] duration-300 ease-out md:flex md:flex-col",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-foreground text-background">
            <span className="font-display text-base font-semibold leading-none">
              F
            </span>
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
          </div>
          {!collapsed && (
            <span className="truncate font-display text-lg font-medium tracking-tight">
              FinHub
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Collapse sidebar"
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    collapsed && "justify-center"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-md bg-foreground/[0.06] ring-1 ring-inset ring-foreground/[0.08]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))]" />
                  )}
                  <Icon
                    className={cn(
                      "relative h-4 w-4 shrink-0 transition-colors",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && <span className="relative">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {collapsed && (
        <div className="border-t border-border/60 p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Expand sidebar"
            className="w-full"
          >
            <ChevronsLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      )}
    </aside>
  );
}
