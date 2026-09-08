"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHECKOUT_FORM_ID } from "./CheckoutForm";
import OrderSummaryContent from "./OrderSummaryContent";
import { useCartTotals } from "./useCartTotals";
import type { AppliedPromo } from "./PromoCodeField";
import { formatCurrency } from "@/lib/pricing";
import Button from "@/components/ui/Button";

function ChevronUpIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}


export default function MobileOrderSheet({
  step,
  eventId,
  promo,
  onApplyPromo,
  onRemovePromo,
  submitting = false,
}: {
  step: 1 | 2 | 3;
  eventId: number | string;
  promo: AppliedPromo | null;
  onApplyPromo: (promo: AppliedPromo) => void;
  onRemovePromo: () => void;
  submitting?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { total } = useCartTotals(promo);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);


  if (step !== 3) return null;

  return (
    <div className="sm:hidden">
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-8px_rgba(6,106,171,0.15)] backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring press flex w-full items-center justify-between gap-3 rounded-full bg-secondary py-3 pl-5 pr-4 text-white"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/75">Total</span>
            <span className="font-display text-lg font-extrabold">{formatCurrency(total)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            Review &amp; Confirm
            <ChevronUpIcon />
          </span>
        </button>
      </div>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Order summary"
            className="fixed inset-0 z-[60] bg-primary/40 backdrop-blur-[2px]"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              className="animate-sheet-up card absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col overflow-hidden rounded-t-3xl rounded-b-none p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            >
              <span className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-primary/15" aria-hidden="true" />
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close order summary"
                className="focus-ring press absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-primary/8 hover:text-primary"
              >
                <CloseIcon />
              </button>

              <div className="flex flex-col gap-6 overflow-y-auto pb-2 pt-2">
                <OrderSummaryContent eventId={eventId} promo={promo} onApplyPromo={onApplyPromo} onRemovePromo={onRemovePromo} />

                <Button
                  type="submit"
                  form={CHECKOUT_FORM_ID}
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  loadingLabel="Please wait…"
                  className="w-full"
                >
                  Confirm and Book
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
