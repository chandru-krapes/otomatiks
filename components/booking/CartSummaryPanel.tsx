"use client";

import { CHECKOUT_FORM_ID } from "./CheckoutForm";
import OrderSummaryContent from "./OrderSummaryContent";
import type { AppliedPromo } from "./PromoCodeField";
import Button from "@/components/ui/Button";

export default function CartSummaryPanel({
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
  return (
    <div className="card fixed right-[max(2rem,calc((100vw-80rem)/2+2rem))] top-24 z-30 hidden max-h-[calc(100vh-7rem)] w-[22rem] flex-col gap-6 overflow-hidden overflow-y-auto rounded-3xl p-8 sm:flex lg:right-[max(3rem,calc((100vw-80rem)/2+3rem))]">
      <div
        className="tech-grid-fine pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
      />

      <OrderSummaryContent eventId={eventId} promo={promo} onApplyPromo={onApplyPromo} onRemovePromo={onRemovePromo} />

      <Button
        type="submit"
        form={step === 3 ? CHECKOUT_FORM_ID : undefined}
        disabled={step !== 3}
        variant="primary"
        size="lg"
        loading={submitting}
        loadingLabel="Please wait…"
        className="relative w-full"
      >
        {step === 3 ? "Confirm and Book" : "Complete the steps"}
      </Button>
    </div>
  );
}
