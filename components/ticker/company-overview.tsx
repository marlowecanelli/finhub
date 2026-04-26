"use client";

import { useState } from "react";
import { Building2, ExternalLink, MapPin, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TickerSummary } from "@/lib/yahoo";

type Props = {
  profile: TickerSummary["profile"];
};

export function CompanyOverview({ profile }: Props) {
  const [expanded, setExpanded] = useState(false);
  const description = profile.description ?? "";
  const long = description.length > 420;
  const visible = expanded || !long ? description : `${description.slice(0, 420)}…`;

  const rows: { icon: React.ElementType; label: string; value: React.ReactNode }[] = [
    { icon: Building2, label: "Sector", value: profile.sector ?? "—" },
    { icon: Building2, label: "Industry", value: profile.industry ?? "—" },
    {
      icon: User,
      label: "CEO",
      value: profile.ceo ?? "—",
    },
    {
      icon: Users,
      label: "Employees",
      value:
        profile.employees != null
          ? new Intl.NumberFormat("en-US").format(profile.employees)
          : "—",
    },
    { icon: MapPin, label: "Headquarters", value: profile.headquarters ?? "—" },
  ];

  return (
    <section className="glass p-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:flex-1">
          <h2 className="text-sm font-semibold text-muted-foreground">
            About the company
          </h2>
          {description ? (
            <>
              <motion.p
                layout
                className="mt-3 text-sm leading-relaxed text-foreground/90"
              >
                {visible}
              </motion.p>
              {long && (
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="mt-2 text-xs font-medium text-primary hover:underline"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No company description available.
            </p>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              Visit website <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="md:w-72 md:border-l md:border-border/60 md:pl-6">
          <ul className="space-y-3">
            {rows.map(({ icon: Icon, label, value }) => (
              <li
                key={label}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </span>
                <span
                  className={cn(
                    "max-w-[60%] truncate text-right font-medium text-foreground"
                  )}
                  title={typeof value === "string" ? value : undefined}
                >
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
