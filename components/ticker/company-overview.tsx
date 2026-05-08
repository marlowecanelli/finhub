"use client";

import { useState } from "react";
import { ExternalLink, MapPin, User, Users } from "lucide-react";
import { motion } from "framer-motion";
import type { TickerSummary } from "@/lib/yahoo";

type Props = { profile: TickerSummary["profile"] };

export function CompanyOverview({ profile }: Props) {
  const [expanded, setExpanded] = useState(false);
  const description = profile.description ?? "";
  const long = description.length > 500;
  const visible = expanded || !long ? description : `${description.slice(0, 500)}…`;

  const leftRows: { label: string; value: React.ReactNode }[] = [
    { label: "Sector", value: profile.sector ?? "—" },
    { label: "Industry", value: profile.industry ?? "—" },
    { label: "Headquarters", value: profile.headquarters ?? "—" },
    {
      label: "Employees",
      value: profile.employees != null ? new Intl.NumberFormat("en-US").format(profile.employees) : "—",
    },
    {
      label: "Website",
      value: profile.website ? (
        <a href={profile.website} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
          {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          <ExternalLink className="h-3 w-3" />
        </a>
      ) : "—",
    },
  ];

  const rightRows: { label: string; value: React.ReactNode }[] = [
    { label: "CEO", value: profile.ceo ?? "—" },
    { label: "Exchange", value: profile.exchange ?? "—" },
    { label: "Currency", value: profile.currency ?? "—" },
  ];

  return (
    <section className="glass p-6 md:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Section</span>
        <h2 className="font-display text-xl font-medium tracking-tight">Company Overview</h2>
      </div>

      {/* Sector/Industry pills */}
      {(profile.sector || profile.industry) && (
        <div className="mb-5 flex flex-wrap gap-2">
          {profile.sector && (
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {profile.sector}
            </span>
          )}
          {profile.industry && (
            <span className="rounded-full border border-border/60 bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              {profile.industry}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Description */}
        <div className="md:flex-1">
          {description ? (
            <>
              <motion.p layout className="text-sm leading-relaxed text-foreground/85">
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
            <p className="text-sm text-muted-foreground">No company description available.</p>
          )}
        </div>

        {/* Two-column meta */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 md:w-96 md:shrink-0 md:border-l md:border-border/50 md:pl-6">
          {leftRows.map(({ label, value }) => (
            <div key={label} className="col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground/90">{value}</p>
            </div>
          ))}
          {rightRows.map(({ label, value }) => (
            <div key={label} className="col-span-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground/90">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
