import { GoalSavingsCalculator } from "@/components/calculators/goal-savings-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Goal Savings · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "goal_savings" }} />
      <GoalSavingsCalculator />
    </>
  );
}
