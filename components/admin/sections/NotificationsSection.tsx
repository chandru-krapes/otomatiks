"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import { getEmailTemplate, listEmailLogs, putEmailTemplate, sendTestEmail } from "@/lib/adminApi";
import { EMAIL_TRIGGERS, type EmailLog, type EmailTemplate, type EmailTrigger } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader, StatusPill, Table, Td, Thead, Tr } from "../ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextField, TextareaField } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

export default function NotificationsSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [trigger, setTrigger] = useState<EmailTrigger>("registration_confirmation");
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotice(null);
      const result = await withAuth((token) => getEmailTemplate(token, event.id, trigger));
      if (cancelled) return;
      if (result.ok) {
        setTemplate(result.data);
        setSubject(result.data.subject);
        setBodyHtml(result.data.body_html);
      } else {
        setTemplate(null);
        setSubject("");
        setBodyHtml("");
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, trigger, withAuth]);

  useEffect(() => {
    withAuth<EmailLog[]>((token) => listEmailLogs(token, event.id).then((data) => ({ ok: true as const, data }))).then((result) => {
      if (result.ok) setLogs(result.data);
    });
  }, [event.id, withAuth]);

  async function handleSave(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setNotice(null);
    const result = await withAuth((token) => putEmailTemplate(token, event.id, trigger, subject, bodyHtml));
    setSaving(false);
    if (!result.ok) {
      setNotice({ tone: "error", message: result.message });
      return;
    }
    setTemplate(result.data);
    setNotice({ tone: "success", message: "Template saved." });
  }

  async function handleSendTest() {
    if (!testEmail) return;
    setSendingTest(true);
    const result = await withAuth((token) => sendTestEmail(token, event.id, trigger, testEmail));
    setSendingTest(false);
    setNotice(
      result.ok
        ? { tone: "success", message: `Test email sent to ${testEmail}.` }
        : { tone: "error", message: result.message },
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Notifications" description="Per-event email templates, test sends, and delivery logs." />

      <div className="card flex flex-col gap-4 rounded-2xl p-6">
        <SelectField label="Trigger" value={trigger} onChange={(event) => setTrigger(event.target.value as EmailTrigger)} fieldClassName="max-w-sm">
          {EMAIL_TRIGGERS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </SelectField>

        {loading ? (
          <ListSkeleton rows={1} label="Loading template" />
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {!template && (
              <Alert tone="info">No event-specific template yet — showing the platform-wide default. Saving creates one for this event.</Alert>
            )}
            <TextField label="Subject" required value={subject} onChange={(event) => setSubject(event.target.value)} />
            <TextareaField label="Body (HTML)" required rows={8} value={bodyHtml} onChange={(event) => setBodyHtml(event.target.value)} />
            {notice && <Alert tone={notice.tone}>{notice.message}</Alert>}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={saving}>Save template</Button>
              <div className="flex items-center gap-2">
                <input
                  value={testEmail}
                  onChange={(event) => setTestEmail(event.target.value)}
                  type="email"
                  placeholder="test@email.com"
                  className="rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/12"
                />
                <Button type="button" variant="secondary" loading={sendingTest} onClick={handleSendTest} disabled={!template}>
                  Send test
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>

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
                  <Td>{log.recipient}</Td>
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
