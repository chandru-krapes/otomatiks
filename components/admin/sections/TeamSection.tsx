"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import { inviteMembership, listMemberships, removeMembership } from "@/lib/adminApi";
import type { Membership, MembershipRole } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader, Table, Td, Thead, Tr } from "../ui";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/** Organizer/volunteer memberships for the selected event (apps/accounts). */
export default function TeamSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("volunteer");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await withAuth<Membership[]>((token) =>
        listMemberships(token, event.id).then((data) => ({ ok: true as const, data })),
      );
      if (cancelled) return;
      if (result.ok) setMemberships(result.data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  async function handleInvite(formEvent: FormEvent) {
    formEvent.preventDefault();
    setInviting(true);
    setError(null);
    const result = await withAuth((token) => inviteMembership(token, event.id, email, role));
    setInviting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMemberships((current) => [...current, result.data]);
    setEmail("");
  }

  async function handleRemove(membershipId: number) {
    setRemovingId(membershipId);
    const result = await withAuth((token) => removeMembership(token, event.id, membershipId));
    setRemovingId(null);
    if (result.ok) setMemberships((current) => current.filter((m) => m.id !== membershipId));
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Team" description="Organizers and volunteers with access to this event." />

      <form onSubmit={handleInvite} className="card flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-end">
        <TextField
          label="Invite by email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="volunteer@gmail.com"
          fieldClassName="flex-1"
        />
        <SelectField label="Role" value={role} onChange={(event) => setRole(event.target.value as MembershipRole)} fieldClassName="sm:w-44">
          <option value="volunteer">Volunteer</option>
          <option value="organizer">Organizer</option>
        </SelectField>
        <Button type="submit" loading={inviting} className="shrink-0">Invite</Button>
      </form>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={3} label="Loading team" />
      ) : memberships.length === 0 ? (
        <EmptyState title="No staff invited yet" description="Invite organizers or volunteers with the form above." />
      ) : (
        <Table>
          <Thead columns={["Name", "Email", "Role", ""]} />
          <tbody>
            {memberships.map((membership) => (
              <Tr key={membership.id}>
                <Td className="font-semibold text-primary">{membership.user.full_name || "—"}</Td>
                <Td className="text-xs text-muted">{membership.user.email}</Td>
                <Td>
                  <Badge tone={membership.role === "organizer" ? "brand" : "neutral"}>{membership.role}</Badge>
                </Td>
                <Td>
                  <Button size="sm" variant="ghost" loading={removingId === membership.id} onClick={() => handleRemove(membership.id)}>
                    Remove
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
