"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BookingResponse, Event } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Where a paid-up buyer lands once this page's own countdown runs out for the event website
const REDIRECT_URL = "https://shop.qbee.org.in";
const REDIRECT_SECONDS = 10;

export default function PaymentInvoice({ event, booking }: { event: Event; booking: BookingResponse }) {
  const issuedAt = booking.created_at ? new Date(booking.created_at) : null;

  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (cancelled) return;
    if (secondsLeft <= 0) {
      window.location.href = REDIRECT_URL;
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, cancelled]);

  return (
    <div className="route-transition mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 overflow-x-hidden px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="animate-pop-in flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckIcon />
        </div>
        <Badge tone="success">Payment successful</Badge>
        <h1 className="font-boldonse text-2xl font-extrabold uppercase leading-tight text-primary sm:text-3xl">
          {event.title}
        </h1>
        <p className="max-w-sm text-sm text-muted">
          Your payment went through and your booking is confirmed. Here&rsquo;s your invoice.
        </p>
      </div>

      <div className="corner-marks card relative w-full overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="tech-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Invoice</p>
              <p className="mt-1.5 font-mono text-lg font-extrabold tracking-[0.1em] text-primary">
                {booking.booking_reference}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Date</p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {issuedAt
                  ? issuedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Billed to</p>
              <p className="mt-1.5 text-sm font-bold text-foreground">{booking.primary_name || "—"}</p>
              {booking.primary_email && <p className="text-sm text-muted">{booking.primary_email}</p>}
              {booking.primary_phone && <p className="text-sm text-muted">{booking.primary_phone}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Event</p>
              <p className="mt-1.5 text-sm font-bold text-foreground">{event.title}</p>
              {event.venue_name && <p className="text-sm text-muted">{event.venue_name}</p>}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-dashed border-primary/25 bg-white/70">
            <div className="flex items-center gap-2 border-b border-dashed border-primary/20 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted sm:gap-3 sm:px-4">
              <span className="min-w-0 flex-1">Ticket</span>
              <span className="w-14 shrink-0 text-right sm:w-24">Qty</span>
              <span className="w-16 shrink-0 text-right sm:w-28">Unit price</span>
            </div>
            <dl className="flex flex-col divide-y divide-dashed divide-primary/10">
              {booking.competitions.map((competition) => (
                <div key={competition.ticket_type.id} className="flex items-center gap-2 px-3 py-3 text-sm sm:gap-3 sm:px-4">
                  <dt className="min-w-0 flex-1 truncate font-semibold text-foreground">{competition.ticket_type.name}</dt>
                  <dd className="w-14 shrink-0 text-right text-muted sm:w-24">{competition.quantity}</dd>
                  <dd className="w-16 shrink-0 text-right text-muted sm:w-28">{formatCurrency(Number(competition.unit_price) || 0)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {booking.attendees.length > 0 && (
            <details className="group/attendees rounded-2xl border border-dashed border-primary/25 bg-white/70">
              <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  Attendees
                  <span className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-bold text-primary">
                    {booking.attendees.length}
                  </span>
                </span>
                <ChevronIcon className="h-4 w-4 shrink-0 text-muted transition-transform duration-[var(--dur-fast)] group-open/attendees:rotate-180" />
              </summary>
              <dl className="flex flex-col divide-y divide-dashed divide-primary/10 border-t border-dashed border-primary/20">
                {booking.attendees.map((attendee) => (
                  <div key={attendee.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-3 text-sm">
                    <dt className="font-semibold text-foreground">{attendee.name}</dt>
                    <dd className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {attendee.competition && <span>{attendee.competition}</span>}
                      {attendee.grade && <span>&middot; Grade {attendee.grade}</span>}
                      {attendee.school && <span>&middot; {attendee.school}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-hairline pt-5">
            <span className="text-sm font-semibold uppercase tracking-[0.1em] text-muted">
              Total paid &middot; {booking.currency}
            </span>
            <span className="font-display text-2xl font-extrabold text-primary">
              {formatCurrency(Number(booking.total_amount) || 0)}
            </span>
          </div>
        </div>
      </div>

      {!cancelled && (
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <p className="text-xs text-muted">
            This page will redirect in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}
            {" — "}
            <button
              type="button"
              onClick={() => setCancelled(true)}
              className="focus-ring rounded-md font-semibold text-secondary underline-offset-2 transition-colors hover:text-primary hover:underline"
            >
              stay on this page
            </button>
          </p>
          <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-primary/10" role="presentation">
            <div
              className="h-full rounded-full bg-secondary transition-[width] duration-1000 ease-linear"
              style={{ width: `${(secondsLeft / REDIRECT_SECONDS) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button href={`/bookings/${booking.booking_reference}`} variant="primary" className="flex-1">
          View booking
        </Button>
        <Button href="/" variant="secondary" className="flex-1">
          Back to {event.title}
        </Button>
      </div>

      <Link
        href="/"
        className="focus-ring group inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <span aria-hidden="true" className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-1">
          &larr;
        </span>
        Back to {event.title}
      </Link>
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

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
