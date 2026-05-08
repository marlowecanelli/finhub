import { PositionSizeCalculator } from "@/components/calculators/position-size-calculator";
import { EmitOnMount } from "@/components/achievements/EmitOnMount";

export const metadata = { title: "Position Size · FinHub" };

export default function Page() {
  return (
    <>
      <EmitOnMount event="calculator_used" payload={{ kind: "position_size" }} />
      <PositionSizeCalculator />
    </>
  );
}
