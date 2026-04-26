"use client";

import { useEffect, useState } from "react";

type Options = {
  duration?: number;
  decimals?: number;
};

export function useCountUp(
  target: number | null | undefined,
  { duration = 900, decimals = 2 }: Options = {}
): number {
  const [value, setValue] = useState<number>(0);

  useEffect(() => {
    if (target == null || !Number.isFinite(target)) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = target;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      const factor = Math.pow(10, decimals);
      setValue(Math.round(next * factor) / factor);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals]);

  return value;
}
