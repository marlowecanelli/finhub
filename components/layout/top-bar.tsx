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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <MobileSidebar />

      <TickerSearch />

      <div className="md:hidden flex-1" />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu email={email} name={name} avatarUrl={avatarUrl} />
      </div>
    </header>
  );
}
