"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

export type RevealVariant = "up" | "left" | "right" | "scale" | "fade";

/**
 * Small client island: animates a section in the first time it scrolls into
 * view. Pure CSS handles the actual animation (see globals.css
 * `[data-reveal]`) — this just flips one data attribute via
 * IntersectionObserver, and `prefers-reduced-motion` is handled in CSS.
 *
 * `variant` picks the direction (the default `up` is the original
 * behaviour), and `delay` offsets the start so a pair of adjacent reveals
 * can be sequenced without a `Stagger` wrapper.
 *
 * Cycles through three states, not two: `hidden` → `visible` (plays the
 * entrance animation) → `settled` once it finishes. The animation ends with
 * `animation-fill-mode: forwards`, which is what makes it hold its final
 * position instead of snapping back — but per the CSS spec, holding *any*
 * non-`none` `transform` (even the identity `translate3d(0,0,0)` the
 * animation ends on) turns the element into a containing block for any
 * `position: fixed` descendant, and keeps it promoted as its own GPU layer.
 * On a page with a dozen-plus `Reveal`s, that's a dozen-plus permanent
 * layers and a landmine for anything fixed-positioned nested inside one
 * (exactly what broke `Lightbox` before it was moved to a portal). Settling
 * to a plain `opacity: 1` with no transform at all once the animation ends
 * avoids both.
 */
export default function Reveal({
  children,
  className,
  variant = "up",
  delay = 0,
  /** How much of the element must be visible before it fires. */
  threshold = 0.12,
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  threshold?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"hidden" | "visible" | "settled">("hidden");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("visible");
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  useEffect(() => {
    if (state !== "visible") return;
    const node = ref.current;
    if (!node) return;

    // Under `prefers-reduced-motion` the CSS animation is disabled entirely
    // (see globals.css), so this never fires — that's fine, the reduced-
    // motion rules already force `transform: none` on the "visible" state
    // directly, so there's nothing left for "settled" to clean up there.
    const onAnimationEnd = () => setState("settled");
    node.addEventListener("animationend", onAnimationEnd);
    return () => node.removeEventListener("animationend", onAnimationEnd);
  }, [state]);

  return (
    <div
      ref={ref}
      data-reveal={state === "hidden" ? "hidden" : state === "visible" ? "visible" : "settled"}
      // `up` is the base `[data-reveal="visible"]` rule, so it deliberately
      // sets no variant attribute — that keeps the original selector working
      // for every existing call site.
      data-reveal-variant={variant === "up" ? undefined : variant}
      style={delay ? ({ ["--reveal-delay" as string]: `${delay}ms` } as CSSProperties) : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
