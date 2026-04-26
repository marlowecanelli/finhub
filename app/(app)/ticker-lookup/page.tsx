import { Search } from "lucide-react";
import { PageShell } from "@/components/dashboard/page-shell";

export default function TickerLookupPage() {
  return (
    <PageShell
      title="Ticker Lookup"
      description="Instant fundamentals, price history, and AI-generated research."
      icon={Search}
    />
  );
}
