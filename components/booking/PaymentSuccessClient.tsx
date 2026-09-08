"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
 * `BookingConfirmationClient` (see its doc comment): a logged-in session is
 * required first, full stop, redirecting straight to `/login` without it;
 * only once that's confirmed does this check sessionStorage (the same-tab
 * post-payment case) before falling back to an authenticated GET. Checkout
 * always ends with a session before a booking can even be created, so this
 * redirect is never a real obstacle on the normal payment-confirmation path
 * — only for a genuinely unauthenticated visit to this URL.
 */
export default function PaymentSuccessClient({ event }: { event: Event }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "found"; booking: BookingResponse }
    | { status: "redirecting" }
    | { status: "not-found" }
  >({ status: "loading" });

  useEffect(() => {
    if (!reference) return;

    let cancelled = false;

    // Deliberate exception to react-hooks/set-state-in-effect: both
    // `localStorage` and `sessionStorage` are browser-only — see
    // BookingConfirmationClient's identical reasoning.
    const session = loadSession("booking");
    if (!session) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ status: "redirecting" });
      router.replace("/login");
      return;
    }

    const stashed = recallLastBooking(reference);
    if (stashed) {
      setState({ status: "found", booking: stashed });
      return;
    }

    getBookingByReference(reference, session.accessToken).then((result) => {
      if (cancelled) return;
      setState(result.ok ? { status: "found", booking: result.data } : { status: "not-found" });
    });

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  if (!reference || state.status === "not-found") {
    return (
      <div className="route-transition mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyState
          title="We couldn't find that booking"
          description={
            !reference
              ? "This page needs a booking reference to show your invoice. Check your confirmation email, or view your booking from your account."
              : `We couldn't find booking ${reference} on this account.`
          }
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/" variant="secondary">
            Back to {event.title}
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === "loading" || state.status === "redirecting") return <BookingPageSkeleton />;

  return <PaymentInvoice event={event} booking={state.booking} />;
}
