"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Filter,
  Briefcase,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/use-ui-store";

const PRIMARY = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Screener", href: "/screener", icon: Filter },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Watchlist", href: "/watchlist", icon: Star },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const setOpen = useUIStore((s) => s.setMobileSidebarOpen);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex">
              <Link
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium tracking-wide transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute top-0 h-[2px] w-8 rounded-b-full bg-[hsl(var(--signal))] shadow-[0_0_6px_hsl(var(--signal))]" />
                )}
                <Icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            aria-label="More"
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
