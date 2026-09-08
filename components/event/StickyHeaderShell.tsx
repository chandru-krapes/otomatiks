"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

// Client island wrapping the (otherwise server-rendered) header contents for the event website
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
