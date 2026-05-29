"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  GraduationCap,
  Camera,
  Trophy,
  Sparkles,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import {
  ASSESSMENT_DATA,
  ASSESSMENT_IS_PLACEHOLDER,
  CASE_STUDIES,
  type AssessmentSet,
} from "@/lib/impact-data";

// Brand palette — signal green for the highlighted slice, muted for the rest.
const SLICE_COLORS = ["hsl(var(--signal))", "hsl(var(--muted-foreground) / 0.22)"];

function AssessmentDonut({
  data,
  caption,
}: {
  data: AssessmentSet;
  caption: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44 md:h-48 md:w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.slices}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              strokeWidth={0}
              isAnimationActive
            >
              {data.slices.map((slice, i) => (
                <Cell key={slice.label} fill={SLICE_COLORS[i]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center read-out */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-medium leading-none md:text-4xl">
            {data.slices[0].value}%
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            confident
          </span>
        </div>
      </div>
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {caption}
      </p>
      <p className="mt-1 font-display text-lg font-medium tracking-tight">
        {data.headline}
      </p>
    </div>
  );
}

export function ImpactSection() {
  const study = CASE_STUDIES[0];

  return (
    <section id="impact" className="relative scroll-mt-24 border-t border-border/60">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-10 md:py-32">
        {/* ─── Section head ─── */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <p className="editorial-eyebrow text-muted-foreground">
              Impact — In the field
            </p>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h2 className="font-display text-3xl font-medium tracking-tight md:text-5xl">
              Teaching money{" "}
              <span className="display-italic text-foreground/70">
                where it starts.
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-foreground/70">
              FinHub isn&apos;t only a product. We take financial literacy into
              classrooms — meeting students before the habits set in.
            </p>
          </div>
        </div>

        {/* ─── Case study card ─── */}
        <article className="card-edge relative mt-12 overflow-hidden rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl">
          <div className="absolute inset-0 bg-aurora opacity-40" aria-hidden />
          <div className="relative grid grid-cols-1 gap-px bg-border/40 lg:grid-cols-2">
            {/* Left: the write-up */}
            <div className="bg-card/40 p-8 md:p-10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--signal))]">
                  {study.eyebrow}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {study.dateLabel}
                </span>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-foreground text-background">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <h3 className="font-display text-3xl font-medium tracking-tight">
                  {study.school}
                </h3>
              </div>

              <p className="mt-5 max-w-md text-sm leading-relaxed text-foreground/75">
                {study.summary}
              </p>

              <ul className="mt-7 flex flex-wrap gap-2">
                {study.topics.map((t) => (
                  <li
                    key={t}
                    className="rounded-full border border-border/70 bg-background/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/70"
                  >
                    {t}
                  </li>
                ))}
              </ul>

              <div className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--signal))/0.3] bg-[hsl(var(--signal))/0.06] px-3 py-2">
                <Trophy className="h-4 w-4 text-[hsl(var(--signal))]" />
                <span className="text-xs text-foreground/80">
                  Closed with a team Jeopardy round to put the lesson to work.
                </span>
              </div>
            </div>

            {/* Right: photo gallery placeholder */}
            <div className="bg-card/40 p-8 md:p-10">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Classroom gallery
                </span>
                <span className="rounded-full border border-border/70 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-foreground/55">
                  Pending approval
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border/70 bg-gradient-to-br from-background/60 to-card/30 ${
                      i === 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
                    }`}
                  >
                    <div
                      className="bg-dotgrid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
                      aria-hidden
                    />
                    <Camera className="relative h-5 w-5 text-foreground/30 transition-colors group-hover:text-[hsl(var(--signal))]" />
                    <span className="relative mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                      Photo {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-foreground/55">
                Photos from the visit will appear here once the school signs off
                on releasing classroom imagery.
              </p>
            </div>
          </div>
        </article>

        {/* ─── Before / after data viz ─── */}
        <div className="mt-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <p className="editorial-eyebrow text-muted-foreground">
              Before &amp; after
            </p>
            <h3 className="mt-3 font-display text-2xl font-medium tracking-tight md:text-3xl">
              Confidence,{" "}
              <span className="display-italic text-foreground/70">measured.</span>
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/70">
              Students rated how confident they felt managing money before and
              after the session. We track the lift to keep the curriculum honest.
            </p>
            {ASSESSMENT_IS_PLACEHOLDER && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-600 dark:text-amber-400">
                  Placeholder data
                </span>
              </div>
            )}
          </div>

          <div className="col-span-12 md:col-span-8">
            <div className="card-edge relative overflow-hidden rounded-2xl border border-border/80 bg-card/60 p-8 backdrop-blur-xl md:p-10">
              <div className="grid grid-cols-1 items-center gap-10 sm:grid-cols-2">
                <AssessmentDonut data={ASSESSMENT_DATA.before} caption="Before" />
                <AssessmentDonut data={ASSESSMENT_DATA.after} caption="After" />
              </div>

              {/* Legend */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/50 pt-6">
                <span className="flex items-center gap-2 text-xs text-foreground/70">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--signal))]" />
                  Confident
                </span>
                <span className="flex items-center gap-2 text-xs text-foreground/70">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[hsl(var(--muted-foreground)/0.22)]" />
                  Not yet confident
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Invite line ─── */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/40 px-6 py-6 backdrop-blur-sm sm:flex-row sm:items-center md:px-10">
          <p className="max-w-xl text-sm text-foreground/75">
            Run a school or program?{" "}
            <span className="text-foreground">We&apos;d love to visit your students.</span>{" "}
            Book a free financial-literacy session.
          </p>
          <Button asChild className="sweep shrink-0">
            <Link href="/#inquiry" className="flex items-center gap-2">
              Book a visit
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
