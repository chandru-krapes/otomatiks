import Link from "next/link";
import type { BookingResponse, Event } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

/**
 * Receipt-style breakdown of a paid booking, shown on `/payment/success`.
 * Built from the same `BookingResponse` as `BookingConfirmationView` (see
 * that file's doc comment on why one shape feeds every "here's your
 * booking" surface), but laid out like an invoice rather than a status
 * card: billed-to details, one row per ticket type, total at the foot.
 *
 * Deliberately doesn't multiply `quantity * unit_price` per row — a
 * "team"-kind ticket bills once regardless of member count (see
 * lib/pricing.ts computeBookingTotal), and `BookingCompetitionSummary`
 * doesn't carry `kind` to tell the two cases apart here. `unit_price` is
 * shown as reference info only; `booking.total_amount` is the one figure
 * this component treats as authoritative.
 */
export default function PaymentInvoice({ event, booking }: { event: Event; booking: BookingResponse }) {
  const issuedAt = booking.created_at ? new Date(booking.created_at) : null;

  return (
    <div className="route-transition mx-auto flex min-h-screen max-w-2xl flex-col items-center gap-6 px-6 py-10">
      {/* Status mark — mirrors BookingConfirmationView's celebratory treatment. */}
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

      {/* The invoice itself. */}
      <div className="corner-marks card relative w-full overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="tech-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative flex flex-col gap-6">
          {/* Letterhead */}
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

          {/* Billed to / event */}
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

          {/* Line items */}
          <div className="rounded-2xl border border-dashed border-primary/25 bg-white/70">
            <div className="flex items-center gap-3 border-b border-dashed border-primary/20 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <span className="flex-1">Ticket</span>
              <span className="w-24 text-right">Qty</span>
              <span className="w-28 text-right">Unit price</span>
            </div>
            <dl className="flex flex-col divide-y divide-dashed divide-primary/10">
              {booking.competitions.map((competition) => (
                <div key={competition.ticket_type.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <dt className="flex-1 font-semibold text-foreground">{competition.ticket_type.name}</dt>
                  <dd className="w-24 text-right text-muted">{competition.quantity}</dd>
                  <dd className="w-28 text-right text-muted">{formatCurrency(Number(competition.unit_price) || 0)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Total */}
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
