import {
  LayoutDashboard,
  Filter,
  Briefcase,
  Hammer,
  Calculator,
  Newspaper,
  Star,
  CalendarDays,
  History,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Screener", href: "/screener", icon: Filter },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase },
  { label: "Watchlist", href: "/watchlist", icon: Star },
  { label: "Builder", href: "/builder", icon: Hammer },
  { label: "Calculators", href: "/calculators", icon: Calculator },
  { label: "Hindsight", href: "/hindsight", icon: History },
  { label: "News", href: "/news", icon: Newspaper },
] as const;
