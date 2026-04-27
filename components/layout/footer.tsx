import Link from "next/link";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-background/40 backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-10">
        <div className="grid grid-cols-12 gap-6 border-b border-border/40 pb-8">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-sm bg-foreground text-background">
                <span className="font-display text-lg font-semibold leading-none">
                  F
                </span>
                <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
              </div>
              <span className="font-display text-2xl font-medium tracking-tight">
                FinHub
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-foreground/65">
              A terminal for the rest of us. The market, refined for considered
              investors.
            </p>
          </div>

          <div className="col-span-12 md:col-span-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Sections
            </p>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-foreground/70 transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="col-span-12 md:col-span-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Disclosure
            </p>
            <p className="mt-4 text-xs leading-relaxed text-foreground/60">
              Educational tool only. Nothing on FinHub constitutes financial
              advice. Markets are unpredictable. Read accordingly.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} · FinHub Editorial · Vol. 1
          </p>
          <p className="font-serif text-sm italic text-foreground/55">
            Set in Instrument Serif &amp; Inter.
          </p>
        </div>
      </div>
    </footer>
  );
}
