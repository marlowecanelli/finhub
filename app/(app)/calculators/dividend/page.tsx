import { DividendCalculator } from "@/components/calculators/dividend-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Dividend Calculator · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "dividend" }} />
      <DividendCalculator />
    </>
  );
}
