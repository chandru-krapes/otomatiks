"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Client island wrapping the (otherwise server-rendered) header contents,
 * purely so the bar can react to scroll position: it starts airy and
 * semi-transparent over the hero, then condenses to a solid, shadowed bar
 * once the page moves.
 *
 * Deliberately never goes fully transparent. The hero only *sometimes* has a
 * banner image behind it (`banner_url` is optional — see lib/types.ts), so a
 * transparent bar would leave white nav text on a white hero for any event
 * that hasn't uploaded one. Keeping the primary ground at every scroll
 * position means contrast holds for every event.
 *
 * The scroll listener is passive and rAF-throttled, and it only ever writes
 * a boolean — so it re-renders at most twice per page, at the threshold
 * crossing, rather than on every frame. That part was never the cost,
 * though: this header used to carry `backdrop-filter`, which the browser
 * has to resample and reblur on its own, every compositor frame, for as
 * long as a `sticky`/`fixed` element with it stays on screen while the page
 * scrolls underneath — completely independent of React. That's one of the
 * more expensive things a browser does, and this bar is on screen for the
 * entire scroll session on every page, so it's replaced with plain alpha
 * translucency (cheap: no resampling, just blending) instead.
 */
const CONDENSE_AT = 24;

export default function StickyHeaderShell({ children }: { children: ReactNode }) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    let ticking = false;

    const check = () => {
      ticking = false;
      setCondensed(window.scrollY > CONDENSE_AT);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };

    // Run once on mount so a restored scroll position (back-navigation,
    // deep link to an anchor) starts in the right state rather than
    // snapping into it on the first scroll event.
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-condensed={condensed}
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-[var(--dur-med)] ease-[var(--ease-out)] ${
        condensed
          ? "border-b border-white/12 bg-primary shadow-[0_8px_30px_-8px_rgba(6,106,171,0.5)]"
          : "border-b border-transparent bg-primary/85"
      }`}
    >
      {children}
    </header>
  );
}
