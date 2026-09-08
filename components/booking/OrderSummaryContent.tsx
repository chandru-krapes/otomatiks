"use client";

import { accessLabel } from "@/lib/booking";
import { computeBookingTotal, formatCurrency } from "@/lib/pricing";
import { useCartTotals } from "./useCartTotals";
import PromoCodeField, { type AppliedPromo } from "./PromoCodeField";
import Badge from "@/components/ui/Badge";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

export default function OrderSummaryContent({
  eventId,
  promo,
  onApplyPromo,
  onRemovePromo,
}: {
  eventId: number | string;
  promo: AppliedPromo | null;
  onApplyPromo: (promo: AppliedPromo) => void;
  onRemovePromo: () => void;
}) {
  const { lines, subtotal, total, attendeeCount, ticketTypeIds } = useCartTotals(promo);

  return (
    <>
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
          // Attendees who haven't typed a name yet are skipped here rather
          // than showing a blank/placeholder row — this summary reflects
          // what's actually been entered so far, not a slot count.
          const attendeeNames = line.attendees.map((attendee) => attendee.name.trim()).filter(Boolean);
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
              {attendeeNames.length > 0 && (
                <ul className="mt-0.5 flex flex-col gap-0.5">
                  {attendeeNames.map((name, index) => (
                    <li key={index} className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-primary/30" aria-hidden="true" />
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </dl>

      <div className="relative flex items-center justify-between gap-3 text-sm text-muted">
        <span>Total attendees</span>
        <span className="font-semibold text-primary">{attendeeCount}</span>
      </div>

      <div className="relative">
        <PromoCodeField eventId={eventId} ticketTypeIds={ticketTypeIds} applied={promo} onApply={onApplyPromo} onRemove={onRemovePromo} />
      </div>

      <div className="relative flex flex-col gap-2 border-t border-primary/10 pt-6">

        {promo && (
          <>
            <div className="flex items-center justify-between text-sm text-muted">
              <span>Subtotal</span>
              <span className="font-semibold text-primary">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-emerald-700">
              <span>Discount ({promo.code})</span>
              <span className="font-semibold">-{formatCurrency(subtotal - total)}</span>
            </div>
          </>
        )}
        <div className="flex items-end justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
          <p className="font-display text-4xl font-extrabold leading-none text-primary">
            <AnimatedNumber value={total} countOnView={false} format={formatCurrency} />
          </p>
        </div>
      </div>
    </>
  );
}
