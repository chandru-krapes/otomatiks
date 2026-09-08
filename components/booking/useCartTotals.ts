"use client";

import { useCart } from "./CartProvider";
import { applyDiscount, computeBookingTotal } from "@/lib/pricing";
import type { AppliedPromo } from "./PromoCodeField";

export function useCartTotals(promo: AppliedPromo | null) {
  const { lines } = useCart();

  const subtotal = lines.reduce(
    (sum, line) => sum + computeBookingTotal(Number(line.ticket.price) || 0, line.attendees.length, line.ticket.kind),
    0,
  );
  const total = applyDiscount(subtotal, promo ? { discount_type: promo.discountType, discount_value: promo.discountValue } : null);
  const attendeeCount = lines.reduce((sum, line) => sum + line.attendees.length, 0);
  const ticketTypeIds = Array.from(new Set(lines.map((line) => line.ticket.id)));

  return { lines, subtotal, total, attendeeCount, ticketTypeIds };
}
