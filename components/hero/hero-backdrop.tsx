"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Lazy-load the heavy R3F bundle only on the client, only when we decide to render it.
const Hero3DScene = dynamic(() => import("./hero-3d-scene"), {
  ssr: false,
  loading: () => <StaticBackdrop />,
});

/**
 * Static styled fallback — a soft emerald/blue gradient mesh in the brand palette.
 * Shown on mobile, while the 3D bundle loads, and as the reduced-motion base layer.
 */
function StaticBackdrop() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_60%_40%,black_20%,transparent_72%)]"
      style={{
        background:
          "radial-gradient(38rem 30rem at 64% 38%, hsl(156 100% 50% / 0.16), transparent 60%)," +
          "radial-gradient(34rem 28rem at 40% 60%, hsl(217 91% 60% / 0.12), transparent 62%)," +
          "radial-gradient(26rem 22rem at 75% 64%, hsl(156 100% 50% / 0.08), transparent 64%)",
      }}
    />
  );
}

/**
 * Decides what to render behind the hero headline:
 *  - mobile (<768px): never the 3D scene — static gradient mesh only
 *  - desktop: lazy-loaded R3F scene, with the static mesh as the loading placeholder
 *  - prefers-reduced-motion: scene renders but rotation/parallax are frozen
 */
export function HeroBackdrop() {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mqDesktop = window.matchMedia("(min-width: 768px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const sync = () => {
      setIsDesktop(mqDesktop.matches);
      setReducedMotion(mqMotion.matches);
    };
    sync();

    mqDesktop.addEventListener("change", sync);
    mqMotion.addEventListener("change", sync);
    return () => {
      mqDesktop.removeEventListener("change", sync);
      mqMotion.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Always render the static mesh as the base; the canvas layers on top when ready. */}
      <StaticBackdrop />
      {mounted && isDesktop && (
        <div className="absolute inset-0 opacity-90 [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_85%)]">
          <Hero3DScene reducedMotion={reducedMotion} />
        </div>
      )}
    </div>
  );
}
