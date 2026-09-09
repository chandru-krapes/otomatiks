"use client";

import { useEffect, useRef, useState } from "react";
import type { Event, Perk } from "@/lib/types";
import { PLACEHOLDER } from "@/lib/placeholders";
import ArrowFlourish from "@/components/ui/ArrowFlourish";

const AUTOPLAY_MS = 4500;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TrophyIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4" />
    </svg>
  );
}

function CarouselArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous perk" : "Next perk"}
      className="focus-ring press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-white shadow-[var(--elev-2)] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[var(--elev-3)]"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

function PerkCard({ perk }: { perk: Perk }) {
  return (
    <article className="card group relative flex w-[78%] shrink-0 snap-start flex-col items-center gap-5 overflow-hidden rounded-3xl p-7 text-center transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] hover:-translate-y-1.5 sm:w-[260px]">
      {/* `bg-white` rather than a colour — most admin-uploaded perk icons (stock trophy/medal/
      cash GIFs and the like) sit on an opaque white square, not a real transparent background.
      A `mix-blend-multiply` trick to fake transparency was tried first, but it tints the icon's
      own colours by whatever sits behind it, which read worse than the white box it removed.
      Matching the badge to that white instead means the square simply disappears into it — the
      accent ring supplies the colour this badge would otherwise have gotten from a fill. */}
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white shadow-[var(--elev-2)] ring-4 ring-secondary/15 transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-105">
        {perk.icon_url ? (
          // `loading="lazy"` — admin-uploaded perk icons are frequently unoptimized stock
          // GIFs well over 1MB apiece (see the About section's own icon swap for the same
          // issue); this section already sits below the fold on most viewports, so there's no
          // reason to spend that bandwidth before a visitor scrolls anywhere near it.
          // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded icon URL, not an optimizable static asset.
          <img src={perk.icon_url} alt="" loading="lazy" className="h-14 w-14 object-contain" />
        ) : (
          <TrophyIcon className="h-9 w-9 text-secondary" />
        )}
      </div>

      <div className="relative flex flex-col gap-1.5">
        <h3 className="font-display text-lg font-bold leading-snug text-primary">{perk.title}</h3>
        {perk.description && <p className="text-sm leading-relaxed text-muted">{perk.description}</p>}
      </div>
    </article>
  );
}

// "What You Get" — prize/benefit highlights (trophy, medal, certificate, prize pool, ...) for
// the event website. `event.perks` already comes merged (platform-wide + this event's own)
// and ordered from the backend — see lib/types.ts `Perk` and PublicEventSerializer.get_perks.
export default function WhatYouGet({ event }: { event: Event }) {
  const perks = event.perks ?? [];
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = perks.length;

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    const card = track?.children[index] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }

  function go(delta: number) {
    setActiveIndex((current) => {
      const next = (current + delta + count) % count;
      scrollToIndex(next);
      return next;
    });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track || count === 0) return;

    const cards = Array.from(track.children) as HTMLElement[];
    const ratios = new Map<Element, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) ratios.set(entry.target, entry.intersectionRatio);
        let bestIndex = 0;
        let bestRatio = -1;
        cards.forEach((card, index) => {
          const ratio = ratios.get(card) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = index;
          }
        });
        setActiveIndex(bestIndex);
      },
      { root: track, threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [count]);

  // Auto-advances through the perks — same idea as Testimonials, paused on hover/focus so
  // a visitor reading a card isn't fighting the carousel.
  useEffect(() => {
    if (count <= 1 || paused || reducedMotion()) return;
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <section id="what-you-get" className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div
        className="tech-grid pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-secondary">
              <ArrowFlourish />
              {PLACEHOLDER.perksEyebrow}
            </p>
            <h2 className="mt-3 font-boldonse text-3xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
              {PLACEHOLDER.perksTitle}
            </h2>
          </div>

          {count > 1 && (
            <div className="hidden items-center gap-3 sm:flex">
              <CarouselArrow direction="prev" onClick={() => go(-1)} />
              <CarouselArrow direction="next" onClick={() => go(1)} />
            </div>
          )}
        </div>

        <div
          className="relative mt-12"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Right edge only — a matching left-edge fade sat over the very first card with
          nothing to actually mask (the row starts at index 0), so against this section's own
          background it just read as a stray shadow in that corner rather than a scroll hint. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent sm:w-16" />

          <div
            ref={trackRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 py-2"
          >
            {perks.map((perk) => (
              <PerkCard key={perk.id} perk={perk} />
            ))}
          </div>

          {count > 1 && (
            <div className="mt-8 flex items-center justify-center gap-6 sm:hidden">
              <CarouselArrow direction="prev" onClick={() => go(-1)} />
              <div className="flex items-center gap-2">
                {perks.map((perk, index) => (
                  <button
                    key={perk.id}
                    type="button"
                    aria-label={`Go to perk ${index + 1}`}
                    aria-current={index === activeIndex}
                    onClick={() => {
                      setActiveIndex(index);
                      scrollToIndex(index);
                    }}
                    className={`focus-ring press h-2 rounded-full transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] ${
                      index === activeIndex ? "w-6 bg-secondary" : "w-2 bg-primary/15 hover:bg-primary/30"
                    }`}
                  />
                ))}
              </div>
              <CarouselArrow direction="next" onClick={() => go(1)} />
            </div>
          )}

          {count > 1 && (
            <div className="mt-6 hidden items-center justify-center gap-2 sm:flex">
              {perks.map((perk, index) => (
                <button
                  key={perk.id}
                  type="button"
                  aria-label={`Go to perk ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={() => {
                    setActiveIndex(index);
                    scrollToIndex(index);
                  }}
                  className={`focus-ring press h-2 rounded-full transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] ${
                    index === activeIndex ? "w-6 bg-secondary" : "w-2 bg-primary/15 hover:bg-primary/30"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
