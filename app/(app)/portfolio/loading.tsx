import { PortfolioSkeleton } from "@/components/portfolio/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-muted/50" />
        <div className="h-8 w-56 rounded bg-muted/50" />
      </div>
      <PortfolioSkeleton />
    </div>
  );
}
