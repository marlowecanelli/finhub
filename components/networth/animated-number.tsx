"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  format,
  durationMs = 900,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef(value);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    const from = display;
    startRef.current = from;
    startTime.current = null;
    let rafId = 0;
    const step = (t: number) => {
      if (startTime.current === null) startTime.current = t;
      const elapsed = t - startTime.current;
      const k = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = from + (value - from) * eased;
      setDisplay(v);
      if (k < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{format(display)}</span>;
}
