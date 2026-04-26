import { BreakingSkeleton, NewsCardSkeleton } from "@/components/news/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-80" />
      </div>
      <BreakingSkeleton />
      <Skeleton className="h-16 rounded-2xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
