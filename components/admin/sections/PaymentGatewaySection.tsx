"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { PaymentGateway, PaymentGatewayConfig, PaymentGatewayConfigPayload } from "@/lib/adminTypes";
import { getPaymentGatewayConfig, updatePaymentGatewayConfig } from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import { TextField, PasswordField, labelClass } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";

const GATEWAYS: { id: PaymentGateway; name: string; description: string }[] = [
  { id: "zohopay", name: "Zoho Pay", description: "Cards, UPI, and net banking via Zoho's checkout." },
  { id: "razorpay", name: "Razorpay", description: "Cards, UPI, wallets, and net banking via Razorpay Checkout." },
];

/**
 * The one platform-wide control over checkout: which gateway is live, which instruments it
 * offers a buyer, and each gateway's own credentials (see the backend's
 * `PaymentGatewayConfig.get_solo()`) — not scoped to any event, same singleton shape as
 * Founder message/Verification policy. Split into three independently-saved cards (gateway +
 * instruments, Zoho Pay credentials, Razorpay credentials) rather than one form, so saving a
 * newly-rotated Razorpay secret can never accidentally touch Zoho Pay's, or vice versa.
 */
export default function PaymentGatewaySection({ withAuth }: { withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [config, setConfig] = useState<PaymentGatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function reload() {
    const result = await withAuth((token) => getPaymentGatewayConfig(token));
    if (result.ok) {
      setConfig(result.data);
      setLoadError(null);
    } else {
      setLoadError(result.message);
    }
    return result;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await reload();
      if (cancelled) return;
      setLoading(false);
      void result;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; withAuth is stable per session.
  }, []);

  if (loading) return <ListSkeleton rows={5} label="Loading payment gateway settings" />;
  if (loadError || !config) return <Alert tone="error">{loadError ?? "Couldn't load payment gateway settings."}</Alert>;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Payment gateway"
        description="Which gateway checkout uses platform-wide, which payment instruments it offers, and each gateway's credentials — applies to every event, not just one."
      />

      <Alert tone="warning">
        Zoho Pay and Razorpay&rsquo;s real checkout call isn&rsquo;t wired up on the backend yet — it still raises
        until that&rsquo;s implemented and mock mode is turned off there. Credentials saved here are stored and
        ready for when it is; nothing here starts taking real payments by itself.
      </Alert>

      <GatewayAndInstrumentsCard config={config} withAuth={withAuth} onSaved={setConfig} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CredentialsCard
          key={`zohopay-${config.credentials?.zohopay_account_id ?? ""}-${config.credentials?.zohopay_client_id ?? ""}`}
          gateway="zohopay"
          title="Zoho Pay credentials"
          config={config}
          withAuth={withAuth}
          onSaved={setConfig}
        />
        <CredentialsCard
          key={`razorpay-${config.credentials?.razorpay_key_id ?? ""}`}
          gateway="razorpay"
          title="Razorpay credentials"
          config={config}
          withAuth={withAuth}
          onSaved={setConfig}
        />
      </div>
    </div>
  );
}

function GatewayAndInstrumentsCard({
  config,
  withAuth,
  onSaved,
}: {
  config: PaymentGatewayConfig;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  onSaved: (config: PaymentGatewayConfig) => void;
}) {
  const [activeGateway, setActiveGateway] = useState<PaymentGateway>(config.active_gateway);
  const [acceptCards, setAcceptCards] = useState(config.accept_cards);
  const [acceptUpi, setAcceptUpi] = useState(config.accept_upi);
  const [acceptNetbanking, setAcceptNetbanking] = useState(config.accept_netbanking);
  const [acceptManual, setAcceptManual] = useState(config.accept_manual);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    activeGateway !== config.active_gateway ||
    acceptCards !== config.accept_cards ||
    acceptUpi !== config.accept_upi ||
    acceptNetbanking !== config.accept_netbanking ||
    acceptManual !== config.accept_manual;

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await withAuth((token) =>
      updatePaymentGatewayConfig(token, {
        active_gateway: activeGateway,
        accept_cards: acceptCards,
        accept_upi: acceptUpi,
        accept_netbanking: acceptNetbanking,
        accept_manual: acceptManual,
      }),
    );
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSaved(result.data);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6 rounded-2xl p-6">
      <div className="flex flex-col gap-3">
        <span className={labelClass}>Active gateway</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {GATEWAYS.map((gateway) => {
            const selected = activeGateway === gateway.id;
            return (
              <button
                key={gateway.id}
                type="button"
                onClick={() => setActiveGateway(gateway.id)}
                aria-pressed={selected}
                className={`focus-ring flex flex-col gap-1.5 rounded-2xl border-2 p-5 text-left transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] ${
                  selected
                    ? "border-secondary bg-secondary/[0.06] shadow-[var(--elev-2)]"
                    : "border-primary/10 bg-white hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--elev-1)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-bold text-primary">{gateway.name}</span>
                  {selected && <Badge tone="brand">Active</Badge>}
                </div>
                <p className="text-xs leading-relaxed text-muted">{gateway.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className={labelClass}>Accepted payment instruments</span>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <SwitchRow label="Debit &amp; credit cards" checked={acceptCards} onChange={setAcceptCards} />
          <SwitchRow label="UPI" checked={acceptUpi} onChange={setAcceptUpi} />
          <SwitchRow label="Net banking" checked={acceptNetbanking} onChange={setAcceptNetbanking} />
          <SwitchRow
            label="Manual (pay at venue)"
            description="Offers “pay at venue” as a buyer-facing checkout option."
            checked={acceptManual}
            onChange={setAcceptManual}
          />
        </div>
      </div>

      {error && <Alert tone="error" emphasize>{error}</Alert>}
      {saved && !error && !dirty && (
        <Alert tone="success" className="self-start">Saved — applies to every event immediately.</Alert>
      )}

      <Button type="submit" variant="primary" loading={saving} disabled={!dirty} className="w-fit">
        Save settings
      </Button>
    </form>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: ReactNode;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="focus-ring flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-primary/10 bg-primary/[0.02] p-4 transition-colors duration-[var(--dur-fast)] hover:border-primary/25">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-primary">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-[var(--dur-fast)] ${
          checked ? "bg-secondary" : "bg-primary/15"
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-[var(--dur-fast)] ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </label>
  );
}

/** One gateway's credential fields — form state is a partial `PaymentGatewayConfigPayload` kept
 * entirely local: a blank field means "leave the stored value alone" (only non-empty fields are
 * sent), so re-opening this card never requires re-typing a secret that's already configured.
 * The status chip next to each field's label reads from `config.credentials`, not this form
 * state, so it always reflects what's actually saved. */
function CredentialsCard({
  gateway,
  title,
  config,
  withAuth,
  onSaved,
}: {
  gateway: PaymentGateway;
  title: string;
  config: PaymentGatewayConfig;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  onSaved: (config: PaymentGatewayConfig) => void;
}) {
  const [fields, setFields] = useState<PaymentGatewayConfigPayload>({});
  const [saving, setSaving] = useState(false);
  const [clearingField, setClearingField] = useState<keyof PaymentGatewayConfigPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const credentials = config.credentials;
  const dirty = Object.values(fields).some((value) => value);

  function set(key: keyof PaymentGatewayConfigPayload, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save(payload: PaymentGatewayConfigPayload) {
    const result = await withAuth((token) => updatePaymentGatewayConfig(token, payload));
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    onSaved(result.data);
    setError(null);
    return true;
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setSaved(false);
    // Only fields the admin actually typed into go in the request — an untouched field stays
    // whatever it already was on the backend (see the card's own docstring above).
    const payload = Object.fromEntries(Object.entries(fields).filter(([, value]) => value)) as PaymentGatewayConfigPayload;
    const ok = await save(payload);
    setSaving(false);
    if (ok) {
      setFields({});
      setSaved(true);
    }
  }

  async function handleClear(key: keyof PaymentGatewayConfigPayload) {
    setClearingField(key);
    setSaved(false);
    await save({ [key]: "" });
    setClearingField(null);
  }

  const isZoho = gateway === "zohopay";

  return (
    // `h-full` + the fields living in their own `flex-1` block below: the two credential
    // cards sit side by side in a grid row, and Zoho Pay's four fields make it the taller of
    // the two — without this, Razorpay's shorter field list left its own Save button sitting
    // right where its content ended instead of bottom-aligned with Zoho Pay's.
    <form onSubmit={handleSubmit} className="card flex h-full flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <span className={labelClass}>{title}</span>
        <Badge tone={config.active_gateway === gateway ? "success" : "neutral"}>
          {config.active_gateway === gateway ? "Currently active" : "Inactive"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-4">
      {isZoho ? (
        <>
          <CredentialField
            label="Account ID"
            statusValue={credentials?.zohopay_account_id ?? null}
            value={fields.zohopay_account_id ?? ""}
            onChange={(value) => set("zohopay_account_id", value)}
            onClear={() => handleClear("zohopay_account_id")}
            clearing={clearingField === "zohopay_account_id"}
          />
          <CredentialField
            label="Client ID"
            statusValue={credentials?.zohopay_client_id ?? null}
            value={fields.zohopay_client_id ?? ""}
            onChange={(value) => set("zohopay_client_id", value)}
            onClear={() => handleClear("zohopay_client_id")}
            clearing={clearingField === "zohopay_client_id"}
          />
          <CredentialField
            label="Client secret"
            secret
            configured={credentials?.zohopay_client_secret_configured ?? false}
            value={fields.zohopay_client_secret ?? ""}
            onChange={(value) => set("zohopay_client_secret", value)}
            onClear={() => handleClear("zohopay_client_secret")}
            clearing={clearingField === "zohopay_client_secret"}
          />
          <CredentialField
            label="API domain"
            hint="e.g. https://payments.zoho.in"
            statusValue={credentials?.zohopay_api_domain ?? null}
            value={fields.zohopay_api_domain ?? ""}
            onChange={(value) => set("zohopay_api_domain", value)}
            onClear={() => handleClear("zohopay_api_domain")}
            clearing={clearingField === "zohopay_api_domain"}
          />
        </>
      ) : (
        <>
          <CredentialField
            label="Key ID"
            statusValue={credentials?.razorpay_key_id ?? null}
            value={fields.razorpay_key_id ?? ""}
            onChange={(value) => set("razorpay_key_id", value)}
            onClear={() => handleClear("razorpay_key_id")}
            clearing={clearingField === "razorpay_key_id"}
          />
          <CredentialField
            label="Key secret"
            secret
            configured={credentials?.razorpay_key_secret_configured ?? false}
            value={fields.razorpay_key_secret ?? ""}
            onChange={(value) => set("razorpay_key_secret", value)}
            onClear={() => handleClear("razorpay_key_secret")}
            clearing={clearingField === "razorpay_key_secret"}
          />
        </>
      )}
      </div>

      {error && <Alert tone="error" emphasize>{error}</Alert>}
      {saved && !error && <Alert tone="success" className="self-start">Saved.</Alert>}

      <Button type="submit" variant="secondary" size="sm" loading={saving} disabled={!dirty} className="w-fit">
        Save {title.replace(" credentials", "")} credentials
      </Button>
    </form>
  );
}

function CredentialField({
  label,
  hint,
  value,
  onChange,
  onClear,
  clearing,
  secret = false,
  statusValue,
  configured,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  clearing: boolean;
  /** A true secret (client/key secret) — never shown, even masked; only a configured/not-configured chip. */
  secret?: boolean;
  statusValue?: string | null;
  configured?: boolean;
}) {
  const isSet = secret ? Boolean(configured) : statusValue != null;
  const Input = secret ? PasswordField : TextField;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-primary">{label}</span>
        <div className="flex items-center gap-2">
          <Badge tone={isSet ? "success" : "neutral"}>
            {isSet ? (statusValue ?? "Configured") : "Not set"}
          </Badge>
          {isSet && (
            <button
              type="button"
              onClick={onClear}
              disabled={clearing}
              className="focus-ring text-[11px] font-semibold text-secondary transition-colors hover:text-primary disabled:opacity-50"
            >
              {clearing ? "Clearing…" : "Clear"}
            </button>
          )}
        </div>
      </div>
      <Input
        label=""
        fieldClassName="[&>span:first-child]:hidden"
        hint={hint}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={isSet ? "Enter a new value to replace it" : "Not set"}
        autoComplete="off"
      />
    </div>
  );
}
