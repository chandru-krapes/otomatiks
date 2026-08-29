"use client";

import { useEffect, useRef, useState } from "react";
import type { Testimonial } from "@/lib/types";
import { PLACEHOLDER } from "@/lib/placeholders";
import EmptyState from "@/components/ui/EmptyState";
import ArrowFlourish from "@/components/ui/ArrowFlourish";
import Stars from "@/components/ui/Stars";

const AUTOPLAY_MS = 6000;

function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function QuoteMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 32" fill="currentColor" aria-hidden="true">
      <path d="M0 20.4C0 9.6 6.8 2.4 16.8 0l2.4 4.8C12 7.2 8.4 11.6 8 18h9.2v14H0V20.4Zm22 0C22 9.6 28.8 2.4 38.8 0l2.4 4.8C34 7.2 30.4 11.6 30 18h9.2v14H22V20.4Z" />
    </svg>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="card relative flex w-[85%] shrink-0 snap-start flex-col gap-4 overflow-hidden rounded-2xl p-6 sm:w-[380px] sm:p-8">
      <QuoteMark className="pointer-events-none absolute -right-2 top-4 h-14 w-14 text-accent/10 sm:h-16 sm:w-16" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-bold text-primary">
          {initials(testimonial.user_name)}
        </div>
        <p className="font-display text-sm font-bold leading-snug text-primary sm:text-base">
          {testimonial.user_name}
        </p>
      </div>

      <Stars rating={testimonial.rating} />

      <p className="relative leading-relaxed text-muted">&ldquo;{testimonial.message}&rdquo;</p>
    </article>
  );
}

/**
 * Platform-wide client feedback (see `Testimonial` in lib/types.ts — the
 * `/testimonials/` endpoint isn't scoped to one event). A horizontal
 * scroll-snap carousel: full native scrolling under the hood (so a swipe or
 * a drag works exactly like anywhere else on a touch device), with
 * prev/next controls and dot indicators layered on top for pointer/keyboard
 * users, and gentle autoplay that pauses on hover/focus and never runs at
 * all under `prefers-reduced-motion`.
 */
export default function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

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

  // Tracks which card is actually front-and-centre — covers manual
  // swipe/drag scrolling too, not just the button/autoplay-driven case.
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

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion()) return;
    const id = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `go` reads state via its functional updater, not this closure.
  }, [paused, count]);

  return (
    <section id="testimonials" className="section-warm relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Compact arrow-flanked eyebrow, distinct from SectionHeading's
            treatment elsewhere — this section reads as a single centred
            statement rather than a header over a content grid. */}
        <div className="flex flex-col items-center text-center">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-primary">
            <ArrowFlourish />
            {PLACEHOLDER.testimonialsEyebrow}
            <ArrowFlourish flip />
          </p>
          <h2 className="mt-3 font-boldonse text-3xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
            {PLACEHOLDER.testimonialsTitle}
          </h2>
        </div>

        {count === 0 ? (
          <div className="mt-14">
            <EmptyState
              title="No testimonials yet"
              description="Feedback from participants and partner schools will appear here."
            />
          </div>
        ) : (
          <div
            className="relative mt-14"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
          >
            {/* Edge fades, matching the sponsor marquee's treatment. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-tint-warm to-transparent sm:w-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-tint-warm to-transparent sm:w-20" />

            <div
              ref={trackRef}
              className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-6 py-2"
            >
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>

            {count > 1 && (
              <div className="mt-8 flex items-center justify-center gap-6">
                <CarouselArrow direction="prev" onClick={() => go(-1)} />

                <div className="flex items-center gap-2">
                  {testimonials.map((testimonial, index) => (
                    <button
                      key={testimonial.id}
                      type="button"
                      aria-label={`Go to testimonial ${index + 1}`}
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
          </div>
        )}
      </div>
    </section>
  );
}

function CarouselArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous testimonial" : "Next testimonial"}
      className="focus-ring press flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-white text-primary shadow-[var(--elev-1)] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--elev-2)]"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

