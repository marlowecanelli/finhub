"use client";

import { MobileSidebar } from "./mobile-sidebar";
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-2xl md:px-6">
      <MobileSidebar />

      <TickerSearch />

      <div className="md:hidden flex-1" />

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:inline-flex md:items-center md:gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_6px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
          Live
        </span>
        <div className="hidden h-5 w-px bg-border/80 md:block" />
        <ThemeToggle />
        <UserMenu email={email} name={name} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
