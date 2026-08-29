"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/lib/types";
import { generateCertificates, listCertificateTemplates, listRegistrations, pollCertificateTask } from "@/lib/adminApi";
import type { AdminRegistration, CertificateTaskStatus, CertificateTemplate } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { ProgressBar, SectionHeader, Table, Td, Thead, Tr } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/**
 * Certificate templates plus the async (Celery) generation flow — kicks off
 * `POST /certificates/generate/` for every confirmed registration and polls
 * the returned task id until it settles.
 */
export default function CertificatesSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [task, setTask] = useState<CertificateTaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [templatesResult, registrationsResult] = await Promise.all([
        withAuth<CertificateTemplate[]>((token) => listCertificateTemplates(token, event.id).then((data) => ({ ok: true as const, data }))),
        withAuth((token) => listRegistrations(token, event.id, "confirmed")),
      ]);
      if (cancelled) return;
      if (templatesResult.ok) {
        setTemplates(templatesResult.data);
        if (templatesResult.data[0]) setSelectedTemplate(String(templatesResult.data[0].id));
      }
      if (registrationsResult.ok) setRegistrations(registrationsResult.data.results);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!selectedTemplate || selected.size === 0) return;
    setSubmitting(true);
    setError(null);
    setTask(null);
    const result = await withAuth((token) => generateCertificates(token, Array.from(selected), selectedTemplate));
    if (!result.ok) {
      setSubmitting(false);
      setError(result.message);
      return;
    }
    poll(result.data.task_id);
  }

  function poll(taskId: string) {
    withAuth((token) => pollCertificateTask(token, taskId)).then((result) => {
      if (!result.ok) {
        setSubmitting(false);
        setError(result.message);
        return;
      }
      setTask(result.data);
      if (result.data.status === "SUCCESS" || result.data.status === "FAILURE") {
        setSubmitting(false);
      } else {
        setTimeout(() => poll(taskId), 1500);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Certificates" description="Manage templates and generate certificates for confirmed registrations." />

      {loading ? (
        <ListSkeleton rows={2} label="Loading certificate templates" />
      ) : templates.length === 0 ? (
        <EmptyState title="No certificate templates yet" description="Add a template from the backend admin, then come back here to generate." />
      ) : (
        <>
          <Table>
            <Thead columns={["Name", "Kind", "Dynamic fields"]} />
            <tbody>
              {templates.map((template) => (
                <Tr key={template.id}>
                  <Td className="font-semibold text-primary">{template.name}</Td>
                  <Td className="capitalize">{template.kind}</Td>
                  <Td className="text-xs text-muted">{template.dynamic_fields?.join(", ") ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>

          <div className="card flex flex-col gap-4 rounded-2xl p-6">
            <h3 className="font-display text-base font-bold text-primary">Generate certificates</h3>
            <SelectField label="Template" value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)} fieldClassName="max-w-xs">
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </SelectField>

            {registrations.length === 0 ? (
              <p className="text-sm text-muted">No confirmed registrations to generate for yet.</p>
            ) : (
              <ul className="admin-scroll-light flex max-h-56 flex-col gap-1.5 overflow-y-auto">
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

            {task && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                  <span>Task status</span>
                  <span>{task.status}</span>
                </div>
                <ProgressBar value={task.status === "SUCCESS" ? 1 : task.progress ?? 0} max={1} />
                {task.status === "SUCCESS" && <Alert tone="success">Generated {task.results?.length ?? 0} certificate(s).</Alert>}
                {task.status === "FAILURE" && <Alert tone="error">Certificate generation failed.</Alert>}
              </div>
            )}

            <Button onClick={handleGenerate} loading={submitting} disabled={!selectedTemplate || selected.size === 0} className="w-fit">
              Generate {selected.size > 0 ? `${selected.size} certificate(s)` : ""}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
