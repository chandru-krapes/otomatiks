"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Event, GalleryItem, TicketType } from "@/lib/types";
import { formatClockTime, formatDate } from "@/lib/format";
import { formatCurrency } from "@/lib/pricing";
import { isTicketAvailable } from "@/lib/booking";
import SectionHeading from "./SectionHeading";
import AddToCartButton from "@/components/booking/AddToCartButton";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Lightbox, { useLightbox } from "@/components/ui/Lightbox";

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PlayIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

function CategoryMedia({
  gallery,
  categoryName,
  onExpand,
}: {
  gallery: GalleryItem[];
  categoryName: string;
  onExpand: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const item = gallery[index];
  const hasMultiple = gallery.length > 1;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || armed) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [armed]);

  function go(next: number) {
    setIndex((next + gallery.length) % gallery.length);
  }

  // Auto-advance through the gallery once it's on screen, unless the current
  // slide is a video (let it play out) or the user is hovering to browse manually.
  useEffect(() => {
    if (!hasMultiple || !armed || paused || item.media_type === "video") return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % gallery.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [hasMultiple, armed, paused, item.media_type, gallery.length]);

  return (
    <div
      ref={wrapperRef}
      className="group/media absolute inset-0 h-full w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        onClick={() => onExpand(index)}
        aria-label={item.caption ? `View ${item.caption}` : `View ${categoryName} media`}
        className="absolute inset-0 h-full w-full"
      >
        {item.media_type === "video" ? (
          <video
            key={item.id}
            src={armed ? item.media_url : undefined}
            preload="metadata"
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={item.media_url}
            alt={item.caption ?? ""}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover/media:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
        {item.media_type !== "video" && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl backdrop-blur-sm transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover/media:scale-110">
            <PlayIcon className="h-5 w-5 translate-x-[2px]" />
          </span>
        )}
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              go(index - 1);
            }}
            aria-label="Previous media"
            className="focus-ring press absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-[var(--dur-fast)] group-hover/media:opacity-100 hover:bg-primary/80"
          >
            <ChevronIcon direction="prev" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              go(index + 1);
            }}
            aria-label="Next media"
            className="focus-ring press absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-[var(--dur-fast)] group-hover/media:opacity-100 hover:bg-primary/80"
          >
            <ChevronIcon direction="next" />
          </button>

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
            {gallery.map((galleryItem, itemIndex) => (
              <button
                key={galleryItem.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIndex(itemIndex);
                }}
                aria-label={`Show media ${itemIndex + 1} of ${gallery.length}`}
                aria-current={itemIndex === index}
                className={`h-1.5 rounded-full transition-all duration-[var(--dur-fast)] ${
                  itemIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CategoryCard({ category }: { category: TicketType }) {
  const lightbox = useLightbox();
  const gallery = category.gallery_items;

  const dateLabel = formatDate(category.start_time);
  const startLabel = formatClockTime(category.start_time);
  const endLabel = formatClockTime(category.end_time);
  const timeLabel = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel;

  return (
    <article className="card flex flex-col overflow-hidden rounded-3xl">
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/8 via-transparent to-secondary/8">
        {gallery && gallery.length > 0 ? (
          <CategoryMedia gallery={gallery} categoryName={category.name} onExpand={lightbox.open} />
        ) : (
          <div className="tech-grid flex h-full w-full items-center justify-center">
            <span className="ghost-stroke select-none text-5xl font-extrabold uppercase">
              {category.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
        {category.access && category.access.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {category.access.map((item) => (
              <Badge key={item.id} tone="accent">
                {item.kind}
              </Badge>
            ))}
          </div>
        )}

        <h3 className="font-display text-2xl font-bold leading-snug text-primary sm:text-3xl">{category.name}</h3>
        <p className="text-sm leading-relaxed text-muted">
          {category.description || category.short_description || "More details for this category are coming soon."}
        </p>

        {(dateLabel || timeLabel || category.venue) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-primary/10 pt-4 text-sm text-foreground/70">
            {dateLabel && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon />
                {dateLabel}
              </span>
            )}
            {timeLabel && (
              <span className="flex items-center gap-1.5">
                <ClockIcon />
                {timeLabel}
              </span>
            )}
            {category.venue && (
              <span className="flex items-center gap-1.5">
                <PinIcon />
                {category.venue}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="shrink-0 font-display text-2xl font-extrabold leading-none text-primary">
            {formatCurrency(Number(category.price) || 0)}
          </p>
          <AddToCartButton ticket={category} />
        </div>
      </div>

      {gallery && lightbox.activeIndex !== null && (
        <Lightbox items={gallery} activeIndex={lightbox.activeIndex} onClose={lightbox.close} onNavigate={lightbox.navigate} />
      )}
    </article>
  );
}

export default function EventCategories({ event }: { event: Event }) {
  // Paused/sold-out/closed categories are left off the page entirely rather than shown with a
  // disabled "Unavailable" pill — nothing purchasable here anyway, so there's nothing this
  // browse-by-category section gains from listing it.
  const categories = event.ticket_types?.filter(isTicketAvailable);

  return (
    <section id="event" className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading eyebrow="Event Category" title="What's Happening" />

        {!categories || categories.length === 0 ? (
          <EmptyState
            title="Categories coming soon"
            description="Competition tracks and sessions will be listed here once they're finalised."
          />
        ) : (
          <div className="mt-14 grid gap-8 sm:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
