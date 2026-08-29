"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Event } from "@/lib/types";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

/**
 * `/payment/failure?reference=…` — the payment attempt itself failed
 * (declined, cancelled, timed out). The booking behind `reference` is still
 * sitting `pending_payment` on the backend, not lost, so this points back at
 * `/bookings/[reference]` (BookingConfirmationView's "Pay Now" flow) rather
 * than restarting checkout from scratch.
 */
export default function PaymentFailureClient({ event }: { event: Event }) {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");

  return (
    <div className="route-transition mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div className="glass-panel relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-3xl p-6 sm:p-10">
        <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="animate-pop-in relative flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <CrossIcon />
        </div>

        <Badge tone="danger" className="relative">
          Payment failed
        </Badge>

        <h1 className="relative font-boldonse text-2xl font-extrabold uppercase leading-tight text-primary sm:text-3xl">
          {event.title}
        </h1>

        <p className="relative max-w-sm text-sm leading-relaxed text-muted">
          Your payment didn&rsquo;t go through, so nothing has been charged. Your booking is still reserved — you can
          try paying again whenever you&rsquo;re ready.
        </p>

        {reference && (
          <div className="relative w-full rounded-2xl border border-dashed border-primary/25 bg-white/70 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Booking reference</p>
            <p className="mt-1.5 font-mono text-xl font-extrabold tracking-[0.12em] text-primary">{reference}</p>
          </div>
        )}

        <Alert tone="warning" className="relative w-full text-left">
          If you were charged despite seeing this page, keep your reference handy and contact support — we&rsquo;ll
          sort it out.
        </Alert>

        <div className="relative flex w-full flex-col gap-3 sm:flex-row">
          {reference ? (
            <Button href={`/bookings/${reference}`} variant="primary" className="flex-1">
              Try payment again
            </Button>
          ) : (
            <Button href="/login" variant="primary" className="flex-1">
              Find my booking
            </Button>
          )}
          <Button href="/" variant="secondary" className="flex-1">
            Back to {event.title}
          </Button>
        </div>

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

function CrossIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}
