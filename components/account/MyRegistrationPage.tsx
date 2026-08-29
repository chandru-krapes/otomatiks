"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BookingResponse } from "@/lib/types";
import { getMyRegistration } from "@/lib/api";
import { formatCurrency } from "@/lib/pricing";
import AccountShell from "./AccountShell";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/**
 * `/my-registration?token=...` — a magic-link landing page for viewing one
 * booking without logging in, from the `token` carried by an emailed link
 * (see `getMyRegistration` for exactly which endpoint/shape this assumes,
 * flagged there as unverified against a dedicated backend contract).
 *
 * Deliberately not event-branded, same reasoning as `AccountShell` gives for
 * the booking/community account pages: this link can outlive or sit outside
 * any one event's subdomain, so it uses the platform's own chrome rather
 * than borrowing a look tied to whichever event happens to be current.
 */
export default function MyRegistrationPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "found"; booking: BookingResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    getMyRegistration(token).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "found", booking: result.data });
      } else {
        setState({
          status: "error",
          message:
            result.status === 404
              ? "We couldn't find a registration for this link. It may have expired, or already be used up."
              : result.message,
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <AccountShell eyebrow="Your registration" title="Registration link" maxWidth="max-w-xl">
        <EmptyState
          title="This link is missing its token"
          description="It may have been copied incorrectly. Check the email it came from and try the link again."
          action={
            <Button href="/" variant="primary">
              Back to home
            </Button>
          }
        />
      </AccountShell>
    );
  }

  if (state.status === "loading") {
    return (
      <AccountShell eyebrow="Your registration" title="Loading your registration…" maxWidth="max-w-xl">
        <ListSkeleton rows={2} label="Loading your registration" />
      </AccountShell>
    );
  }

  if (state.status === "error") {
    return (
      <AccountShell eyebrow="Your registration" title="Registration link" maxWidth="max-w-xl">
        <EmptyState
          title="Couldn't load this registration"
          description={state.message}
          action={
            <Button href="/" variant="primary">
              Back to home
            </Button>
          }
        />
      </AccountShell>
    );
  }

  const { booking } = state;
  const needsPayment = booking.status === "pending_payment";

  return (
    <AccountShell
      eyebrow="Your registration"
      title="Booking reference"
      description="Everything registered under this booking — no login needed, this link is yours alone."
      maxWidth="max-w-2xl"
    >
      <div className="glass-panel animate-pop-in relative flex flex-col gap-6 overflow-hidden rounded-3xl p-8 sm:p-10">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Booking reference</p>
            <p className="mt-1 font-mono text-xl font-extrabold tracking-[0.1em] text-primary">
              {booking.booking_reference}
            </p>
          </div>
          <Badge tone={needsPayment ? "warning" : "success"}>
            {needsPayment ? "Reserved — payment pending" : "Confirmed"}
          </Badge>
        </div>

        <dl className="relative flex flex-col gap-3 border-y border-primary/10 py-6 text-sm">
          {booking.competitions.map((competition) => (
            <div key={competition.ticket_type.id} className="flex items-center justify-between gap-3">
              <dt className="text-muted">{competition.ticket_type.name}</dt>
              <dd className="text-right font-semibold text-primary">
                {competition.quantity} {competition.quantity === 1 ? "attendee" : "attendees"}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 pt-1">
            <dt className="font-semibold text-primary">Total</dt>
            <dd className="font-display text-lg font-extrabold text-primary">
              {formatCurrency(Number(booking.total_amount) || 0)}
            </dd>
          </div>
        </dl>

        {booking.attendees.length > 0 && (
          <div className="relative flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Registered attendees</p>
            <ul className="flex flex-col gap-2">
              {booking.attendees.map((attendee) => (
                <li
                  key={attendee.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/10 bg-white/60 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-primary">{attendee.name}</span>
                  <span className="text-muted">{attendee.competition ?? "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {needsPayment && (
          <p className="relative rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This booking is reserved but not yet paid. Log in to the account that made this booking to complete
            payment — keep this link handy either way.
          </p>
        )}
      </div>
    </AccountShell>
  );
}
