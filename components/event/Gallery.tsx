"use client";

import { useId } from "react";
import Image from "next/image";
import type { Event, GalleryItem } from "@/lib/types";
import ArrowFlourish from "@/components/ui/ArrowFlourish";
import EmptyState from "@/components/ui/EmptyState";
import Lightbox, { useLightbox } from "@/components/ui/Lightbox";
import LazyVideoThumb from "@/components/ui/LazyVideoThumb";

function PlayIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

/** Grid tile. Videos get a real poster frame from the browser (`preload="metadata"`,
 * no autoplay/controls here) plus a play badge, rather than an invented thumbnail. */
function GalleryTile({
  item,
  index,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  onOpen: (index: number) => void;
}) {
  const isVideo = item.media_type === "video";

  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      aria-label={item.caption ? `Open ${item.caption}` : `Open gallery item ${index + 1}`}
      className="card card-interactive focus-ring group relative aspect-[4/3] w-full overflow-hidden rounded-2xl p-0 text-left"
      style={{ ["--i" as string]: Math.min(index, 8) } as React.CSSProperties}
    >
      {isVideo ? (
        // Decorative poster frame only — no audio ever plays here.
        <LazyVideoThumb
          src={item.media_url}
          className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-105"
        />
      ) : (
        <Image
          src={item.media_url}
          alt={item.caption ?? ""}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-105"
        />
      )}

      {/* Caption scrim, revealed on hover/focus. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/0 to-transparent opacity-0 transition-opacity duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:opacity-100 group-focus-visible:opacity-100" />
      {item.caption && (
        <p className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-sm font-semibold text-white opacity-0 transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          {item.caption}
        </p>
      )}

      {isVideo && (
        <span className="pointer-events-none absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-md backdrop-blur-sm transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-110">
          <PlayIcon className="h-4 w-4 translate-x-[1px]" />
        </span>
      )}
    </button>
  );
}

/**
 * Event photo/video recap — driven by `event.gallery_items`
 * (`media_type`/`media_url`/`caption`, all straight from the backend; see
 * lib/types.ts `GalleryItem`). Grid tiles open a full-screen viewer with
 * real video playback rather than just a bigger static image.
 */
export default function Gallery({ event }: { event: Event }) {
  const items = event.gallery_items;
  const headingId = useId();
  const lightbox = useLightbox();

  return (
    <section id="gallery" className="section-tint relative px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.22em] text-primary">
            <ArrowFlourish />
            Event Gallery
          </p>
          <h2 id={headingId} className="mt-3 font-boldonse text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
            Glimpse of {event.title}
          </h2>
        </div>

        {!items || items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="Photos coming soon"
              description="Highlights from the event floor will be posted here once they're in."
            />
          </div>
        ) : (
          <div
            role="list"
            aria-labelledby={headingId}
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          >
            {items.map((item, index) => (
              <div role="listitem" key={item.id}>
                <GalleryTile item={item} index={index} onOpen={lightbox.open} />
              </div>
            ))}
          </div>
        )}
      </div>

      {items && lightbox.activeIndex !== null && (
        <Lightbox
          items={items}
          activeIndex={lightbox.activeIndex}
          onClose={lightbox.close}
          onNavigate={lightbox.navigate}
        />
      )}
    </section>
  );
}
