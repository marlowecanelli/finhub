import { DISCLAIMER } from "@/lib/buffett/weights";

export function Disclaimer() {
  return (
    <p className="font-mono text-[0.65rem] uppercase tracking-wide text-muted-foreground/50">
      {DISCLAIMER}
    </p>
  );
}
