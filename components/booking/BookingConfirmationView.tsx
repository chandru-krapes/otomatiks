"use client";

import { useState } from "react";
import Link from "next/link";
import type { BookingResponse, Event } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing";
import { createPaymentOrder } from "@/lib/api";
import { extractRegistrationId } from "@/lib/booking";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

/**
 * Shown once a booking exists — either straight after checkout, or from a
 * later visit to `/bookings/[reference]`. Built entirely from one
 * `BookingResponse`, so both call sites share this one component (see the
 * backend→frontend handoff doc: "reuse one component for both").
 *
 * `booking.status` is `"confirmed"` for free bookings and `"pending_payment"`
 * otherwise, so the two states get visibly different treatments rather than
 * both reading as "done": a reserved booking still has something
 * outstanding, and saying so plainly is more useful than a celebration.
 */
export default function BookingConfirmationView({
  event,
  booking,
  accountNote,
  /** Present only when the browser actually has an authenticated session for
   * the account that made this booking — payment requires one (see
   * lib/api.ts `createPaymentOrder`); a guest checkout has none. */
  accessToken,
}: {
  event: Event;
  booking: BookingResponse;
  accountNote?: string | null;
  accessToken?: string | null;
}) {
  const needsPayment = booking.status === "pending_payment";
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySession, setPaySession] = useState<{ apiDomain: string; sessionId: string } | null>(null);

  const registrationId = extractRegistrationId(booking.booking_reference);

  async function handlePayNow() {
    if (!accessToken || registrationId == null) return;
    setPayError(null);
    setPaying(true);

    const result = await createPaymentOrder(registrationId, accessToken);
    setPaying(false);

    if (!result.ok) {
      setPayError(result.message);
      return;
    }
    setPaySession({ apiDomain: result.data.api_domain, sessionId: result.data.payments_session_id });
  }

  return (
    <div className="route-transition mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="glass-panel relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        {/* Status mark. Sized and placed to be the first thing read. */}
        <div
          className={`animate-pop-in relative flex h-16 w-16 items-center justify-center rounded-full ${
            needsPayment ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {needsPayment ? <ClockIcon /> : <CheckIcon />}
        </div>

        <Badge tone={needsPayment ? "warning" : "success"} className="relative">
          {needsPayment ? "Booking reserved" : "Booking confirmed"}
        </Badge>

        <h1 className="relative font-boldonse text-2xl font-extrabold uppercase leading-tight text-primary sm:text-3xl">
          {event.title}
        </h1>

        <div className="relative w-full rounded-2xl border border-dashed border-primary/25 bg-white/70 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Booking reference</p>
          <p className="mt-1.5 font-mono text-2xl font-extrabold tracking-[0.12em] text-primary">
            {booking.booking_reference}
          </p>
        </div>

        {/* One row per ticket type, not one flat "Ticket" line — a booking
            can now span several. */}
        <dl className="relative mt-2 flex w-full flex-col gap-3 border-y border-primary/10 py-6 text-sm">
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

        {needsPayment && (
          <div className="relative flex w-full flex-col gap-3">
            {!accessToken ? (
              <Alert tone="warning" className="w-full text-left">
                This booking is reserved but not yet paid. Log in to the account that made this booking to complete
                payment — keep your reference handy either way.
              </Alert>
            ) : paySession ? (
              <Alert tone="info" className="w-full text-left">
                Payment session created ({paySession.sessionId}) — the checkout hand-off into Zoho&rsquo;s payment
                page isn&rsquo;t wired up in this UI yet. Keep your reference handy; you can retry payment from this
                page once it is.
              </Alert>
            ) : (
              <>
                <Alert tone="warning" className="w-full text-left">
                  This booking is reserved but not yet paid.
                </Alert>
                <Button
                  type="button"
                  variant="primary"
                  loading={paying}
                  loadingLabel="Starting payment…"
                  onClick={handlePayNow}
                  disabled={registrationId == null}
                  className="w-full"
                >
                  Pay Now
                </Button>
                {payError && (
                  <Alert tone="error" emphasize>
                    {payError}
                  </Alert>
                )}
              </>
            )}
          </div>
        )}

        {accountNote && (
          <Alert tone="info" className="relative w-full text-left">
            {accountNote}
          </Alert>
        )}

        <Link
          href="/"
          className="focus-ring group relative mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
        >
          <span aria-hidden="true" className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-1">
            &larr;
          </span>
          Back to {event.title}
        </Link>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
