import { LoanCalculator } from "@/components/calculators/loan-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Loan / Mortgage · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "loan" }} />
      <LoanCalculator />
    </>
  );
}
