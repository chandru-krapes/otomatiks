"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { GalleryItem } from "@/lib/types";

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={direction === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}

/**
 * Full-screen media viewer, shared by every `GalleryItem[]` in the app
 * (the whole-event gallery, and any per-ticket-type gallery). Real video
 * playback for video items, keyboard/backdrop dismissal, body-scroll lock,
 * and focus returned to whichever element opened it.
 *
 * Rendered through a portal straight onto `document.body` rather than in
 * place. Every call site sits inside a `Reveal`-wrapped section, and
 * `Reveal`'s entrance animation leaves a `transform` on that ancestor even
 * after it finishes (`animation-fill-mode: forwards`) — per the CSS spec, a
 * transformed ancestor becomes the containing block for any `position:
 * fixed` descendant, so without the portal this dialog would render pinned
 * to that section's box instead of the viewport: clipped, offset from the
 * top, and impossible to see in full or scroll to. The portal sidesteps the
 * whole class of ancestor (transform, filter, contain, …) that can do this.
 *
 * Pair with `useLightbox` below rather than managing `activeIndex` by hand
 * — it also captures/restores focus for you.
 */
export default function Lightbox({
  items,
  activeIndex,
  onClose,
  onNavigate,
}: {
  items: GalleryItem[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const active = items[activeIndex];

  useEffect(() => {
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNavigate((activeIndex + 1) % items.length);
      if (event.key === "ArrowLeft") onNavigate((activeIndex - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-arm on index changes; onClose/onNavigate are stable per render cycle.
  }, [activeIndex, items.length]);

  if (!active) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={active.caption ?? "Media viewer"}
      ref={dialogRef}
      // Just the scrollable viewport + backdrop here — no centering on this
      // element. Flex/grid centering on the same element as `overflow-y:
      // auto` is a known trap: once content overflows, the auto margins used
      // to centre it eat into the scrollable range and the top of the
      // content becomes permanently unreachable, no matter how far you
      // scroll. Centering instead lives on the `min-h-full` wrapper below,
      // which scrolls as ordinary block content.
      className="fixed inset-0 z-[60] overflow-y-auto bg-primary/95 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close media viewer"
        className="focus-ring press fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-primary/60 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10"
      >
        <CloseIcon />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => onNavigate((activeIndex - 1 + items.length) % items.length)}
            aria-label="Previous item"
            className="focus-ring press fixed left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-primary/60 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10 sm:left-6"
          >
            <ChevronIcon direction="prev" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate((activeIndex + 1) % items.length)}
            aria-label="Next item"
            className="focus-ring press fixed right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-primary/60 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10 sm:right-6"
          >
            <ChevronIcon direction="next" />
          </button>
        </>
      )}

      {/* `min-h-full` matches the scroll container's height when the media
          fits, so it still centres normally in the common case; once the
          media is taller than the viewport this wrapper simply grows past
          it and the outer `overflow-y-auto` scrolls through all of it. */}
      <div
        className="flex min-h-full items-center justify-center p-4 sm:p-8"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="animate-pop-in flex max-w-4xl flex-col items-center gap-4" key={activeIndex}>
          {active.media_type === "video" ? (
            // No caption track supplied by the backend for these clips.
            <video
              key={active.id}
              src={active.media_url}
              controls
              autoPlay
              playsInline
              className="max-h-[75vh] w-full rounded-xl bg-black shadow-2xl"
            />
          ) : (
            // Opened on demand — the user is looking at this immediately, so
            // it loads eagerly rather than behind next/image's default
            // viewport-lazy behavior.
            <Image
              src={active.media_url}
              alt={active.caption ?? ""}
              loading="eager"
              width={1200}
              height={900}
              sizes="100vw"
              // True dimensions are unknown ahead of time (arbitrary remote
              // upload) — width/height above only seed next/image's aspect
              // ratio math; these overrides let it render at its real
              // proportions instead of stretching to 1200x900.
              style={{ width: "auto", height: "auto" }}
              className="max-h-[75vh] w-auto rounded-xl object-contain shadow-2xl"
            />
          )}
          {active.caption && <p className="text-center text-sm font-medium text-white/85">{active.caption}</p>}
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
            {activeIndex + 1} / {items.length}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Open/close state for a `Lightbox`, including capturing and restoring
 * keyboard focus around the triggering element — the one part every caller
 * would otherwise have to reimplement identically.
 */
export function useLightbox() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  function open(index: number) {
    lastTriggerRef.current = document.activeElement as HTMLElement | null;
    setActiveIndex(index);
  }

  function close() {
    setActiveIndex(null);
    lastTriggerRef.current?.focus();
  }

  return { activeIndex, open, close, navigate: setActiveIndex };
}
