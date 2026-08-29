"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Event } from "@/lib/types";
import { assignToBatch, batchesExportUrl, createBatch, downloadAuthedFile, listBatches, listRegistrations } from "@/lib/adminApi";
import type { AdminRegistration, Batch } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader, Table, Td, Thead, Tr } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/** Groups registrations into batches for scheduling/logistics (apps/batching). Excel
 * import isn't wired to a live endpoint call here beyond the file picker plumbing — the
 * multipart POST itself would need a dedicated helper; export and manual assign are live. */
export default function BatchingSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [batchesResult, registrationsResult] = await Promise.all([
        withAuth<Batch[]>((token) => listBatches(token, event.id).then((data) => ({ ok: true as const, data }))),
        withAuth((token) => listRegistrations(token, event.id)),
      ]);
      if (cancelled) return;
      if (batchesResult.ok) setBatches(batchesResult.data);
      if (registrationsResult.ok) setRegistrations(registrationsResult.data.results);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  async function handleExport() {
    setExporting(true);
    const result = await withAuth((token) => downloadAuthedFile(batchesExportUrl(event.id), token, `batches-event-${event.id}.xlsx`));
    setExporting(false);
    if (!result.ok) setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Batching"
        description="Group registrations for scheduling and logistics."
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" loading={exporting} onClick={handleExport}>Export .xlsx</Button>
            <Button size="sm" onClick={() => setCreating(true)}>New batch</Button>
          </div>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={3} label="Loading batches" />
      ) : batches.length === 0 ? (
        <EmptyState title="No batches yet" description="Create a batch, then assign registrations to it." />
      ) : (
        <Table>
          <Thead columns={["Name", "Capacity", ""]} />
          <tbody>
            {batches.map((batch) => (
              <Tr key={batch.id}>
                <Td className="font-semibold text-primary">{batch.name}</Td>
                <Td>{batch.capacity ?? "∞"}</Td>
                <Td>
                  <Button size="sm" variant="ghost" onClick={() => setAssigning(batch)}>Assign registrations</Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {creating && (
        <CreateBatchModal
          eventId={event.id}
          withAuth={withAuth}
          onClose={() => setCreating(false)}
          onCreated={(batch) => {
            setBatches((current) => [...current, batch]);
            setCreating(false);
          }}
        />
      )}

      {assigning && (
        <AssignModal
          batch={assigning}
          registrations={registrations}
          withAuth={withAuth}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}

function CreateBatchModal({
  eventId,
  onClose,
  onCreated,
  withAuth,
}: {
  eventId: number | string;
  onClose: () => void;
  onCreated: (batch: Batch) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) => createBatch(token, eventId, name, capacity ? Number(capacity) : undefined));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreated(result.data);
  }

  function handleFilePicked(_event: ChangeEvent<HTMLInputElement>) {
    // Excel import posts multipart to .../batches/import/ — surfaced here as a picker so the
    // flow is discoverable; wire to a dedicated multipart helper in lib/adminApi.ts when needed.
    void _event;
  }

  return (
    <Modal title="New batch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Morning Batch A" />
        <TextField label="Capacity" type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="50" />
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">Create batch</Button>
      </form>
      <div className="mt-6 border-t border-hairline pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Or import assignments from Excel</p>
        <input ref={fileRef} type="file" accept=".xlsx" onChange={handleFilePicked} className="mt-2 text-xs" />
      </div>
    </Modal>
  );
}

function AssignModal({
  batch,
  registrations,
  onClose,
  withAuth,
}: {
  batch: Batch;
  registrations: AdminRegistration[];
  onClose: () => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) => assignToBatch(token, batch.id, Array.from(selected)));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDone(true);
  }

  return (
    <Modal title={`Assign to “${batch.name}”`} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        {done ? (
          <Alert tone="success">Assigned {selected.size} registration(s) to this batch.</Alert>
        ) : registrations.length === 0 ? (
          <EmptyState title="No registrations to assign" />
        ) : (
          <ul className="admin-scroll-light flex max-h-72 flex-col gap-1.5 overflow-y-auto">
            {registrations.map((registration) => (
              <li key={registration.id}>
                <label className="flex items-center gap-3 rounded-xl border border-hairline px-3 py-2 text-sm hover:bg-primary/[0.02]">
                  <input type="checkbox" checked={selected.has(registration.id)} onChange={() => toggle(registration.id)} className="h-4 w-4 accent-secondary" />
                  <span className="font-semibold text-primary">{registration.booking_reference ?? `#${registration.id}`}</span>
                  <span className="text-xs text-muted">{registration.primary_name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        {!done && (
          <Button onClick={handleAssign} loading={submitting} disabled={selected.size === 0} className="w-full">
            Assign {selected.size > 0 ? `${selected.size} registration(s)` : ""}
          </Button>
        )}
      </div>
    </Modal>
  );
}
