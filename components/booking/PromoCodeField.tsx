"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { validatePromoCode } from "@/lib/api";
import { inputClass } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

export interface AppliedPromo {
  code: string;
  discountType?: string;
  discountValue?: string;
}

function TagIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 3.5h5A2 2 0 0 1 18.5 5.5v5a2 2 0 0 1-.586 1.414l-7 7a2 2 0 0 1-2.828 0l-5-5a2 2 0 0 1 0-2.828l7-7A2 2 0 0 1 11.5 3.5Z" />
      <circle cx="14.5" cy="8.5" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export default function PromoCodeField({
  eventId,
  ticketTypeIds,
  applied,
  onApply,
  onRemove,
}: {
  eventId: number | string;
  ticketTypeIds: (number | string)[];
  applied: AppliedPromo | null;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setChecking(true);
    setError(null);
    const result = await validatePromoCode({ event_id: eventId, code: trimmed, ticket_type_ids: ticketTypeIds });
    setChecking(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (!result.data.valid) {
      setError(result.data.reason ?? "This promo code isn't valid.");
      return;
    }
    onApply({ code: trimmed, discountType: result.data.discount_type, discountValue: result.data.discount_value });
    setCode("");
  }

  if (applied) {
    const label =
      applied.discountType === "percentage" && applied.discountValue
        ? `${applied.discountValue}% off`
        : applied.discountValue
          ? `₹${applied.discountValue} off`
          : "Discount applied";
    return (
      <div className="animate-pop-in flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <TagIcon className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-bold text-emerald-800">{applied.code}</p>
            <p className="text-xs text-emerald-700">{label}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove promo code ${applied.code}`}
          className="focus-ring press flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <CloseIcon />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder="Promo code"
          aria-label="Promo code"
          aria-invalid={error ? true : undefined}
          className={`${inputClass} flex-1 font-mono uppercase tracking-wide`}
        />
        <Button type="submit" variant="secondary" size="sm" loading={checking} loadingLabel="Checking…" disabled={!code.trim()} className="shrink-0">
          Apply
        </Button>
      </div>
      {error && (
        <p role="alert" className="animate-shake text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
