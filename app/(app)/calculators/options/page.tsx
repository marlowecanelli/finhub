import { OptionsCalculator } from "@/components/calculators/options-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Options Pricing · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "options" }} />
      <OptionsCalculator />
    </>
  );
}
