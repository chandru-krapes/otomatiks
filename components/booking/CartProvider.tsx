"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { TicketType } from "@/lib/types";
import { copyAttendeeDetails, emptyAttendee, type Attendee } from "@/lib/booking";
import { clearStoredCart, loadCart, saveCart, type CartLine } from "@/lib/cart";
import { trackFunnelStep } from "@/lib/funnel";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;

  addTicket: (ticket: TicketType) => void;
  removeLine: (lineId: string) => void;
  addAttendeeToLine: (lineId: string) => void;
  removeAttendeeFromLine: (lineId: string, index: number) => void;
  updateAttendee: (lineId: string, index: number, attendee: Attendee) => void;
  /** Copies `sourceLineId`'s first attendee onto `lineId`'s first attendee and marks `lineId` as
   * linked to it — see `CartLine.linkedFromLineId`. */
  linkAttendee: (lineId: string, sourceLineId: string) => void;
  /** Breaks a link set by `linkAttendee` — the line keeps whatever attendee data it last mirrored,
   * now editable on its own. */
  unlinkAttendee: (lineId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCart(lines);
  }, [lines, hydrated]);

  const addTicket = useCallback((ticket: TicketType) => {
    if (ticket.event != null) {
      trackFunnelStep(ticket.event, "selected_ticket", ticket.id);
      trackFunnelStep(ticket.event, "added_to_cart", ticket.id);
    }

    setLines((current) => {
      const wasEmpty = current.length === 0;
      const isTeam = ticket.kind === "team";
      let next = current;
      if (!isTeam) {
        const existingIndex = current.findIndex((line) => line.ticket.id === ticket.id);
        if (existingIndex !== -1) {
          next = current.map((line, index) =>
            index === existingIndex ? { ...line, attendees: [...line.attendees, emptyAttendee()] } : line,
          );
        }
      }
      if (next === current) {
        next = [...current, { id: uid(), ticket, attendees: [emptyAttendee()] }];
      }
      if (wasEmpty) setIsOpen(true);
      return next;
    });
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setLines((current) =>
      current
        .filter((line) => line.id !== lineId)
        // A line linked to the one just removed would otherwise be permanently locked, mirroring
        // a source that no longer exists — unlink it instead, leaving it editable with whatever
        // attendee data it last mirrored.
        .map((line) => (line.linkedFromLineId === lineId ? { ...line, linkedFromLineId: undefined } : line)),
    );
  }, []);

  const addAttendeeToLine = useCallback((lineId: string) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) return line;
        const max = line.ticket.kind === "team" ? (line.ticket.max_team_size ?? 3) : Infinity;
        if (line.attendees.length >= max) return line;
        return { ...line, attendees: [...line.attendees, emptyAttendee()] };
      }),
    );
  }, []);

  const removeAttendeeFromLine = useCallback((lineId: string, index: number) => {
    setLines((current) =>
      current
        .map((line) => (line.id === lineId ? { ...line, attendees: line.attendees.filter((_, i) => i !== index) } : line))
        .filter((line) => line.attendees.length > 0),
    );
  }, []);

  const updateAttendee = useCallback((lineId: string, index: number, attendee: Attendee) => {
    setLines((current) => {
      const next = current.map((line) =>
        line.id === lineId ? { ...line, attendees: line.attendees.map((a, i) => (i === index ? attendee : a)) } : line,
      );
      if (index !== 0) return next;
      // Mirror an edit to this line's first attendee onto every line linked to it (see
      // `linkAttendee`) — "fill ticket 3 from ticket 1" keeps ticket 3 in sync with ticket 1
      // rather than letting the two drift apart the moment either is edited again.
      return next.map((line) =>
        line.linkedFromLineId === lineId ? { ...line, attendees: [attendee, ...line.attendees.slice(1)] } : line,
      );
    });
  }, []);

  const linkAttendee = useCallback((lineId: string, sourceLineId: string) => {
    setLines((current) => {
      const source = current.find((line) => line.id === sourceLineId);
      const sourceAttendee = source?.attendees[0];
      if (!sourceAttendee) return current;
      const copied = copyAttendeeDetails(emptyAttendee(), sourceAttendee);
      return current.map((line) =>
        line.id === lineId
          ? { ...line, linkedFromLineId: sourceLineId, attendees: [copied, ...line.attendees.slice(1)] }
          : line,
      );
    });
  }, []);

  const unlinkAttendee = useCallback((lineId: string) => {
    setLines((current) => current.map((line) => (line.id === lineId ? { ...line, linkedFromLineId: undefined } : line)));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    clearStoredCart();
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.attendees.length, 0), [lines]);

  const value: CartContextValue = useMemo(
    () => ({
      lines,
      count,
      isOpen,
      open,
      close,
      addTicket,
      removeLine,
      addAttendeeToLine,
      removeAttendeeFromLine,
      updateAttendee,
      linkAttendee,
      unlinkAttendee,
      clear,
    }),
    [
      lines,
      count,
      isOpen,
      open,
      close,
      addTicket,
      removeLine,
      addAttendeeToLine,
      removeAttendeeFromLine,
      updateAttendee,
      linkAttendee,
      unlinkAttendee,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
