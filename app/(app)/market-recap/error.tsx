"use client";
import { FeatureError } from "@/components/feature-error";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <FeatureError feature="Market Recap" error={error} reset={reset} />;
}
