import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TickerNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30">
        <SearchX className="h-6 w-6" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        Ticker not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We couldn&apos;t find any data for that symbol. It may be delisted, mistyped,
        or unsupported by our data provider.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
