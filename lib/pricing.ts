/**
 * Booking-flow pricing.
 *
 * One ticket per attendee, linearly priced: totalPrice = basePrice ×
 * attendeeCount. No division by quantity — the attendee list is the
 * source of truth for how many tickets are being bought (see
 * components/booking/BookingPage.tsx), so the price simply scales with it.
 */
export function computeTotalPrice(basePrice: number, quantity: number): number {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  return basePrice * qty;
}

/**
 * Booking total for any ticket kind (`TicketType.kind`, see lib/types.ts). A "team" ticket is
 * one booking for the whole team — `basePrice` is charged once no matter how many of the
 * (1-3) team members are filled in, so it is deliberately NOT multiplied by member count here
 * (that's the one thing that must never happen per the team-ticket rules). Any other kind
 * (including the default "individual") keeps the existing one-ticket-per-attendee behavior via
 * computeTotalPrice. The backend (apps/registration/services.create_booking) remains the
 * authoritative source for the final amount either way — this is a client-side preview only.
 */
export function computeBookingTotal(basePrice: number, quantity: number, kind?: string | null): number {
  if (kind === "team") return basePrice;
  return computeTotalPrice(basePrice, quantity);
}

/**
 * Client-side preview of a validated promo code's effect on a subtotal —
 * `discount_type`/`discount_value` straight from `POST /promo-codes/validate/`
 * (see lib/api.ts `validatePromoCode`). The backend remains the authoritative
 * source for the actual charged amount (it redeems the same code again,
 * server-side, inside `createBooking`); this is only for showing the buyer
 * what to expect before they submit. Never goes negative.
 */
export function applyDiscount(subtotal: number, discount: { discount_type?: string; discount_value?: string } | null): number {
  if (!discount) return subtotal;
  const value = Number(discount.discount_value) || 0;
  const reduced = discount.discount_type === "percentage" ? subtotal - (subtotal * value) / 100 : subtotal - value;
  return Math.max(0, reduced);
}

export function formatCurrency(value: number): string {
  if (Number.isNaN(value)) return String(value);
  if (value === 0) return "Free";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    value,
  );
}
