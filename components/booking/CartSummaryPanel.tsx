"use client";

import { useCart } from "./CartProvider";
import { accessLabel } from "@/lib/booking";
import { computeBookingTotal, formatCurrency } from "@/lib/pricing";
import Badge from "@/components/ui/Badge";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

/**
 * Right-hand column of the checkout page: a read-only summary of the whole
 * cart, not just one ticket. Reads straight from `useCart()` rather than
 * taking `lines` as a prop — it's only ever rendered inside the checkout
 * page, which is already inside `CartProvider`, so there's nothing to gain
 * from threading the same data through as a prop too.
 */
export default function CartSummaryPanel({ className = "" }: { className?: string }) {
  const { lines } = useCart();

  const total = lines.reduce(
    (sum, line) => sum + computeBookingTotal(Number(line.ticket.price) || 0, line.attendees.length, line.ticket.kind),
    0,
  );
  const attendeeCount = lines.reduce((sum, line) => sum + line.attendees.length, 0);

  return (
    <div className={`glass-panel relative flex flex-col gap-6 overflow-hidden rounded-3xl p-6 sm:p-8 lg:sticky lg:top-24 ${className}`}>
      <div
        className="tech-grid-fine pointer-events-none absolute -right-6 -top-6 h-32 w-32 opacity-50"
        aria-hidden="true"
      />

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">Order Summary</p>
        <h2 className="mt-2 font-display text-2xl font-bold leading-snug text-primary sm:text-3xl">
          {lines.length} {lines.length === 1 ? "Ticket" : "Tickets"}
        </h2>
      </div>

      <dl className="relative flex flex-col gap-5 border-y border-primary/10 py-6 text-sm">
        {lines.map((line) => {
          const isTeam = line.ticket.kind === "team";
          const lineTotal = computeBookingTotal(Number(line.ticket.price) || 0, line.attendees.length, line.ticket.kind);
          return (
            <div key={line.id} className="flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-3">
                <dt className="min-w-0">
                  <span className="block truncate font-semibold text-primary">{line.ticket.name}</span>
                  <span className="text-xs text-muted">
                    {isTeam ? `${line.attendees.length} / ${line.ticket.max_team_size ?? 3} members` : `${line.attendees.length} ticket${line.attendees.length === 1 ? "" : "s"}`}
                  </span>
                </dt>
                <dd className="shrink-0 font-semibold text-primary">{formatCurrency(lineTotal)}</dd>
              </div>
              {line.ticket.access && line.ticket.access.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {line.ticket.access.map((item) => (
                    <Badge key={item.id} tone="accent" className="px-2.5 py-0.5">
                      {accessLabel(item.kind)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </dl>

      <div className="relative flex items-center justify-between gap-3 text-sm text-muted">
        <span>Total attendees</span>
        <span className="font-semibold text-primary">{attendeeCount}</span>
      </div>

      <div className="relative flex items-end justify-between border-t border-primary/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
        <p className="font-display text-4xl font-extrabold leading-none text-primary">
          <AnimatedNumber value={total} countOnView={false} format={formatCurrency} />
        </p>
      </div>
    </div>
  );
}
