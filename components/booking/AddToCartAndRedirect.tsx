"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TicketType } from "@/lib/types";
import { useCart } from "./CartProvider";
import { Spinner } from "@/components/ui/Button";

/**
 * `/book/{ticketId}` deep-link shortcut — adds that one ticket to the cart
 * and sends the visitor straight to checkout, so a "buy this exact ticket"
 * link (a marketing email, a direct share) still works without its own
 * dedicated single-ticket booking flow now that checkout is cart-based.
 */
export default function AddToCartAndRedirect({ ticket }: { ticket: TicketType }) {
  const { addTicket } = useCart();
  const router = useRouter();

  useEffect(() => {
    addTicket(ticket);
    router.replace("/checkout");
    // Deliberately runs once on mount — a one-shot "add and redirect", not
    // something that should re-fire if `addTicket`'s identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center" role="status">
      <Spinner className="h-6 w-6 text-secondary" />
      <p className="text-sm font-medium text-muted">Adding {ticket.name} to your booking…</p>
    </div>
  );
}
