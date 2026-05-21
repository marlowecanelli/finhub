"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUIStore } from "@/store/use-ui-store";
import { NAV_ITEMS } from "./nav-items";

const PRIMARY_HREFS = new Set([
  "/dashboard",
  "/screener",
  "/portfolio",
  "/watchlist",
  "/calendar",
]);

export function MobileSidebar() {
  const pathname = usePathname();
  const open = useUIStore((s) => s.mobileSidebarOpen);
  const setOpen = useUIStore((s) => s.setMobileSidebarOpen);

  const primary = NAV_ITEMS.filter((i) => PRIMARY_HREFS.has(i.href));
  const tools = NAV_ITEMS.filter((i) => !PRIMARY_HREFS.has(i.href));

  const renderItem = (item: (typeof NAV_ITEMS)[number]) => {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "group flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors",
            active
              ? "bg-foreground/[0.06] text-foreground ring-1 ring-inset ring-foreground/[0.08]"
              : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
          )}
        >
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              active
                ? "text-[hsl(var(--signal))]"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span className="flex-1 truncate">{item.label}</span>
          {active && (
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_6px_hsl(var(--signal))]" />
          )}
        </Link>
      </li>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[86vw] max-w-sm border-r border-border/60 bg-background/95 p-0 backdrop-blur-2xl"
      >
        <div
          className="flex h-16 items-center gap-2.5 border-b border-border/60 px-5"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-foreground text-background">
            <span className="font-display text-base font-semibold leading-none">
              F
            </span>
            <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
          </div>
          <SheetTitle className="font-display text-lg font-medium tracking-tight">
            FinHub
          </SheetTitle>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
        >
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Primary
          </p>
          <ul className="space-y-0.5">{primary.map(renderItem)}</ul>

          <p className="mt-6 px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Tools & insights
          </p>
          <ul className="space-y-0.5">{tools.map(renderItem)}</ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
