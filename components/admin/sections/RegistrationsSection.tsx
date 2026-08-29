"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/types";
import { cancelRegistration, getRegistration, listRegistrations } from "@/lib/adminApi";
import type { AdminRegistration } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader, StatusPill, Table, Td, Thead, Tr } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/format";

const STATUS_FILTERS = ["", "confirmed", "pending_payment", "cancelled"];

export default function RegistrationsSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [status, setStatus] = useState("");
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listRegistrations(token, event.id, status || undefined));
      if (cancelled) return;
      if (result.ok) {
        setRegistrations(result.data.results);
        setCount(result.data.count);
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, status, withAuth]);

  function handleCancelled(id: number) {
    setRegistrations((current) => current.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)));
    setSelectedId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Registrations" description={`${count} total for this event.`} />

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((option) => (
          <button
            key={option || "all"}
            type="button"
            onClick={() => setStatus(option)}
            className={`focus-ring press rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              status === option ? "border-secondary bg-secondary text-white" : "border-hairline-strong text-primary hover:bg-primary/5"
            }`}
          >
            {option ? option.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={4} label="Loading registrations" />
      ) : registrations.length === 0 ? (
        <EmptyState title="No registrations" description="Nothing matches this filter yet." />
      ) : (
        <Table>
          <Thead columns={["Reference", "Primary contact", "Status", "Amount", "Created", ""]} />
          <tbody>
            {registrations.map((registration) => (
              <Tr key={registration.id}>
                <Td className="font-mono text-xs">{registration.booking_reference ?? `#${registration.id}`}</Td>
                <Td>
                  <p className="font-semibold text-primary">{registration.primary_name ?? "—"}</p>
                  <p className="text-xs text-muted">{registration.primary_email}</p>
                </Td>
                <Td>
                  <StatusPill status={registration.status} />
                </Td>
                <Td className="whitespace-nowrap">{registration.total_amount ? `${registration.currency ?? "INR"} ${registration.total_amount}` : "Free"}</Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDate(registration.created_at) ?? "—"}</Td>
                <Td>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(registration.id)}>
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {selectedId !== null && (
        <RegistrationDetailModal registrationId={selectedId} withAuth={withAuth} onClose={() => setSelectedId(null)} onCancelled={handleCancelled} />
      )}
    </div>
  );
}

/**
 * Fetches the full detail record itself (`GET /registrations/<pk>/`) rather than reusing the
 * row passed in from the list — the list endpoint's rows are thinner and don't carry
 * `primary_name`/`primary_email`/`primary_phone`, `discount_amount`, `promo_code`,
 * `cancellation_reason`, `event_detail`, or full ticket/attendee records, so a detail view
 * built straight from a list row showed blanks for all of those even though the backend had
 * the data — see `AdminRegistration` in lib/adminTypes.ts.
 */
function RegistrationDetailModal({
  registrationId,
  onClose,
  onCancelled,
  withAuth,
}: {
  registrationId: number;
  onClose: () => void;
  onCancelled: (id: number) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [registration, setRegistration] = useState<AdminRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      const result = await withAuth((token) => getRegistration(token, registrationId));
      if (cancelled) return;
      if (result.ok) setRegistration(result.data);
      else setLoadError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [registrationId, withAuth]);

  async function handleCancel() {
    if (!registration) return;
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) => cancelRegistration(token, registration.id, reason));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCancelled(registration.id);
  }

  return (
    <Modal title={registration?.booking_reference ?? `Registration #${registrationId}`} onClose={onClose}>
      {loading ? (
        <ListSkeleton rows={2} label="Loading registration" />
      ) : loadError || !registration ? (
        <Alert tone="error">{loadError ?? "Couldn't load this registration."}</Alert>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status"><StatusPill status={registration.status} /></Field>
            <Field label="Relationship" value={registration.relationship} />
            <Field label="Primary name" value={registration.primary_name || "—"} />
            <Field label="Primary email" value={registration.primary_email || "—"} />
            <Field label="Primary phone" value={registration.primary_phone || "—"} />
            <Field label="Booked" value={registration.is_onsite ? "On-site" : "Online"} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit price" value={registration.unit_price ? `${registration.currency ?? "INR"} ${registration.unit_price}` : "—"} />
            <Field label="Discount" value={registration.discount_amount && registration.discount_amount !== "0.00" ? `${registration.currency ?? "INR"} ${registration.discount_amount}` : "—"} />
            <Field label="Total" value={registration.total_amount ? `${registration.currency ?? "INR"} ${registration.total_amount}` : "Free"} />
            <Field label="Promo code" value={registration.promo_code ?? "—"} />
          </div>

          {registration.event_detail && (
            <Field label="Event">
              {registration.event_detail.title}
              {registration.event_detail.venue_name ? ` — ${registration.event_detail.venue_name}` : ""}
            </Field>
          )}

          {registration.attendees && registration.attendees.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Attendees</p>
              <ul className="flex flex-col gap-1.5">
                {registration.attendees.map((attendee) => (
                  <li key={attendee.id} className="rounded-lg border border-hairline bg-primary/[0.02] px-3 py-2 text-sm">
                    <span className="font-semibold text-primary">{attendee.name}</span>
                    <span className="ml-2 text-xs text-muted">
                      {[attendee.grade && `Grade ${attendee.grade}`, attendee.school, attendee.competition].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {registration.tickets && registration.tickets.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Tickets</p>
              <ul className="flex flex-col gap-1.5">
                {registration.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex items-center justify-between rounded-lg border border-hairline bg-primary/[0.02] px-3 py-2 text-xs">
                    <span className="font-mono text-muted">{ticket.qr_token}</span>
                    <StatusPill status={ticket.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {registration.form_data && Object.keys(registration.form_data).length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Form data</p>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(registration.form_data).map(([key, value]) => (
                  <div key={key} className="rounded-lg border border-hairline bg-primary/[0.02] px-3 py-1.5">
                    <dt className="text-muted">{key}</dt>
                    <dd className="font-semibold text-primary">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {registration.status === "cancelled" ? (
            registration.cancellation_reason && (
              <Alert tone="warning">Cancelled — {registration.cancellation_reason}</Alert>
            )
          ) : (
            <div className="flex flex-col gap-2 border-t border-hairline pt-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">Cancellation reason</span>
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Duplicate booking"
                  className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/12"
                />
              </label>
              {error && <Alert tone="error">{error}</Alert>}
              <Button variant="secondary" loading={submitting} onClick={handleCancel} className="w-fit">
                Cancel registration
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline bg-primary/[0.02] px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-0.5 font-semibold text-primary">{children ?? value}</div>
    </div>
  );
}
