"use client";

import { useEffect, useState } from "react";
import type { BookingResponse, Event } from "@/lib/types";
import { getBookingByReference } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import { recallLastBooking } from "@/lib/lastBooking";
import BookingConfirmationView from "./BookingConfirmationView";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { BookingPageSkeleton } from "@/components/ui/Skeleton";

/**
 * Resolves a booking for `/bookings/[reference]` from whichever source
 * actually has it, in order:
 *  1. `sessionStorage` — the immediate post-checkout case (see
 *     lib/lastBooking.ts). No network call, and works for a guest
 *     checkout, which has no account to authenticate a GET with.
 *  2. `GET /api/v1/bookings/{reference}/` with the booking-account session,
 *     if one exists — a later "view my booking" visit. Confirmed against
 *     the live backend to require auth even for the account that created
 *     the booking, so this only ever succeeds for a signed-in booking
 *     account, never a guest.
 * Neither source having it (a guest, on a different browser/session than
 * the one that booked) is a real, expected outcome, not an error — handled
 * as its own state below, not folded into a generic failure message.
 */
export default function BookingConfirmationClient({ event, reference }: { event: Event; reference: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "found"; booking: BookingResponse; accessToken: string | null }
    | { status: "not-found" }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    // Deliberate exception to react-hooks/set-state-in-effect: `sessionStorage`
    // is browser-only, so this can't be known any earlier than an effect —
    // same reasoning as BookingDashboard's session load.
    const stashed = recallLastBooking(reference);
    if (stashed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "found", booking: stashed, accessToken: loadSession("booking")?.accessToken ?? null });
      return;
    }

    const session = loadSession("booking");
    if (!session) {
      setState({ status: "not-found" });
      return;
    }

    getBookingByReference(reference, session.accessToken).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "found", booking: result.data, accessToken: session.accessToken });
      } else {
        setState({ status: "not-found" });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (state.status === "loading") return <BookingPageSkeleton />;

  if (state.status === "not-found") {
    return (
      <div className="route-transition mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyState
          title="Booking not found here"
          description={`We couldn't find booking ${reference} in this browser. If you have a booking account, log in to view it — otherwise check the confirmation email from when you booked.`}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/login" variant="primary">
            Log in
          </Button>
          <Button href="/" variant="secondary">
            Back to {event.title}
          </Button>
        </div>
      </div>
    );
  }

  return <BookingConfirmationView event={event} booking={state.booking} accessToken={state.accessToken} />;
}
