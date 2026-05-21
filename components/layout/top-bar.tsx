"use client";

import Link from "next/link";
import { MobileSidebar } from "./mobile-sidebar";
import { MobileSearch } from "./mobile-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { TickerSearch } from "./ticker-search";

type Props = {
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export function TopBar({ email, name, avatarUrl }: Props) {
  return (
    <header
      className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur-2xl md:h-16 md:gap-3 md:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Mobile: hamburger */}
      <MobileSidebar />

      {/* Mobile: centered wordmark */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 md:hidden"
        aria-label="FinHub home"
      >
        <div className="relative flex h-7 w-7 items-center justify-center rounded-sm bg-foreground text-background">
          <span className="font-display text-[13px] font-semibold leading-none">
            F
          </span>
          <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
        </div>
        <span className="font-display text-base font-medium tracking-tight">
          FinHub
        </span>
      </Link>

      {/* Desktop: ticker search fills middle */}
      <TickerSearch />

      <div className="ml-auto flex items-center gap-1 md:gap-3">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:inline-flex md:items-center md:gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_6px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
          Live
        </span>
        <div className="hidden h-5 w-px bg-border/80 md:block" />

        {/* Mobile: search icon (opens full-screen sheet) */}
        <MobileSearch />

        <ThemeToggle />
        <UserMenu email={email} name={name} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
