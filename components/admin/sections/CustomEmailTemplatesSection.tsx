"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import {
  createCustomEmailTemplate,
  deleteCustomEmailTemplate,
  listCustomEmailTemplates,
  sendCustomEmailTemplate,
  updateCustomEmailTemplate,
} from "@/lib/adminApi";
import { CUSTOM_EMAIL_AUDIENCE_STATUSES, type CustomEmailTemplate, type EmailPlaceholder } from "@/lib/adminTypes";
import { applyPlaceholderSamples, findUnknownPlaceholders, InsertPlaceholderMenu, RichBodyEditor, type WithAuth } from "../EmailEditor";
import { Modal } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextField, TextareaField, labelClass } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

const FALLBACK_PLACEHOLDERS: EmailPlaceholder[] = [
  { key: "primary_name", label: "Registrant name", sample: "Ramesh Kumar" },
  { key: "primary_email", label: "Registrant email", sample: "ramesh@example.com" },
  { key: "event_title", label: "Event title", sample: "Robotica 2026" },
  { key: "booking_reference", label: "Booking reference", sample: "ROBOTI-2026-000001" },
];

const NEW_TEMPLATE_ID = "new" as const;

export default function CustomEmailTemplatesSection({ event, withAuth }: { event: Event; withAuth: WithAuth }) {
  const [templates, setTemplates] = useState<CustomEmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | typeof NEW_TEMPLATE_ID>(NEW_TEMPLATE_ID);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [rawMode, setRawMode] = useState(false);
  const [syncToken, setSyncToken] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const selected = useMemo(() => (selectedId === NEW_TEMPLATE_ID ? null : templates.find((t) => t.id === selectedId) ?? null), [selectedId, templates]);
  const placeholders = selected?.available_placeholders ?? FALLBACK_PLACEHOLDERS;

  function reload() {
    setLoading(true);
    setError(null);
    // `listCustomEmailTemplates` walks pagination itself and resolves to a plain array (see
    // its own comment in lib/adminApi.ts) — wrapped in an always-ok result so it fits
    // `withAuth`'s retry-on-401 signature, same as `listEmailLogs` above.
    withAuth<CustomEmailTemplate[]>((token) => listCustomEmailTemplates(token, event.id).then((data) => ({ ok: true as const, data }))).then((result) => {
      if (result.ok) setTemplates(result.data);
      else setError(result.message);
      setLoading(false);
    });
  }

  useEffect(() => {
    async function init() {
      reload();
    }
    init();
  }, [event.id]);

  function selectNew() {
    setSelectedId(NEW_TEMPLATE_ID);
    setName("");
    setSubject("");
    setBodyHtml("");
    setNotice(null);
    setSyncToken((n) => n + 1);
  }

  function selectExisting(template: CustomEmailTemplate) {
    setSelectedId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setBodyHtml(template.body_html);
    setNotice(null);
    setSyncToken((n) => n + 1);
  }

  async function handleSave(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!name.trim() || !subject.trim() || !bodyHtml.trim()) {
      setNotice({ tone: "error", message: "Name, subject, and body can't be empty." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const result = selected
      ? await withAuth((token) => updateCustomEmailTemplate(token, event.id, selected.id, { name, subject, body_html: bodyHtml }))
      : await withAuth((token) => createCustomEmailTemplate(token, event.id, name, subject, bodyHtml));
    setSaving(false);
    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }
    setTemplates((current) => {
      const next = current.filter((t) => t.id !== result.data.id);
      next.push(result.data);
      return next;
    });
    setSelectedId(result.data.id);
    setNotice({ tone: "success", message: selected ? "Announcement updated." : "Announcement created." });
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    setNotice(null);
    const result = await withAuth((token) => deleteCustomEmailTemplate(token, event.id, selected.id));
    setDeleting(false);
    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }
    setTemplates((current) => current.filter((t) => t.id !== selected.id));
    selectNew();
  }

  const unknownPlaceholders = useMemo(
    () => findUnknownPlaceholders(`${subject}\n${bodyHtml}`, placeholders),
    [subject, bodyHtml, placeholders],
  );
  const previewSubject = useMemo(() => applyPlaceholderSamples(subject, placeholders), [subject, placeholders]);
  const previewBody = useMemo(() => applyPlaceholderSamples(bodyHtml, placeholders), [bodyHtml, placeholders]);

  if (loading) return <ListSkeleton rows={3} label="Loading custom announcements" />;
  if (error) return <EmptyState title="Couldn't load announcements" description={error} action={<Button size="sm" onClick={reload}>Try again</Button>} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
        <nav className="card flex flex-col gap-1 rounded-2xl p-4">
          <button
            type="button"
            onClick={selectNew}
            className={`mb-2 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
              selectedId === NEW_TEMPLATE_ID ? "bg-secondary/10 text-secondary" : "border border-dashed border-primary/25 text-primary hover:bg-primary/6"
            }`}
          >
            + New announcement
          </button>
          {templates.length === 0 ? (
            <p className="px-2 text-xs text-muted">No announcements yet — create one to get started.</p>
          ) : (
            templates
              .slice()
              .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
              .map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectExisting(template)}
                  className={`flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    selectedId === template.id ? "bg-secondary/10 font-semibold text-secondary" : "text-foreground hover:bg-primary/6"
                  }`}
                >
                  <span className="truncate">{template.name}</span>
                  <span className="truncate text-xs font-normal text-muted">{template.subject}</span>
                </button>
              ))
          )}
        </nav>

        <div className="card flex flex-col gap-5 rounded-2xl p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <TextField label="Name" hint="Internal — organizers only, not shown to recipients." required value={name} onChange={(event) => setName(event.target.value)} />
            <TextField label="Subject" required value={subject} onChange={(event) => setSubject(event.target.value)} />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className={labelClass}>Body</span>
                <div className="flex items-center gap-3">
                  {rawMode && <InsertPlaceholderMenu placeholders={placeholders} onInsert={(token) => setBodyHtml((current) => `${current}${token}`)} />}
                  <button
                    type="button"
                    onClick={() => {
                      setRawMode((mode) => !mode);
                      setSyncToken((n) => n + 1);
                    }}
                    className="text-xs font-semibold text-secondary hover:text-primary"
                  >
                    {rawMode ? "Use rich editor" : "Advanced: raw HTML"}
                  </button>
                </div>
              </div>
              {rawMode ? (
                <TextareaField label="" rows={10} value={bodyHtml} onChange={(event) => setBodyHtml(event.target.value)} />
              ) : (
                <RichBodyEditor
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  resetKey={syncToken}
                  uploadFolder={`custom-email-templates/${event.id}`}
                  withAuth={withAuth}
                  placeholders={placeholders}
                />
              )}
            </div>

            {unknownPlaceholders.length > 0 && (
              <Alert tone="warning">
                These tokens don&apos;t match a known placeholder and will render blank: {unknownPlaceholders.map((t) => `{{ ${t} }}`).join(", ")}
              </Alert>
            )}

            {notice && <Alert tone={notice.tone}>{notice.message}</Alert>}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={saving}>{selected ? "Save changes" : "Create announcement"}</Button>
              {selected && (
                <>
                  <Button type="button" variant="secondary" size="sm" loading={deleting} onClick={handleDelete}>
                    Delete
                  </Button>
                  <Button type="button" variant="primary" size="sm" className="ml-auto" onClick={() => setSendModalOpen(true)}>
                    Send…
                  </Button>
                </>
              )}
            </div>
            {!selected && <p className="text-xs text-muted">Save the announcement first — sending needs a template to send.</p>}
          </form>

          <div className="flex flex-col gap-2 border-t border-hairline pt-5">
            <span className={labelClass}>Live preview (sample values)</span>
            <div className="rounded-xl border border-primary/15 bg-primary/[0.02] p-4">
              <p className="font-display text-sm font-bold text-primary">{previewSubject || "—"}</p>
              <div className="prose prose-sm mt-2 max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: previewBody || "<p class='text-muted'>—</p>" }} />
            </div>
          </div>
        </div>
      </div>

      {sendModalOpen && selected && (
        <SendAnnouncementModal event={event} template={selected} withAuth={withAuth} onClose={() => setSendModalOpen(false)} />
      )}
    </div>
  );
}

function SendAnnouncementModal({
  event,
  template,
  withAuth,
  onClose,
}: {
  event: Event;
  template: CustomEmailTemplate;
  withAuth: WithAuth;
  onClose: () => void;
}) {
  const [statuses, setStatuses] = useState<Set<string>>(new Set(["confirmed", "pending_payment"]));
  const [extraEmailsText, setExtraEmailsText] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const extraEmails = extraEmailsText
    .split(/[\n,]/)
    .map((e) => e.trim())
    .filter(Boolean);

  function toggleStatus(value: string) {
    setStatuses((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSend() {
    setSending(true);
    setResult(null);
    const sendResult = await withAuth((token) =>
      sendCustomEmailTemplate(token, event.id, template.id, { statuses: Array.from(statuses), extraEmails }),
    );
    setSending(false);
    if (!sendResult.ok) {
      setResult({ tone: "error", message: sendResult.message });
      return;
    }
    setResult({ tone: "success", message: sendResult.data.message ?? "Announcement queued for sending." });
  }

  return (
    <Modal title={`Send "${template.name}"`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Alert tone="warning">This queues an email to every matching registrant right away — it can&apos;t be recalled once sent.</Alert>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Audience</span>
          {CUSTOM_EMAIL_AUDIENCE_STATUSES.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={statuses.has(option.value)}
                onChange={() => toggleStatus(option.value)}
                className="h-4 w-4 accent-secondary"
              />
              {option.label}
              {option.value === "cancelled" && <span className="text-xs text-muted">(excluded unless checked)</span>}
            </label>
          ))}
        </div>

        <TextareaField
          label="Also send to (optional)"
          hint="One email per line or comma-separated — reaches people with no registration, e.g. a sponsor contact."
          rows={3}
          value={extraEmailsText}
          onChange={(event) => setExtraEmailsText(event.target.value)}
        />

        {result && <Alert tone={result.tone}>{result.message}</Alert>}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            loading={sending}
            disabled={statuses.size === 0 && extraEmails.length === 0}
            onClick={handleSend}
          >
            Send announcement
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {result?.tone === "success" ? "Done" : "Cancel"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
