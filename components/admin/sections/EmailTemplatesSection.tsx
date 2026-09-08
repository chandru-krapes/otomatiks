"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import {
  getEmailTemplate,
  listEmailLogs,
  listEmailTemplates,
  listEmailTriggers,
  putEmailTemplate,
  sendTestEmail,
} from "@/lib/adminApi";
import {
  EMAIL_TRIGGER_GROUPS,
  type EmailLog,
  type EmailTemplate,
  type EmailTrigger,
  type EmailTriggerCatalogEntry,
} from "@/lib/adminTypes";
import { applyPlaceholderSamples, findUnknownPlaceholders, InsertPlaceholderMenu, RichBodyEditor, type WithAuth } from "../EmailEditor";
import { SectionHeader, StatusPill, Table, Td, Thead, Tr } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextField, TextareaField, labelClass } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";
import CustomEmailTemplatesSection from "./CustomEmailTemplatesSection";

function Badge({ tone, children }: { tone: "default" | "customized"; children: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        tone === "customized" ? "border-secondary/25 bg-secondary/10 text-secondary" : "border-primary/15 bg-primary/5 text-muted"
      }`}
    >
      {children}
    </span>
  );
}

const TABS = [
  { id: "triggers", label: "Trigger emails" },
  { id: "custom", label: "Custom announcements" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function EmailTemplatesSection({ event, withAuth }: { event: Event; withAuth: WithAuth }) {
  const [tab, setTab] = useState<TabId>("triggers");

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Email templates" description="Per-event overrides of the platform's transactional emails, plus free-form announcements sent to a chosen audience." />

      <div className="flex w-fit rounded-full border border-primary/15 bg-primary/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-white text-secondary shadow-[var(--elev-1)]" : "text-muted hover:text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "triggers" ? <TriggerEmailsPanel event={event} withAuth={withAuth} /> : <CustomEmailTemplatesSection event={event} withAuth={withAuth} />}
    </div>
  );
}

function TriggerEmailsPanel({ event, withAuth }: { event: Event; withAuth: WithAuth }) {
  const [catalog, setCatalog] = useState<EmailTriggerCatalogEntry[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [rows, setRows] = useState<EmailTemplate[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState<EmailTrigger | string>("registration_confirmation");
  const [platformDefaults, setPlatformDefaults] = useState<Record<string, { subject: string; body_html: string }>>({});

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [rawMode, setRawMode] = useState(false);
  const [syncToken, setSyncToken] = useState(0);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  const catalogEntry = useMemo(() => catalog.find((entry) => entry.trigger === trigger) ?? null, [catalog, trigger]);
  const currentRow = useMemo(() => rows.find((row) => row.trigger === trigger) ?? null, [rows, trigger]);
  const rowByTrigger = useMemo(() => new Map(rows.map((row) => [row.trigger, row])), [rows]);
  const placeholders = useMemo(
    () => catalogEntry?.placeholders ?? currentRow?.available_placeholders ?? [],
    [catalogEntry, currentRow],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setCatalogLoading(true);
      const result = await withAuth<EmailTriggerCatalogEntry[]>((token) => listEmailTriggers(token));
      if (cancelled) return;
      if (result.ok) setCatalog(result.data);
      setCatalogLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function reloadRows() {
    setRowsLoading(true);
    setRowsError(null);
    withAuth<EmailTemplate[]>((token) => listEmailTemplates(token, event.id)).then((result) => {
      if (result.ok) {
        setRows(result.data);
        setPlatformDefaults((current) => {
          const next = { ...current };
          for (const row of result.data) {
            if (row.is_platform_default) next[row.trigger] = { subject: row.subject, body_html: row.body_html };
          }
          return next;
        });
      } else {
        setRowsError(result.message);
      }
      setRowsLoading(false);
    });
  }

  useEffect(() => {
    async function init() {
      reloadRows();
    }
    init();
  }, [event.id]);

  useEffect(() => {
    withAuth<EmailLog[]>((token) => listEmailLogs(token, event.id).then((data) => ({ ok: true as const, data }))).then((result) => {
      if (result.ok) setLogs(result.data);
    });
  }, [event.id, withAuth]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setNotice(null);
      const row = rowByTrigger.get(trigger);
      if (row) {
        setSubject(row.subject);
        setBodyHtml(row.body_html);
        setSyncToken((n) => n + 1);
        return;
      }
      if (rowsLoading) return;
      const result = await withAuth((token) => getEmailTemplate(token, event.id, trigger));
      if (cancelled) return;
      if (result.ok) {
        setSubject(result.data.subject);
        setBodyHtml(result.data.body_html);
      } else {
        setSubject("");
        setBodyHtml("");
      }
      setSyncToken((n) => n + 1);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [trigger, rowsLoading, rowByTrigger]);

  async function handleSave(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!subject.trim() || !bodyHtml.trim()) {
      setNotice({ tone: "error", message: "Subject and body can't be empty." });
      return;
    }
    setSaving(true);
    setNotice(null);
    const result = await withAuth((token) => putEmailTemplate(token, event.id, trigger, subject, bodyHtml));
    setSaving(false);
    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }
    setRows((current) => {
      const next = current.filter((row) => row.trigger !== trigger);
      next.push(result.data);
      return next;
    });
    setNotice({ tone: "success", message: "Template saved." });
  }

  async function handleResetToDefault() {
    const fallback = platformDefaults[trigger];
    if (!fallback) return;
    setResetting(true);
    setNotice(null);
    const result = await withAuth((token) => putEmailTemplate(token, event.id, trigger, fallback.subject, fallback.body_html));
    setResetting(false);
    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }
    setRows((current) => {
      const next = current.filter((row) => row.trigger !== trigger);
      next.push(result.data);
      return next;
    });
    setSubject(result.data.subject);
    setBodyHtml(result.data.body_html);
    setSyncToken((n) => n + 1);
    setNotice({ tone: "success", message: "Reset to the platform default." });
  }

  async function handleSendTest() {
    if (!testEmail) return;
    setSendingTest(true);
    const result = await withAuth((token) => sendTestEmail(token, event.id, trigger, testEmail));
    setSendingTest(false);
    setNotice(
      result.ok
        ? { tone: "success", message: result.data.message ?? `Test email sent to ${testEmail}.` }
        : { tone: "error", message: result.message },
    );
  }

  const unknownPlaceholders = useMemo(
    () => findUnknownPlaceholders(`${subject}\n${bodyHtml}`, placeholders),
    [subject, bodyHtml, placeholders],
  );
  const previewSubject = useMemo(() => applyPlaceholderSamples(subject, placeholders), [subject, placeholders]);
  const previewBody = useMemo(() => applyPlaceholderSamples(bodyHtml, placeholders), [bodyHtml, placeholders]);

  return (
    <div className="flex flex-col gap-8">
      {catalogLoading || rowsLoading ? (
        <ListSkeleton rows={3} label="Loading email templates" />
      ) : rowsError ? (
        <EmptyState title="Couldn't load templates" description={rowsError} action={<Button size="sm" onClick={reloadRows}>Try again</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[15rem_1fr]">
          <TriggerList
            catalog={catalog}
            rowByTrigger={rowByTrigger}
            selected={trigger}
            onSelect={(next) => setTrigger(next)}
          />

          <div className="card flex flex-col gap-5 rounded-2xl p-6">
            {!currentRow?.event && (
              <Alert tone="info">No event-specific template yet — showing the platform-wide default. Saving creates one for this event.</Alert>
            )}

            <form onSubmit={handleSave} className="flex flex-col gap-4">
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
                  <TextareaField label="" hint="Django template syntax — {% for %} / {% if %} tags are valid here." rows={10} value={bodyHtml} onChange={(event) => setBodyHtml(event.target.value)} />
                ) : (
                  <RichBodyEditor
                    value={bodyHtml}
                    onChange={setBodyHtml}
                    resetKey={syncToken}
                    uploadFolder={`email-templates/${event.id}`}
                    withAuth={withAuth}
                    placeholders={placeholders}
                  />
                )}
              </div>

              {unknownPlaceholders.length > 0 && (
                <Alert tone="warning">
                  These tokens don&apos;t match a known placeholder for this trigger and will render blank: {unknownPlaceholders.map((t) => `{{ ${t} }}`).join(", ")}
                </Alert>
              )}

              {notice && <Alert tone={notice.tone}>{notice.message}</Alert>}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" loading={saving}>Save template</Button>
                {currentRow && !currentRow.is_platform_default && platformDefaults[trigger] && (
                  <Button type="button" variant="secondary" size="sm" loading={resetting} onClick={handleResetToDefault}>
                    Reset to platform default
                  </Button>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <input
                    value={testEmail}
                    onChange={(event) => setTestEmail(event.target.value)}
                    type="email"
                    placeholder="test@email.com"
                    className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/12"
                  />
                  <Button type="button" variant="secondary" loading={sendingTest} onClick={handleSendTest} disabled={!testEmail}>
                    Send test
                  </Button>
                </div>
              </div>
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
      )}

      <div className="flex flex-col gap-4">
        <h3 className="font-display text-base font-bold text-primary">Delivery log</h3>
        {logs.length === 0 ? (
          <EmptyState title="No emails sent yet" />
        ) : (
          <Table>
            <Thead columns={["Recipient", "Status", "Sent at"]} />
            <tbody>
              {logs.slice(0, 50).map((log) => (
                <Tr key={log.id}>
                  <Td>{log.recipient_email}</Td>
                  <Td><StatusPill status={log.status} /></Td>
                  <Td className="whitespace-nowrap text-xs text-muted">{log.sent_at ? formatDate(log.sent_at) : "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}

function TriggerList({
  catalog,
  rowByTrigger,
  selected,
  onSelect,
}: {
  catalog: EmailTriggerCatalogEntry[];
  rowByTrigger: Map<string, EmailTemplate>;
  selected: string;
  onSelect: (trigger: string) => void;
}) {
  const byTrigger = new Map(catalog.map((entry) => [entry.trigger, entry]));
  return (
    <nav className="card flex flex-col gap-4 rounded-2xl p-4">
      {EMAIL_TRIGGER_GROUPS.map((group) => {
        const entries = group.triggers.map((t) => byTrigger.get(t)).filter((e): e is EmailTriggerCatalogEntry => Boolean(e));
        if (entries.length === 0) return null;
        return (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2 text-[11px] font-bold uppercase tracking-wide text-muted">{group.label}</p>
            {entries.map((entry) => {
              const row = rowByTrigger.get(entry.trigger);
              const customized = row ? !row.is_platform_default : false;
              const isSelected = entry.trigger === selected;
              return (
                <button
                  key={entry.trigger}
                  type="button"
                  onClick={() => onSelect(entry.trigger)}
                  className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? "bg-secondary/10 font-semibold text-secondary" : "text-foreground hover:bg-primary/6"
                  }`}
                >
                  <span className="truncate">{entry.label}</span>
                  <Badge tone={customized ? "customized" : "default"}>{customized ? "Custom" : "Default"}</Badge>
                </button>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
