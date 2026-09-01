"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCart } from "./CartProvider";
import { computeBookingTotal, formatCurrency } from "@/lib/pricing";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { TicketIcon } from "@/components/event/TicketButton";

/** One line's contribution to the running total — team-kind bills once per
 * line regardless of member count, same rule as the single-ticket flow. */
function lineTotal(price: string, attendeeCount: number, kind: string | undefined): number {
  return computeBookingTotal(Number(price) || 0, attendeeCount, kind);
}

/**
 * Floating cart affordance + slide-in panel. Mounted once inside
 * EventWebsite.tsx (the same precedent as BackToTop) — a "your ticket cart"
 * control has no place on the checkout/confirmation/account routes.
 *
 * The panel is portalled to `document.body` for the same reason Lightbox
 * is: it must render as a real viewport-fixed overlay regardless of which
 * `Reveal`-wrapped (transformed-ancestor) section it's triggered from.
 */
export default function CartDrawer() {
  const { lines, count, isOpen, open, close, removeLine, addAttendeeToLine, removeAttendeeFromLine, openCheckoutNotice } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const total = lines.reduce((sum, line) => sum + lineTotal(line.ticket.price, line.attendees.length, line.ticket.kind), 0);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();

    // Captured now, not read from the ref inside the cleanup below — by the
    // time that runs the ref may already point at a different (or no)
    // node, since it's a live binding to whatever's currently rendered.
    const toggleNode = toggleRef.current;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      // Return focus to the toggle that opened it, same courtesy as MobileNav.
      toggleNode?.focus();
    };
  }, [isOpen, close]);

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => (isOpen ? close() : open())}
        aria-label={`Open your tickets, ${count} ${count === 1 ? "attendee" : "attendees"} selected`}
        className="focus-ring press fixed bottom-6 right-24 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] hover:scale-110 sm:right-[5.5rem]"
      >
        <TicketIcon className="h-5 w-5" />
        {count > 0 && (
          <span className="animate-pop-in absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60]">
            <div
              onClick={close}
              aria-hidden="true"
              className="animate-pop-in absolute inset-0 bg-primary/40 backdrop-blur-[2px]"
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Your ticket selection"
              className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl"
              style={{ animation: "route-in var(--dur-med) var(--ease-out)" }}
            >
              <div className="flex items-center justify-between border-b border-primary/10 px-6 py-5">
                <h2 className="font-display text-lg font-bold text-primary">Your Tickets</h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="focus-ring press flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/8 hover:text-primary"
                >
                  <CloseIcon />
                </button>
              </div>

              {lines.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <TicketIcon className="h-5 w-5" />
                  </div>
                  <p className="font-display text-sm font-bold text-primary">No tickets selected yet</p>
                  <p className="text-sm text-muted">Choose a ticket below to start your booking.</p>
                  <Button href="#tickets" variant="secondary" size="sm" onClick={close} className="mt-2">
                    Browse tickets
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">
                    <ul className="flex flex-col gap-4">
                      {lines.map((line) => {
                        const isTeam = line.ticket.kind === "team";
                        const max = isTeam ? (line.ticket.max_team_size ?? 3) : Infinity;
                        const atMax = line.attendees.length >= max;
                        return (
                          <li key={line.id} className="card animate-pop-in rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-display text-sm font-bold text-primary">{line.ticket.name}</p>
                                {isTeam && (
                                  <Badge tone="brand" className="mt-1.5">
                                    Team
                                  </Badge>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                aria-label={`Remove ${line.ticket.name} from your booking`}
                                className="focus-ring press shrink-0 rounded-full p-1.5 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <TrashIcon />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeAttendeeFromLine(line.id, line.attendees.length - 1)}
                                  aria-label={`Remove one attendee from ${line.ticket.name}`}
                                  className="focus-ring press flex h-7 w-7 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:border-primary/35"
                                >
                                  <MinusIcon />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-primary" aria-live="polite">
                                  {line.attendees.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => addAttendeeToLine(line.id)}
                                  disabled={atMax}
                                  aria-label={`Add one more attendee to ${line.ticket.name}`}
                                  className="focus-ring press flex h-7 w-7 items-center justify-center rounded-full border border-primary/15 text-primary transition-colors hover:border-primary/35 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <PlusIcon />
                                </button>
                                {isTeam && (
                                  <span className="text-xs text-muted">/ {max} max</span>
                                )}
                              </div>
                              <span className="font-display text-sm font-bold text-primary">
                                {formatCurrency(lineTotal(line.ticket.price, line.attendees.length, line.ticket.kind))}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="border-t border-primary/10 px-6 py-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Total</span>
                      <span className="font-display text-2xl font-extrabold text-primary">
                        <AnimatedNumber value={total} countOnView={false} format={formatCurrency} />
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        openCheckoutNotice();
                      }}
                      className="sweep press mt-4 flex w-full items-center justify-center rounded-full bg-secondary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_20px_-4px_color-mix(in_srgb,var(--secondary)_55%,transparent)] transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5"
                    >
                      Continue Booking
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
