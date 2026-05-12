"use client";

interface PullQuoteProps {
  text: string;
  attribution: string;
}

export function PullQuote({ text, attribution }: PullQuoteProps) {
  return (
    <figure className="relative mt-8 border-t border-[#D9D2C2]/60 pt-6 dark:border-[#2A2520]">
      {/* Large opening quote mark */}
      <span
        className="absolute -top-6 left-0 font-display text-[5rem] leading-none text-[#B08A3E] opacity-60 select-none"
        aria-hidden="true"
      >
        "
      </span>
      <blockquote className="pl-6">
        <p className="font-serif text-[1rem] italic leading-relaxed text-[#1A1814]/75 dark:text-[#F7F3EC]/65 md:text-[1.05rem]">
          {text}
        </p>
        <footer className="mt-3 font-sans text-[0.72rem] font-medium uppercase tracking-wider text-[#B08A3E]">
          — {attribution}
        </footer>
      </blockquote>
    </figure>
  );
}
