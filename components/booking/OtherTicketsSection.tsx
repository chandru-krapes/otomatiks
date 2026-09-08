"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { Event, TicketType } from "@/lib/types";
import { accessLabel, isTicketAvailable } from "@/lib/booking";
import { formatCurrency } from "@/lib/pricing";
import { useCart } from "./CartProvider";
import AddToCartButton from "./AddToCartButton";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LazyVideoThumb from "@/components/ui/LazyVideoThumb";

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function TicketDetailDialog({ ticket, onClose }: { ticket: TicketType; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const image = ticket.gallery_items?.[0];
  const isTeam = ticket.kind === "team";

  useEffect(() => {
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ticket.name}
      className="fixed inset-0 z-[60] overflow-y-auto bg-primary/40 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
        <div className="card animate-pop-in relative w-full max-w-lg overflow-hidden rounded-3xl">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring press absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-muted backdrop-blur-sm transition-colors hover:bg-white hover:text-primary"
          >
            <CloseIcon />
          </button>

          {image && (
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/8 via-transparent to-secondary/8">
              {image.media_type === "video" ? (
                <LazyVideoThumb src={image.media_url} className="h-full w-full object-cover" />
              ) : (
                <Image src={image.media_url} alt={image.caption ?? ticket.name} fill sizes="(min-width: 640px) 32rem, 100vw" className="object-cover" />
              )}
            </div>
          )}

          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{isTeam ? "Team Ticket" : "Individual Ticket"}</Badge>
              {ticket.access?.map((item) => (
                <Badge key={item.id} tone="accent">
                  {accessLabel(item.kind)}
                </Badge>
              ))}
            </div>

            <h3 className="font-display text-2xl font-bold leading-snug text-primary">{ticket.name}</h3>

            <p className="leading-relaxed text-muted">
              {ticket.description || ticket.short_description || "More details for this ticket are coming soon."}
            </p>

            <div className="flex items-end justify-between border-t border-primary/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{isTeam ? "Price per team" : "Price"}</p>
              <p className="font-display text-2xl font-extrabold text-primary">{formatCurrency(Number(ticket.price) || 0)}</p>
            </div>

            <AddToCartButton ticket={ticket} label="Add to registration" className="w-full" />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function OtherTicketCard({ ticket }: { ticket: TicketType }) {
  const image = ticket.gallery_items?.[0];
  const isTeam = ticket.kind === "team";
  const available = isTicketAvailable(ticket);
  const detail = useDialog();

  return (
    <div className="card flex flex-col overflow-hidden rounded-2xl">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary/8 via-transparent to-secondary/8">
        {image ? (
          image.media_type === "video" ? (
            <LazyVideoThumb src={image.media_url} className="h-full w-full object-cover" />
          ) : (
            <Image src={image.media_url} alt={image.caption ?? ticket.name} fill sizes="(min-width: 1024px) 20rem, 100vw" className="object-cover" />
          )
        ) : (
          <div className="tech-grid-fine flex h-full w-full items-center justify-center text-primary/20">
            <TicketPlaceholderIcon />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <Badge tone={isTeam ? "accent" : "brand"} className="w-fit">
          {isTeam ? "Team Ticket" : "Individual Ticket"}
        </Badge>
        <p className="font-display text-base font-bold leading-snug text-primary">{ticket.name}</p>
        {ticket.short_description && <p className="line-clamp-2 text-xs leading-relaxed text-muted">{ticket.short_description}</p>}

        <p className="mt-auto pt-3 font-display text-xl font-extrabold text-primary">
          {formatCurrency(Number(ticket.price) || 0)}
          {isTeam && <span className="ml-1 text-xs font-semibold text-muted">/ team</span>}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={detail.open} className="flex-1">
            View details
          </Button>
          <AddToCartButton ticket={ticket} label="Add" size="sm" className="flex-1" />
        </div>
        {!available && <p className="text-xs font-semibold text-muted">Currently unavailable</p>}
      </div>

      {detail.isOpen && <TicketDetailDialog ticket={ticket} onClose={detail.close} />}
    </div>
  );
}

function TicketPlaceholderIcon() {
  return (
    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 1 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a2 2 0 1 0 0-6Z" />
      <path d="M10 6v12" strokeDasharray="2.2 2.4" />
    </svg>
  );
}

/** Tiny local open/close hook — the dialog only ever needs one boolean per
 * card, not worth a shared abstraction like `useLightbox`. */
function useDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}

/**
 * "Other tickets" — every ticket type on this event that isn't already in
 * the cart, shown below the account/attendee form so a buyer can round out
 * their booking without leaving checkout and losing what they've already
 * filled in. Ticket types already in `lines` are excluded; once one of
 * these is added, `CheckoutForm`'s per-line attendee section picks it up
 * automatically (both read the same `useCart()` state).
 */
export default function OtherTicketsSection({ event }: { event: Event }) {
  const { lines } = useCart();
  const inCart = new Set(lines.map((line) => String(line.ticket.id)));
  const others = (event.ticket_types ?? []).filter((ticket) => !inCart.has(String(ticket.id)));

  if (others.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-lg font-bold text-primary sm:text-xl">More tickets for {event.title}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((ticket) => (
          <OtherTicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
