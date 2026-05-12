import { DISCLAIMER } from "@/lib/buffett/weights";

export function Disclaimer() {
  return (
    <p className="mt-4 font-sans text-[0.65rem] uppercase tracking-wide text-[#1A1814]/35 dark:text-[#F7F3EC]/25">
      {DISCLAIMER}
    </p>
  );
}
