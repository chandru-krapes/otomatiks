"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingResponse, Event } from "@/lib/types";
import { getBookingByReference } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import { recallLastBooking } from "@/lib/lastBooking";
import PaymentInvoice from "./PaymentInvoice";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { BookingPageSkeleton } from "@/components/ui/Skeleton";

/**
 * `/payment/success?reference=…` — same booking-resolution strategy as
 * `BookingConfirmationClient` (sessionStorage first, then an authenticated
 * GET), since a payment redirect lands here with only the reference to go
 * on, exactly like the post-checkout case that component already handles.
 */
export default function PaymentSuccessClient({ event }: { event: Event }) {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "found"; booking: BookingResponse }
    | { status: "not-found" }
  >({ status: "loading" });

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;

    const stashed = recallLastBooking(reference);
    if (stashed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "found", booking: stashed });
      return;
    }

    const session = loadSession("booking");
    if (!session) {
      setState({ status: "not-found" });
      return;
    }

    getBookingByReference(reference, session.accessToken).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { status: "found", booking: result.data } : { status: "not-found" });
    });

    return () => {
      cancelled = true;
    };
  }, [reference]);

  if (!reference || state.status === "not-found") {
    return (
      <div className="route-transition mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyState
          title="We couldn't find that booking"
          description={
            !reference
              ? "This page needs a booking reference to show your invoice. Check your confirmation email, or view your booking from your account."
              : `We couldn't find booking ${reference} in this browser. If you have a booking account, log in to view it.`
          }
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

  if (state.status === "loading") return <BookingPageSkeleton />;

  return <PaymentInvoice event={event} booking={state.booking} />;
}
