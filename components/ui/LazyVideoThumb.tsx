"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted, poster-only `<video>` that doesn't request anything until it's
 * actually about to scroll into view.
 *
 * `<video>` has no native `loading="lazy"` the way `<img>` does — setting
 * `preload="metadata"` alone still fires a request the moment the element
 * mounts, so a grid with several video tiles (Gallery, EventCategories'
 * hero) was firing that many concurrent metadata fetches/decodes on mount
 * regardless of scroll position. This withholds `src` until an
 * IntersectionObserver says the tile is close, which is the same withhold-
 * until-needed effect `loading="lazy"` gives `<img>`.
 */
export default function LazyVideoThumb({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          observer.disconnect();
        }
      },
      // Starts the fetch a little before the tile is actually on screen, so
      // the poster frame is already there by the time it scrolls into view.
      { rootMargin: "200px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={armed ? src : undefined}
      preload="metadata"
      muted
      playsInline
      tabIndex={-1}
      className={className}
    />
  );
}
