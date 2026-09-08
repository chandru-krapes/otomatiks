"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TicketType } from "@/lib/types";
import { useCart } from "./CartProvider";
import { Spinner } from "@/components/ui/Button";

export default function AddToCartAndRedirect({ ticket }: { ticket: TicketType }) {
  const { addTicket } = useCart();
  const router = useRouter();

  useEffect(() => {
    addTicket(ticket);
    router.replace("/checkout");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center" role="status">
      <Spinner className="h-6 w-6 text-secondary" />
      <p className="text-sm font-medium text-muted">Adding {ticket.name} to your booking…</p>
    </div>
  );
}
