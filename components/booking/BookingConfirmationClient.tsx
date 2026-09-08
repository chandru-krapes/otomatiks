"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingResponse, Event } from "@/lib/types";
import { getBookingByReference } from "@/lib/api";
import { loadSession } from "@/lib/auth";
import { recallLastBooking } from "@/lib/lastBooking";
import BookingConfirmationView from "./BookingConfirmationView";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { BookingPageSkeleton } from "@/components/ui/Skeleton";

export default function BookingConfirmationClient({ event, reference }: { event: Event; reference: string }) {
  const router = useRouter();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "found"; booking: BookingResponse; accessToken: string | null }
    | { status: "redirecting" }
    | { status: "not-found" }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const session = loadSession("booking");
    if (!session) {
      setState({ status: "redirecting" });
      router.replace("/login");
      return;
    }

    const stashed = recallLastBooking(reference);
    if (stashed) {
      setState({ status: "found", booking: stashed, accessToken: session.accessToken });
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
  }, [reference, router]);

  if (state.status === "loading" || state.status === "redirecting") return <BookingPageSkeleton />;

  if (state.status === "not-found") {
    return (
      <div className="route-transition mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <EmptyState
          title="Booking not found"
          description={`We couldn't find booking ${reference} on this account. Check the reference, or check the confirmation email from when you booked.`}
        />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button href="/" variant="secondary">
            Back to {event.title}
          </Button>
        </div>
      </div>
    );
  }

  return <BookingConfirmationView event={event} booking={state.booking} accessToken={state.accessToken} />;
}
