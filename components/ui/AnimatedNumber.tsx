"use client";

import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Counts up to `value` the first time it scrolls into view, and tweens
 * between values whenever `value` changes afterwards.
 *
 * The second behaviour is the one that matters on the booking page: the
 * running total and attendee count change as members are added or removed,
 * and a number that slides to its new value reads as a consequence of the
 * click rather than an unrelated repaint.
 *
 * Uses rAF with an eased curve rather than a CSS transition, because there
 * is no interpolatable CSS property for "text content". Cheap: one rAF chain
 * per instance, only while actually animating.
 */
export default function AnimatedNumber({
  value,
  duration = 700,
  format,
  className = "",
  /** Wait for the element to scroll into view before the first count-up. */
  countOnView = true,
}: {
  value: number;
  duration?: number;
  /** e.g. `formatCurrency`. Applied to every intermediate frame. */
  format?: (value: number) => string;
  className?: string;
  countOnView?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(countOnView ? 0 : value);
  // Where the current tween starts from — the last painted value, so an
  // interruption mid-tween continues from where it visually is.
  const fromRef = useRef(countOnView ? 0 : value);
  const [armed, setArmed] = useState(!countOnView);

  useEffect(() => {
    if (!countOnView) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [countOnView]);

  useEffect(() => {
    if (!armed) return;

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    // Reduced motion: collapse the tween to a single frame. The number is
    // the content — only the travel to it is decorative — so it still lands
    // on the right value, just without the count-up. Handled by zeroing the
    // duration rather than setting state here, so the update still happens
    // in the rAF callback rather than synchronously in the effect body.
    const reduced =
      typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches;
    const runFor = reduced ? 0 : duration;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = runFor === 0 ? 1 : Math.min(1, (now - start) / runFor);
      // easeOutCubic — fast to start, settles gently, matches --ease-out.
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplay(current);
      fromRef.current = current;

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, armed]);

  const rounded = Math.round(display);

  return (
    <span ref={ref} className={`tabular-nums ${className}`} suppressHydrationWarning>
      {format ? format(rounded) : rounded.toLocaleString("en-IN")}
    </span>
  );
}
