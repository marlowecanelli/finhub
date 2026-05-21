export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-background/40 backdrop-blur-sm">
      <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-sm bg-foreground text-background">
                <span className="font-display text-base font-semibold leading-none">F</span>
                <div className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--signal))] shadow-[0_0_8px_hsl(var(--signal))] animate-[signal-pulse_2.4s_ease-in-out_infinite]" />
              </div>
              <span className="font-display text-xl font-medium tracking-tight">FinHub</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-foreground/60">
              A terminal for the rest of us. The market, refined for considered investors.
            </p>
          </div>

          {/* Disclosure */}
          <p className="max-w-sm text-xs leading-relaxed text-foreground/50">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Disclosure · </span>
            Educational tool only. Nothing on FinHub constitutes financial advice. Markets are unpredictable. Read accordingly.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5 md:mt-8 md:pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} · FinHub Editorial · Vol. 1
          </p>
          <p className="hidden font-serif text-sm italic text-foreground/45 md:block">
            Set in Instrument Serif &amp; Inter.
          </p>
        </div>
      </div>
    </footer>
  );
}
