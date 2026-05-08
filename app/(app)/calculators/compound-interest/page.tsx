import { CompoundInterestCalculator } from "@/components/calculators/compound-interest-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Compound Interest · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "compound_interest" }} />
      <CompoundInterestCalculator />
    </>
  );
}
