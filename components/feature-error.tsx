"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  feature: string;
  error: Error;
  reset: () => void;
};

export function FeatureError({ feature, error, reset }: Props) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">
        {feature} hit an error
      </h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        {error.message || "Something went wrong rendering this section."}
      </p>
      <Button onClick={reset} variant="glass" className="mt-6">
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
