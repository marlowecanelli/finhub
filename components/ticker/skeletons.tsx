import { Skeleton } from "@/components/ui/skeleton";

export function TickerHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-12 w-56" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
    </div>
  );
}

export function KeyStatsSkeleton() {
  return (
    <div className="glass grid grid-cols-2 divide-x divide-y divide-border/40 overflow-hidden md:grid-cols-3 lg:grid-cols-5 [&>*]:p-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}
