"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { approveSchool, createSchool, listSchools } from "@/lib/adminApi";
import type { SchoolAccount } from "@/lib/adminTypes";
import { isValidEmail } from "@/lib/format";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader, Table, Td, Thead, Tr } from "../ui";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/**
 * Admin-only "Schools" section (flow.pdf "School registers": "There is no 'School' option in
 * public signup. The school contacts us, our team verifies them, and the account is created from
 * the admin panel."). Creating one here is step one of onboarding a school/institute onto the
 * bulk-booking portal at `/institute` — approving it is what actually lets it log in there (see
 * apps.accounts.services.schools.approve_school_account: passwordless email-OTP, not a password
 * invite).
 */
export default function SchoolsSection({ withAuth }: { withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [schools, setSchools] = useState<SchoolAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      const result = await withAuth<SchoolAccount[]>((token) => listSchools(token));
      if (cancelled) return;
      if (result.ok) setSchools(result.data);
      else setLoadError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; withAuth is stable per session.
  }, []);

  async function handleCreate(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(null);
    setCreating(true);
    setCreateError(null);
    const result = await withAuth((token) => createSchool(token, { email: email.trim(), full_name: fullName.trim(), phone: phone.trim() }));
    setCreating(false);
    if (!result.ok) {
      setCreateError(result.message);
      return;
    }
    setSchools((current) => [result.data, ...current]);
    setEmail("");
    setFullName("");
    setPhone("");
  }

  async function handleApprove(schoolId: number) {
    setApprovingId(schoolId);
    setRowError(null);
    const result = await withAuth((token) => approveSchool(token, schoolId));
    setApprovingId(null);
    if (!result.ok) {
      setRowError(result.message);
      return;
    }
    setSchools((current) => current.map((school) => (school.id === schoolId ? result.data : school)));
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Schools"
        description="Onboard schools/training institutes for the bulk-booking portal at /institute — create the account, then approve it once you've verified them."
      />

      <form onSubmit={handleCreate} className="card flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-end sm:flex-wrap">
        <TextField
          label="School email"
          required
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError(null);
          }}
          onBlur={() => {
            if (email.trim() && !isValidEmail(email)) setEmailError("Enter a valid email address.");
          }}
          error={emailError ?? undefined}
          placeholder="coordinator@school.edu"
          fieldClassName="min-w-[14rem] flex-1"
        />
        <TextField
          label="School / institute name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="DAV Public School"
          fieldClassName="min-w-[14rem] flex-1"
        />
        <TextField
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91 90000 00000"
          fieldClassName="min-w-[12rem]"
        />
        <Button type="submit" loading={creating} className="shrink-0">Create account</Button>
      </form>

      {createError && <Alert tone="error">{createError}</Alert>}
      {rowError && <Alert tone="error">{rowError}</Alert>}

      {loading ? (
        <ListSkeleton rows={3} label="Loading schools" />
      ) : loadError ? (
        <Alert tone="error">{loadError}</Alert>
      ) : schools.length === 0 ? (
        <EmptyState title="No schools onboarded yet" description="Create one with the form above to get started." />
      ) : (
        <Table>
          <Thead columns={["School", "Email", "Phone", "Status", ""]} />
          <tbody>
            {schools.map((school) => (
              <Tr key={school.id}>
                <Td className="font-semibold text-primary">{school.full_name || "—"}</Td>
                <Td className="text-xs text-muted">{school.email}</Td>
                <Td className="text-xs text-muted">{school.phone || "—"}</Td>
                <Td>
                  <Badge tone={school.account_status === "approved" ? "success" : "warning"}>
                    {school.account_status}
                  </Badge>
                </Td>
                <Td>
                  {school.account_status === "pending" && (
                    <Button size="sm" variant="ghost" loading={approvingId === school.id} onClick={() => handleApprove(school.id)}>
                      Approve
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Alert tone="info">
        Once approved, a school logs in at <strong>/institute/login</strong> with this same email — no password, just a
        one-time code, exactly like a parent&rsquo;s booking account.
      </Alert>
    </div>
  );
}
