"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { registerParallax } from "./parallaxManager";

/**
 * Small client island: shifts its contents vertically as the page scrolls,
 * for a lightweight parallax feel. The actual scroll listening/rAF work is
 * delegated to a single shared scheduler (see parallaxManager) so having
 * many of these on one page stays cheap and doesn't jank scrolling.
 */
export default function Parallax({
  children,
  className,
  speed = 0.25,
  anchor = "top",
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  /**
   * "top" (default): offset is proportional to raw distance from the top of
   * the viewport, like classic background parallax.
   * "center": offset is 0 when the element is vertically centered in the
   * viewport, growing as it scrolls away from that point. Use this when the
   * parallaxed content must stay visually aligned with a static sibling
   * (e.g. a ghost heading behind a title) instead of drifting from scroll 0.
   */
  anchor?: "top" | "center";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    return registerParallax(node, speed, anchor);
  }, [speed, anchor]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
