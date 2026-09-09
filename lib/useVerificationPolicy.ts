"use client";

import { useEffect, useState } from "react";
import { getVerificationPolicy } from "./api";
import type { VerificationPolicy } from "./types";

/**
 * Falls back to as if the platform's own default were "email" everywhere, not the backend's
 * actual default of "none" — used only while the policy fetch is in flight or if it fails
 * outright. Shown here because /login and /checkout used to hard-code an email-OTP step
 * unconditionally; if the policy can't be read, staying on that prior behavior is safer than
 * silently granting unverified checkout/login because of a dropped network request.
 */
const FALLBACK_POLICY: VerificationPolicy = {
  phone_required_at_signup: false,
  signup_verification: "email",
  checkout_verification: "email",
};

/**
 * Shared by /login (components/account/BookingLoginPage) and /checkout
 * (components/booking/CheckoutPage) to shape their verification UI around the admin-configured
 * `VerificationPolicy` instead of a hard-coded email-only OTP step — see lib/api.ts's
 * getVerificationPolicy and apps.accounts.models.VerificationPolicy on the backend.
 *
 * `loading` stays true only until the first fetch settles (success or failure) — callers should
 * gate rendering their verification step on it rather than flashing the fallback policy's UI and
 * then swapping to the real one a moment later.
 */
export function useVerificationPolicy(): { policy: VerificationPolicy; loading: boolean } {
  const [policy, setPolicy] = useState<VerificationPolicy>(FALLBACK_POLICY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getVerificationPolicy();
      if (cancelled) return;
      if (result) setPolicy(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { policy, loading };
}
