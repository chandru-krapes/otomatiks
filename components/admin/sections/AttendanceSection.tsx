"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import { checkIn, listEventAttendance, manualCheckIn, searchRegistrants } from "@/lib/adminApi";
import type { AttendanceLogItem, RegistrantSearchResult } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader, Table, Td, Thead, Tr } from "../ui";
import { Select } from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { formatDate, formatTime } from "@/lib/format";

export default function AttendanceSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [log, setLog] = useState<AttendanceLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  // Bumped to re-trigger the fetch effect below after a check-in — the effect's own fetch
  // function has to stay declared inside the effect (see OverviewSection), so it can't be
  // called directly from the child forms below.
  const [reloadTick, setReloadTick] = useState(0);
  const reload = () => setReloadTick((tick) => tick + 1);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await withAuth<AttendanceLogItem[]>((token) =>
        listEventAttendance(token, event.id).then((data) => ({ ok: true as const, data })),
      );
      if (cancelled) return;
      if (result.ok) setLog(result.data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, reloadTick, withAuth]);

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader title="Attendance" description="Check people in on-site, search registrants, and review the full log." />

      {notice && <Alert tone={notice.tone}>{notice.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-2">
        <QrCheckIn withAuth={withAuth} onResult={setNotice} onLogged={reload} />
        <SearchAndManualCheckIn withAuth={withAuth} onResult={setNotice} onLogged={reload} />
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-display text-base font-bold text-primary">Full log</h3>
        {loading ? (
          <ListSkeleton rows={3} label="Loading attendance log" />
        ) : log.length === 0 ? (
          <EmptyState title="No check-ins yet" description="Scans and manual check-ins will appear here." />
        ) : (
          <Table>
            <Thead columns={["Ticket", "Method", "Purpose", "Checked in", "Checked out"]} />
            <tbody>
              {log.map((entry) => (
                <Tr key={entry.id}>
                  <Td className="font-mono text-xs">#{entry.ticket}</Td>
                  <Td className="capitalize">{entry.method}</Td>
                  <Td className="capitalize">{entry.qr_purpose ?? "entry"}</Td>
                  <Td className="whitespace-nowrap text-xs">
                    {entry.check_in_at ? `${formatDate(entry.check_in_at)} · ${formatTime(entry.check_in_at)}` : "—"}
                  </Td>
                  <Td className="whitespace-nowrap text-xs">
                    {entry.check_out_at ? `${formatDate(entry.check_out_at)} · ${formatTime(entry.check_out_at)}` : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}

function QrCheckIn({
  withAuth,
  onResult,
  onLogged,
}: {
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  onResult: (notice: { tone: "success" | "error"; message: string }) => void;
  onLogged: () => void;
}) {
  const [qrToken, setQrToken] = useState("");
  const [purpose, setPurpose] = useState("entry");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    const result = await withAuth((token) => checkIn(token, qrToken, purpose));
    setSubmitting(false);
    if (!result.ok) {
      onResult({ tone: "error", message: result.message });
      return;
    }
    onResult({ tone: "success", message: `Checked in ticket #${result.data.ticket}.` });
    setQrToken("");
    onLogged();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 rounded-2xl p-6">
      <h3 className="font-display text-base font-bold text-primary">QR scan check-in</h3>
      <p className="text-xs text-muted">Paste a scanned QR token — this is the value a physical scanner integration would feed in.</p>
      <input
        value={qrToken}
        onChange={(event) => setQrToken(event.target.value)}
        required
        placeholder="a1b2c3d4-e5f6-…"
        className="rounded-xl border border-primary/15 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/12"
      />
      <div className="flex items-center gap-3">
        <Select value={purpose} onChange={(event) => setPurpose(event.target.value)} className="py-2 text-sm">
          <option value="entry">Entry</option>
          <option value="food">Food</option>
          <option value="exit">Exit</option>
        </Select>
        <Button type="submit" size="sm" loading={submitting}>Check in</Button>
      </div>
    </form>
  );
}

function SearchAndManualCheckIn({
  withAuth,
  onResult,
  onLogged,
}: {
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  onResult: (notice: { tone: "success" | "error"; message: string }) => void;
  onLogged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RegistrantSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkingId, setCheckingId] = useState<number | null>(null);

  async function handleSearch(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const result = await withAuth((token) => searchRegistrants(token, query));
    setSearching(false);
    if (result.ok) setResults(result.data.results);
    else onResult({ tone: "error", message: result.message });
  }

  async function handleManual(registrationId: number) {
    setCheckingId(registrationId);
    const result = await withAuth((token) => manualCheckIn(token, registrationId));
    setCheckingId(null);
    if (!result.ok) {
      onResult({ tone: "error", message: result.message });
      return;
    }
    onResult({ tone: "success", message: `Checked in registration #${registrationId}.` });
    onLogged();
  }

  return (
    <div className="card flex flex-col gap-3 rounded-2xl p-6">
      <h3 className="font-display text-base font-bold text-primary">Registrant search &amp; manual check-in</h3>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or form field…"
          className="flex-1 rounded-xl border border-primary/15 bg-white px-3 py-2 text-sm outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/12"
        />
        <Button type="submit" size="sm" variant="secondary" loading={searching}>Search</Button>
      </form>
      {results.length > 0 && (
        <ul className="admin-scroll-light flex max-h-60 flex-col gap-2 overflow-y-auto">
          {results.map((registrant) => (
            <li key={registrant.id} className="flex items-center justify-between gap-3 rounded-xl border border-hairline px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-primary">Registration #{registrant.id}</p>
                <p className="truncate text-xs text-muted capitalize">{registrant.status}</p>
              </div>
              <Button size="sm" variant="ghost" loading={checkingId === registrant.id} onClick={() => handleManual(registrant.id)}>
                Check in
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
