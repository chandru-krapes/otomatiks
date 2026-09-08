"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { VerificationPolicy, VerificationRequirement } from "@/lib/adminTypes";
import { getVerificationPolicy, updateVerificationPolicy } from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { labelClass } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";

const REQUIREMENT_OPTIONS: { value: VerificationRequirement; label: string }[] = [
  { value: "none", label: "Not required" },
  { value: "email", label: "Email verified" },
  { value: "phone", label: "Phone verified" },
  { value: "either", label: "Either email or phone verified" },
  { value: "both", label: "Both email and phone verified" },
];

const DEFAULT_POLICY: VerificationPolicy = {
  phone_required_at_signup: false,
  signup_verification: "none",
  checkout_verification: "none",
};

/**
 * The one platform-wide control over what self-signup/login/checkout requires (see the
 * backend's `VerificationPolicy.get_solo()`) — every existing flow defaults to "not required"
 * and keeps working exactly as before until an admin actively opts into something stronger
 * here. Same singleton shape as "Founder message" (one shared record, `GET`/`PATCH` with no id
 * in the URL), and same reason it's platform-wide rather than per-event: signup/login aren't
 * scoped to one event's staff to begin with.
 */
export default function VerificationPolicySection({ withAuth }: { withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [policy, setPolicy] = useState<VerificationPolicy>(DEFAULT_POLICY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      const result = await withAuth((token) => getVerificationPolicy(token));
      if (cancelled) return;
      if (result.ok) setPolicy(result.data);
      else setLoadError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; withAuth is stable per session.
  }, []);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await withAuth((token) => updateVerificationPolicy(token, policy));
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPolicy(result.data);
    setSaved(true);
  }

  // Both signup and checkout can independently ask for "phone" or "both" — but a self-signup
  // account blocked from logging in by a phone requirement currently has no unauthenticated way
  // to complete that verification (PhoneVerifyView requires being logged in already). Flagging
  // this in the UI itself, not just a code comment, so an admin doesn't turn this on and only
  // find out it locks people out from a support ticket.
  const signupPhoneGap = policy.signup_verification === "phone" || policy.signup_verification === "both";

  if (loading) return <ListSkeleton rows={4} label="Loading verification policy" />;
  if (loadError) return <Alert tone="error">{loadError}</Alert>;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Verification policy"
        description="Platform-wide rules for what a self-signup, login, or checkout account must verify — applies to every event, not just one."
      />

      <form onSubmit={handleSubmit} className="card flex max-w-2xl flex-col gap-6 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <input
            id="phone-required-at-signup"
            type="checkbox"
            checked={policy.phone_required_at_signup}
            onChange={(event) => setPolicy((current) => ({ ...current, phone_required_at_signup: event.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
          />
          <label htmlFor="phone-required-at-signup" className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary">Require a phone number at signup</span>
            <span className="text-xs text-muted">
              Makes the phone field mandatory on the self-signup form (parent/student/training institute). Off by
              default — signup keeps accepting a blank phone number.
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-2">
          <SelectField
            label="Verification required before login"
            hint="An additional gate on top of the existing rules (e.g. training institutes must already verify email to log in) — this can only add to those, never relax them."
            value={policy.signup_verification}
            onChange={(event) => setPolicy((current) => ({ ...current, signup_verification: event.target.value as VerificationRequirement }))}
          >
            {REQUIREMENT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
          {signupPhoneGap && (
            <Alert tone="warning">
              <span className={labelClass}>Known gap</span>
              <p className="mt-1 text-sm normal-case tracking-normal text-amber-800">
                Phone verification has no unauthenticated path yet — an account blocked from login by this setting
                currently has no way to complete phone verification and log in (see{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">PhoneVerifyView</code>, which requires
                already being signed in). Don&rsquo;t turn this on until that&rsquo;s closed on the backend, or people
                will get locked out with no way back in.
              </p>
            </Alert>
          )}
        </div>

        <SelectField
          label="Verification required before checkout"
          hint="Checked right before a booking/registration is created — a buyer who hasn't met this yet is prompted to verify mid-checkout instead of failing silently at the final step."
          value={policy.checkout_verification}
          onChange={(event) => setPolicy((current) => ({ ...current, checkout_verification: event.target.value as VerificationRequirement }))}
        >
          {REQUIREMENT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </SelectField>

        {error && <Alert tone="error" emphasize>{error}</Alert>}
        {saved && !error && <Alert tone="success">Verification policy saved — applies to every event immediately.</Alert>}

        <Button type="submit" variant="primary" loading={saving} className="w-fit">
          Save policy
        </Button>
      </form>
    </div>
  );
}
