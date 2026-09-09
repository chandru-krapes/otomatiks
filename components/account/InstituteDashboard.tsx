"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type {
  Event,
  InstituteBulkUploadResult,
  InstituteStudent,
  InstituteStudentUpdatePayload,
  RegistrationHistoryItem,
  TicketType,
} from "@/lib/types";
import {
  downloadInstituteBulkTemplate,
  getEventTicketTypes,
  getInstituteStudents,
  getMyRegistrations,
  listPublishedEvents,
  markInstituteStudentPaid,
  removeInstituteStudent,
  updateInstituteStudent,
  uploadInstituteBulk,
} from "@/lib/api";
import { clearSession } from "@/lib/auth";
import { formatDate, formatGender } from "@/lib/format";
import { useInstituteSession } from "./useInstituteSession";
import AccountShell from "./AccountShell";
import { Modal, Table, Td, Thead, Tr } from "@/components/admin/ui";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button, { Spinner } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { TextField, labelClass } from "@/components/ui/Field";
import { SelectField } from "@/components/ui/Select";
import { ListSkeleton } from "@/components/ui/Skeleton";

const GENDER_OPTIONS = [
  { value: "", label: "—" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "others", label: "Others" },
];

function UploadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7" />
    </svg>
  );
}

/** One action in the student table's toolbar — an icon-only, tooltipped button rather than a
 * row of wrapping text links (three separate `<Button variant="ghost">`s in a narrow cell wrapped
 * onto two lines and read as a stack of blue hyperlinks, not a set of related actions). Fixed
 * square footprint keeps every row's toolbar the same width regardless of which actions are
 * present, so rows don't jump around as `paid` toggles "Mark paid" on and off. */
function RowActionButton({
  label,
  tone = "neutral",
  loading = false,
  onClick,
  children,
}: {
  label: string;
  tone?: "neutral" | "success" | "danger";
  loading?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const TONES: Record<string, string> = {
    neutral: "text-secondary hover:bg-secondary/10",
    success: "text-emerald-600 hover:bg-emerald-50",
    danger: "text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={loading}
      className={`focus-ring press flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-[var(--dur-fast)] disabled:pointer-events-none disabled:opacity-50 ${TONES[tone]}`}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : children}
    </button>
  );
}

/** Edit form for one imported student — a compact version of the same fields the bulk upload
 * itself collects, opened from the student table's "Edit" action. */
function EditStudentModal({
  student,
  onClose,
  onSave,
}: {
  student: InstituteStudent;
  onClose: () => void;
  onSave: (payload: InstituteStudentUpdatePayload) => Promise<string | null>;
}) {
  const [name, setName] = useState(student.name ?? "");
  const [grade, setGrade] = useState(student.grade ?? "");
  const [gender, setGender] = useState(student.gender ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(student.date_of_birth ?? "");
  const [school, setSchool] = useState(student.school ?? "");
  const [schoolAddress, setSchoolAddress] = useState(student.school_address ?? "");
  const [email, setEmail] = useState(student.email ?? "");
  const [phone, setPhone] = useState(student.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const message = await onSave({
      name, grade, gender, date_of_birth: dateOfBirth || null, school, school_address: schoolAddress, email, phone,
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <Modal title="Edit student" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Student name" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Date of birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          <TextField label="Grade" value={grade} onChange={(e) => setGrade(e.target.value)} />
          <SelectField label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value || "blank"} value={option.value}>{option.label}</option>
            ))}
          </SelectField>
          <TextField label="School name" value={school} onChange={(e) => setSchool(e.target.value)} />
          <TextField label="School address" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} />
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave} type="button">Save changes</Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * `/institute/dashboard` — the school/institute bulk-booking portal's main screen: pick an
 * event + ticket type, download the Excel template, upload it filled in, and manage the
 * resulting per-student bookings (edit/remove/mark paid). See lib/api.ts's institute functions
 * and the backend's apps.registration.views.institute.
 */
export default function InstituteDashboard() {
  const router = useRouter();
  const { session, expired, withAuth, logout } = useInstituteSession();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [ticketTypesLoading, setTicketTypesLoading] = useState(false);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>("");

  const [students, setStudents] = useState<InstituteStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);

  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<InstituteBulkUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingStudent, setEditingStudent] = useState<InstituteStudent | null>(null);
  const [busyStudentId, setBusyStudentId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [registrations, setRegistrations] = useState<RegistrationHistoryItem[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);

  // Published events + this institute's overall booking history load once, independent of
  // whichever event/ticket type is currently selected for the bulk-upload panel below. Also
  // where the "not logged in at all" redirect happens: `session` is `undefined` while
  // useInstituteSession is still reading localStorage (nothing to do yet) and `null` once it's
  // confirmed there's no session — only the latter should send the visitor to `/institute/login`.
  useEffect(() => {
    if (session === null) {
      router.replace("/institute/login");
      return;
    }
    if (!session) return;
    let cancelled = false;
    listPublishedEvents().then((data) => {
      if (!cancelled) {
        setEvents(data);
        setEventsLoading(false);
      }
    });
    withAuth<RegistrationHistoryItem[]>((token) => getMyRegistrations(token)).then((result) => {
      if (cancelled) return;
      if (result.ok) setRegistrations(result.data);
      setRegistrationsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [session, withAuth, router]);

  // Ticket types for whichever event is selected — the reset when the event *changes* lives in
  // handleEventChange below (a direct response to that action), not here, so this effect only
  // ever does the one thing it's actually synchronizing: fetching for the current selection.
  // `async function` (matching BookingDashboard's own `load`), not a plain `.then()` chain: every
  // setState below only runs after its own `await`, never synchronously inside the effect body.
  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function load() {
      setTicketTypesLoading(true);
      const data = await getEventTicketTypes(selectedEventId);
      if (cancelled) return;
      setTicketTypes(data);
      setTicketTypesLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedEventId]);

  // Bumped to re-run the effect below on demand (after a successful upload) without calling a
  // setState-performing function directly from inside an effect — the effect's own nested `load`
  // (declared inline, like the ticket-types effect above) is what actually fetches.
  const [studentsRefreshKey, setStudentsRefreshKey] = useState(0);

  useEffect(() => {
    if (!selectedEventId) return;
    let cancelled = false;
    async function load() {
      setStudentsLoading(true);
      setStudentsError(null);
      const result = await withAuth<InstituteStudent[]>((token) =>
        getInstituteStudents(selectedEventId, token, selectedTicketTypeId || undefined),
      );
      if (cancelled) return;
      if (result.ok) setStudents(result.data);
      else setStudentsError(result.message);
      setStudentsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, selectedTicketTypeId, studentsRefreshKey]);

  function handleEventChange(id: string) {
    setSelectedEventId(id);
    setSelectedTicketTypeId("");
    setTicketTypes([]);
    setStudents([]);
    setUploadResult(null);
    setUploadError(null);
  }

  function handleTicketTypeChange(id: string) {
    setSelectedTicketTypeId(id);
    setUploadResult(null);
    setUploadError(null);
  }

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    const blob = await withAuth(async (token) => {
      const file = await downloadInstituteBulkTemplate(token);
      return file ? { ok: true as const, data: file } : { ok: false as const, status: null, message: "Download failed." };
    });
    setDownloadingTemplate(false);
    if (!blob.ok) return;
    const url = URL.createObjectURL(blob.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk-registration-template.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleUpload() {
    if (!uploadFile || !selectedEventId || !selectedTicketTypeId) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    const result = await withAuth((token) => uploadInstituteBulk(selectedEventId, selectedTicketTypeId, uploadFile, token));
    setUploading(false);
    if (!result.ok) {
      setUploadError(result.message);
      return;
    }
    setUploadResult(result.data);
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (result.data.created > 0) setStudentsRefreshKey((key) => key + 1);
  }

  async function handleSaveEdit(payload: InstituteStudentUpdatePayload): Promise<string | null> {
    if (!editingStudent) return null;
    const result = await withAuth((token) => updateInstituteStudent(editingStudent.id, payload, token));
    if (!result.ok) return result.message;
    setStudents((current) => current.map((row) => (row.id === editingStudent.id ? result.data : row)));
    setEditingStudent(null);
    return null;
  }

  async function handleRemove(student: InstituteStudent) {
    if (!confirm(`Remove ${student.name ?? "this student"} from the list? This releases their ticket.`)) return;
    setBusyStudentId(student.id);
    setRowError(null);
    const result = await withAuth((token) => removeInstituteStudent(student.id, token));
    setBusyStudentId(null);
    if (!result.ok) {
      setRowError(result.message);
      return;
    }
    setStudents((current) => current.filter((row) => row.id !== student.id));
  }

  async function handleMarkPaid(student: InstituteStudent) {
    setBusyStudentId(student.id);
    setRowError(null);
    const result = await withAuth((token) => markInstituteStudentPaid(student.id, token));
    setBusyStudentId(null);
    if (!result.ok) {
      setRowError(result.message);
      return;
    }
    setStudents((current) => current.map((row) => (row.id === student.id ? result.data : row)));
  }

  function handleLogout() {
    logout();
    router.replace("/institute/login");
  }

  if (!session) {
    return (
      <AccountShell eyebrow="Institute portal" title="Loading your account…" maxWidth="max-w-6xl">
        <ListSkeleton rows={3} label="Loading your account" />
      </AccountShell>
    );
  }

  if (expired) {
    return (
      <AccountShell eyebrow="Institute portal" title="Your session has expired" maxWidth="max-w-6xl">
        <p className="text-sm text-muted">Please log in again to get back to your dashboard.</p>
        <Button onClick={() => { clearSession("institute"); router.replace("/institute/login"); }}>
          Log in again
        </Button>
      </AccountShell>
    );
  }

  const readyToUpload = Boolean(selectedEventId && selectedTicketTypeId && uploadFile);

  return (
    <AccountShell
      eyebrow="Institute portal"
      title={`Welcome, ${session.user.full_name}`}
      description="Bulk-register students for an event: pick a ticket, upload your student sheet, and manage the list."
      maxWidth="max-w-6xl"
    >
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleLogout}>Log out</Button>
      </div>

      {/* Step 1 — pick where this batch is booking into. */}
      <section className="glass-panel flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-primary">1. Choose event &amp; ticket</h2>
        {eventsLoading ? (
          <ListSkeleton rows={1} label="Loading events" />
        ) : events.length === 0 ? (
          <EmptyState title="No published events yet" description="Check back once an event is open for registration." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Event"
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              placeholder="Select an event"
            >
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>{event.title}</option>
              ))}
            </SelectField>
            <SelectField
              label="Ticket / competition"
              value={selectedTicketTypeId}
              onChange={(e) => handleTicketTypeChange(e.target.value)}
              placeholder={ticketTypesLoading ? "Loading…" : "Select a ticket"}
              disabled={!selectedEventId || ticketTypesLoading}
            >
              {ticketTypes.map((ticket) => (
                <option key={ticket.id} value={String(ticket.id)}>
                  {ticket.name}
                  {ticket.price && Number(ticket.price) > 0 ? ` — ₹${ticket.price}` : " — Free"}
                </option>
              ))}
            </SelectField>
          </div>
        )}
      </section>

      {/* Step 2 — the Excel round trip. */}
      <section className="glass-panel flex flex-col gap-5 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-primary">2. Download, fill, and upload the student sheet</h2>
        <p className="text-sm leading-relaxed text-muted">
          Download the sample sheet, fill in one row per student, and upload it back. Uploading an updated sheet later
          only adds new students — anyone already on the list (matched by name + date of birth) is skipped automatically.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" icon={<DownloadIcon />} loading={downloadingTemplate} onClick={handleDownloadTemplate}>
            Download sample sheet
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Filled sheet (.xlsx)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              disabled={!selectedEventId || !selectedTicketTypeId}
              className="text-sm text-foreground file:mr-4 file:rounded-full file:border-0 file:bg-secondary/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-secondary hover:file:bg-secondary/15 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {!selectedEventId || !selectedTicketTypeId ? (
              <span className="text-xs text-muted">Choose an event and ticket above first.</span>
            ) : null}
          </div>
          <Button icon={<UploadIcon />} loading={uploading} disabled={!readyToUpload} onClick={handleUpload} className="shrink-0">
            Upload students
          </Button>
        </div>

        {uploadError && <Alert tone="error" emphasize>{uploadError}</Alert>}

        {uploadResult && (
          <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-white/60 p-5">
            <div className="flex flex-wrap gap-3">
              <Badge tone="success">{uploadResult.created} added</Badge>
              {uploadResult.skipped_duplicates > 0 && (
                <Badge tone="neutral">{uploadResult.skipped_duplicates} already on the list</Badge>
              )}
              {uploadResult.errors.length > 0 && <Badge tone="danger">{uploadResult.errors.length} rows had a problem</Badge>}
            </div>
            {uploadResult.errors.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-muted">
                {uploadResult.errors.map((rowError, index) => (
                  <li key={index}>
                    Row {rowError.row}: {rowError.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Step 3 — manage the imported list. */}
      {selectedEventId && selectedTicketTypeId && (
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-lg font-bold text-primary">3. Registered students</h2>
          {rowError && <Alert tone="error" emphasize>{rowError}</Alert>}
          {studentsLoading ? (
            <ListSkeleton rows={4} label="Loading students" />
          ) : studentsError ? (
            <Alert tone="error">{studentsError}</Alert>
          ) : students.length === 0 ? (
            <EmptyState title="No students yet" description="Upload a filled sheet above to add your first batch." />
          ) : (
            <Table>
              <Thead columns={["Student", "Grade", "Gender", "Date of birth", "School", "Payment", "Actions"]} />
              <tbody>
                {students.map((student) => (
                  <Tr key={student.id}>
                    <Td className="font-semibold text-primary">{student.name ?? "—"}</Td>
                    <Td>{student.grade || "—"}</Td>
                    <Td>{formatGender(student.gender) ?? "—"}</Td>
                    <Td>{formatDate(student.date_of_birth) ?? "—"}</Td>
                    <Td className="text-xs text-muted">{student.school || "—"}</Td>
                    <Td>
                      <Badge tone={student.paid ? "success" : "warning"}>{student.paid ? "Paid" : "Pending"}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      <div className="flex flex-nowrap items-center gap-1">
                        <RowActionButton label="Edit student" onClick={() => setEditingStudent(student)}>
                          <EditIcon />
                        </RowActionButton>
                        {!student.paid && (
                          <RowActionButton
                            label="Mark paid"
                            tone="success"
                            loading={busyStudentId === student.id}
                            onClick={() => handleMarkPaid(student)}
                          >
                            <CheckCircleIcon />
                          </RowActionButton>
                        )}
                        <RowActionButton
                          label="Remove student"
                          tone="danger"
                          loading={busyStudentId === student.id}
                          onClick={() => handleRemove(student)}
                        >
                          <TrashIcon />
                        </RowActionButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </section>
      )}

      {/* "Common stuff" — this institute's overall booking history, across every event. */}
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-lg font-bold text-primary">Your bookings</h2>
        {registrationsLoading ? (
          <ListSkeleton rows={2} label="Loading bookings" />
        ) : registrations.length === 0 ? (
          <EmptyState title="No bookings yet" description="Bookings you make from this portal will show up here." />
        ) : (
          <Table>
            <Thead columns={["Event", "Reference", "Status", "Attendees", "Booked on"]} />
            <tbody>
              {registrations.map((registration) => (
                <Tr key={registration.id}>
                  <Td className="font-semibold text-primary">{registration.event_detail.title}</Td>
                  <Td className="text-xs text-muted">{registration.booking_reference ?? "—"}</Td>
                  <Td>
                    <Badge tone={registration.status === "confirmed" ? "success" : registration.status === "cancelled" ? "danger" : "warning"}>
                      {registration.status.replace(/_/g, " ")}
                    </Badge>
                  </Td>
                  <Td>{registration.attendees.length}</Td>
                  <Td className="text-xs text-muted">{formatDate(registration.created_at) ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {editingStudent && (
        <EditStudentModal student={editingStudent} onClose={() => setEditingStudent(null)} onSave={handleSaveEdit} />
      )}
    </AccountShell>
  );
}
