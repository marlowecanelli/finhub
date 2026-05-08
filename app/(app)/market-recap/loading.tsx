export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-10 animate-pulse">
      <div className="space-y-3">
        <div className="h-5 w-48 rounded-full bg-muted/40" />
        <div className="h-8 w-3/4 rounded-lg bg-muted/40" />
        <div className="h-8 w-1/2 rounded-lg bg-muted/30" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-16 w-24 shrink-0 rounded-xl bg-muted/30" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-muted/10 p-6 space-y-3">
          <div className="h-4 w-32 rounded bg-muted/40" />
          <div className="space-y-2">
            <div className="h-3.5 w-full rounded bg-muted/30" />
            <div className="h-3.5 w-5/6 rounded bg-muted/30" />
            <div className="h-3.5 w-4/5 rounded bg-muted/25" />
            <div className="h-3.5 w-2/3 rounded bg-muted/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
