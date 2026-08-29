"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import { listPayments, refundPayment, verifyPayment } from "@/lib/adminApi";
import type { Payment } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader, StatusPill, Table, Td, Thead, Tr } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { TextField } from "@/components/ui/Field";

const STATUS_FILTERS = ["", "pending", "success", "failed", "refunded", "partially_refunded"];

export default function PaymentsSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [status, setStatus] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refunding, setRefunding] = useState<Payment | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listPayments(token, event.id, status || undefined));
      if (cancelled) return;
      if (result.ok) {
        setPayments(result.data.results);
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

  async function handleVerify(paymentId: number) {
    setBusyId(paymentId);
    setError(null);
    const result = await withAuth((token) => verifyPayment(token, paymentId));
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPayments((current) => current.map((p) => (p.id === paymentId ? result.data : p)));
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Payments" description={`${count} payment records for this event.`} />

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
        <ListSkeleton rows={4} label="Loading payments" />
      ) : payments.length === 0 ? (
        <EmptyState title="No payments" description="Nothing matches this filter yet." />
      ) : (
        <Table>
          <Thead columns={["Registration", "Amount", "Method", "Status", ""]} />
          <tbody>
            {payments.map((payment) => (
              <Tr key={payment.id}>
                <Td className="font-mono text-xs">#{payment.registration}</Td>
                <Td className="whitespace-nowrap">{payment.currency} {payment.amount}</Td>
                <Td className="capitalize">{payment.method}</Td>
                <Td>
                  <StatusPill status={payment.status} />
                </Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-2">
                    {payment.status === "pending" && (
                      <Button size="sm" variant="secondary" loading={busyId === payment.id} onClick={() => handleVerify(payment.id)}>
                        Verify
                      </Button>
                    )}
                    {payment.status === "success" && (
                      <Button size="sm" variant="ghost" onClick={() => setRefunding(payment)}>
                        Refund
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {refunding && (
        <RefundModal
          payment={refunding}
          withAuth={withAuth}
          onClose={() => setRefunding(null)}
          onRefunded={(paymentId, newStatus) => {
            setPayments((current) => current.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p)));
            setRefunding(null);
          }}
        />
      )}
    </div>
  );
}

function RefundModal({
  payment,
  onClose,
  onRefunded,
  withAuth,
}: {
  payment: Payment;
  onClose: () => void;
  onRefunded: (paymentId: number, status: string) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [amount, setAmount] = useState(payment.amount);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) => refundPayment(token, payment.id, amount, reason));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const fullRefund = Number(amount) >= Number(payment.amount);
    onRefunded(payment.id, fullRefund ? "refunded" : "partially_refunded");
  }

  return (
    <Modal title={`Refund payment #${payment.id}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Records refund intent only — {payment.currency} {payment.amount} was charged; the gateway refund call isn&rsquo;t wired up yet.
        </p>
        <TextField label="Refund amount" required value={amount} onChange={(event) => setAmount(event.target.value)} />
        <TextField label="Reason" required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Event cancelled" />
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Initiate refund
        </Button>
      </form>
    </Modal>
  );
}
