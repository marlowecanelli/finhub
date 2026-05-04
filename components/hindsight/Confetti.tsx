"use client";

import { useEffect } from "react";

/** Lightweight DOM confetti — no extra deps. Fires once when `trigger` flips truthy. */
export function Confetti({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (!trigger) return;
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const colors = ["#c8a85a", "#7a9a4a", "#e6d29a", "#8fbf78", "#fff8e0"];
    const count = 80;
    const root = document.createElement("div");
    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "9999",
      overflow: "hidden",
    } as CSSStyleDeclaration);
    document.body.appendChild(root);

    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      const size = 6 + Math.random() * 8;
      const startX = 30 + Math.random() * 40; // start near top center horizontally (vw)
      const angle = (Math.random() - 0.5) * 140; // -70 to +70 deg
      const distance = 300 + Math.random() * 500;
      const dx = Math.sin((angle * Math.PI) / 180) * distance;
      const dy = Math.cos((angle * Math.PI) / 180) * distance + 200;
      const rot = Math.random() * 720 - 360;
      const duration = 1400 + Math.random() * 1600;
      const delay = Math.random() * 200;

      Object.assign(el.style, {
        position: "absolute",
        top: "20%",
        left: `${startX}%`,
        width: `${size}px`,
        height: `${size * 0.4}px`,
        background: colors[i % colors.length],
        opacity: "0",
        borderRadius: "1px",
        transform: "translate(0,0) rotate(0deg)",
        transition: `transform ${duration}ms cubic-bezier(0.2, 0.6, 0.2, 1) ${delay}ms, opacity ${duration}ms ease-out ${delay}ms`,
      } as CSSStyleDeclaration);
      root.appendChild(el);

      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
        setTimeout(() => {
          el.style.opacity = "0";
        }, duration * 0.7 + delay);
      });
    }

    const cleanup = setTimeout(() => root.remove(), 4000);
    return () => {
      clearTimeout(cleanup);
      root.remove();
    };
  }, [trigger]);

  return null;
}
