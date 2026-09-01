"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Event } from "@/lib/types";
import { useCart } from "./CartProvider";
import BookingNotOpenNotice from "./BookingNotOpenNotice";

/**
 * In-page "booking isn't open yet" dialog — what "Continue Booking" in
 * CartDrawer opens instead of navigating to `/checkout`. Same
 * overlay/escape-key/focus/body-scroll-lock pattern as CartDrawer's panel,
 * same card visual language as the rest of the site, just centered instead
 * of a side drawer. `/checkout` itself still renders the full-page version
 * (`CheckoutComingSoon`) as a fallback for direct visits.
 *
 * Mounted once alongside `CartDrawer` in EventWebsite.tsx.
 */
export default function BookingNotOpenDialog({ event }: { event: Event }) {
  const { checkoutNoticeOpen, closeCheckoutNotice } = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!checkoutNoticeOpen) return;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCheckoutNotice();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [checkoutNoticeOpen, closeCheckoutNotice]);

  if (!checkoutNoticeOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div
        onClick={closeCheckoutNotice}
        aria-hidden="true"
        className="animate-pop-in absolute inset-0 bg-primary/40 backdrop-blur-[2px]"
      />
      <div className="flex min-h-full items-center justify-center overflow-y-auto p-4 sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Booking status"
          className="card relative w-full max-w-xl overflow-hidden rounded-3xl px-6 py-12 shadow-2xl sm:px-10"
          style={{ animation: "route-in var(--dur-med) var(--ease-out)" }}
        >
          {/* Same ambient tech-grid ground as the full-page version, scoped
              to the card instead of the viewport. */}
          <div className="tech-grid pointer-events-none absolute inset-0 z-0 opacity-40" aria-hidden="true" />

          <button
            ref={closeRef}
            type="button"
            onClick={closeCheckoutNotice}
            aria-label="Close"
            className="focus-ring press absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/8 hover:text-primary"
          >
            <CloseIcon />
          </button>

          <BookingNotOpenNotice event={event} onDismiss={closeCheckoutNotice} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
