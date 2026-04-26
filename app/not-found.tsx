import Link from "next/link";
import { ArrowLeft, Search, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Lost in the market" };

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />

      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Error 404 · ticker not found
        </p>

        <div className="my-6 inline-flex items-end gap-3">
          <span className="font-mono text-7xl font-semibold tracking-tight md:text-9xl">
            $LOST
          </span>
          <span className="mb-3 inline-flex items-center gap-1 rounded-md bg-[#ef4444]/10 px-2 py-1 font-mono text-sm font-semibold text-[#ef4444] ring-1 ring-inset ring-[#ef4444]/30">
            <TrendingDown className="h-3.5 w-3.5" />
            -100.00%
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          This page got delisted.
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Whatever you were looking for isn&apos;t here. Check the URL, or jump back into the app.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
          <Button asChild variant="glass">
            <Link href="/screener">
              <Search className="h-4 w-4" /> Browse the screener
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
