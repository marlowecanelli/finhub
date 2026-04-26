import { Skeleton } from "@/components/ui/skeleton";
import { TickerHeaderSkeleton, KeyStatsSkeleton } from "@/components/ticker/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <TickerHeaderSkeleton />
      <Skeleton className="h-[380px] w-full rounded-2xl" />
      <KeyStatsSkeleton />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl md:col-span-2" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-2xl" />
    </div>
  );
}
