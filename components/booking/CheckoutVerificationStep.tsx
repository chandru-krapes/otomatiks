"use client";

import { useState } from "react";
import type { AuthTokens, AuthUser, VerificationRequirement } from "@/lib/types";
import EmailVerifyStep from "./EmailVerifyStep";
import PhoneVerifyStep from "./PhoneVerifyStep";

type Method = "email" | "phone";

/**
 * Checkout's step-1 verification UI, shaped by the admin-configured
 * `VerificationPolicy.checkout_verification` (see lib/useVerificationPolicy, CheckoutPage) instead
 * of always showing the email-OTP flow. Not rendered at all for `"none"` — CheckoutPage skips
 * straight to step 2 in that case, since there's nothing to verify.
 */
export default function CheckoutVerificationStep({
  requirement,
  onVerified,
}: {
  requirement: Exclude<VerificationRequirement, "none">;
  onVerified: (auth: AuthTokens & { user: AuthUser }) => void;
}) {
  // Only meaningful for "either" (the visitor's own choice of method).
  const [chosenMethod, setChosenMethod] = useState<Method>("email");
  // Only meaningful for "both" — the email leg's result, held here until the phone leg attaches
  // to the same account and the combined result bubbles up via onVerified.
  const [emailResult, setEmailResult] = useState<(AuthTokens & { user: AuthUser }) | null>(null);

  if (requirement === "email") {
    return (
      <>
        <h3 className="font-display text-lg font-bold text-primary">Verify your email</h3>
        <EmailVerifyStep onVerified={onVerified} />
      </>
    );
  }

  if (requirement === "phone") {
    return (
      <>
        <h3 className="font-display text-lg font-bold text-primary">Verify your phone</h3>
        <PhoneVerifyStep onVerified={onVerified} />
      </>
    );
  }

  if (requirement === "either") {
    return (
      <>
        <h3 className="font-display text-lg font-bold text-primary">Verify your email or phone</h3>
        <div role="radiogroup" aria-label="Verification method" className="flex flex-wrap gap-2">
          {(["email", "phone"] as const).map((method) => {
            const selected = method === chosenMethod;
            return (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setChosenMethod(method)}
                className={`focus-ring press rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-colors duration-[var(--dur-fast)] ${
                  selected
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-primary/15 bg-white text-foreground hover:border-primary/30"
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
        {chosenMethod === "email" ? (
          <EmailVerifyStep key="email" onVerified={onVerified} />
        ) : (
          <PhoneVerifyStep key="phone" onVerified={onVerified} />
        )}
      </>
    );
  }

  // requirement === "both": email first, then phone attaches to that same account. There's no
  // shared OTP delivered over both channels at once — the backend has no SMS-sending capability
  // of its own (phone verification is Firebase's client SDK, not a code this backend can also
  // email); each channel is verified through its own existing mechanism, and the second leg is
  // what proves it's the same person by linking onto the first leg's authenticated account
  // (see lib/api.ts's verifyCheckoutPhone `attachToAccessToken` and the backend's
  // CheckoutPhoneVerifySerializer).
  if (!emailResult) {
    return (
      <>
        <h3 className="font-display text-lg font-bold text-primary">Verify your email and phone</h3>
        <p className="-mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Step 1 of 2 — Email</p>
        <EmailVerifyStep onVerified={setEmailResult} />
      </>
    );
  }

  return (
    <>
      <h3 className="font-display text-lg font-bold text-primary">Verify your email and phone</h3>
      <p className="-mt-3 text-xs font-semibold uppercase tracking-wide text-muted">Step 2 of 2 — Phone</p>
      <PhoneVerifyStep
        onVerified={onVerified}
        attachToAccessToken={emailResult.access}
        fullNameHint={emailResult.user.full_name}
      />
    </>
  );
}
