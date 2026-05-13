"use client";

interface PullQuoteProps {
  text: string;
  attribution: string;
}

export function PullQuote({ text, attribution }: PullQuoteProps) {
  return (
    <figure className="relative mt-8 border-t border-border/50 pt-6">
      {/* Large opening quote mark */}
      <span
        className="absolute -top-6 left-0 font-display text-[5rem] leading-none text-[#B08A3E] opacity-50 select-none"
        aria-hidden="true"
      >
        &ldquo;
      </span>
      <blockquote className="pl-6">
        <p className="text-[1rem] italic leading-relaxed text-muted-foreground md:text-[1.05rem]">
          {text}
        </p>
        <footer className="mt-3 font-mono text-[0.72rem] font-medium uppercase tracking-wider text-[#B08A3E]">
          — {attribution}
        </footer>
      </blockquote>
    </figure>
  );
}
