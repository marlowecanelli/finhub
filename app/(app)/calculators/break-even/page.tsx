import { BreakEvenCalculator } from "@/components/calculators/break-even-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Break-Even · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "break_even" }} />
      <BreakEvenCalculator />
    </>
  );
}
