"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event, Sponsor } from "@/lib/types";
import { createSponsor, createSponsorMultipart, deleteSponsor, listSponsors, type SponsorPayload } from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader } from "../ui";
import GlobalMediaPickerModal from "../GlobalMediaPicker";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Field";
import EmptyState, { HandshakeIcon } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/** Sponsor/exhibitor roster (apps/events). Logo can come from a file upload or an
 * already-hosted URL, same either/or pattern as speaker photos and the event banner. */
export default function SponsorsSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listSponsors(token, event.id));
      if (cancelled) return;
      if (result.ok) {
        const data = result.data;
        setSponsors(Array.isArray(data) ? data : data.results ?? []);
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  async function handleDelete(sponsorId: number | string) {
    setDeletingId(sponsorId);
    const result = await withAuth((token) => deleteSponsor(token, event.id, sponsorId));
    setDeletingId(null);
    if (result.ok) setSponsors((current) => current.filter((s) => s.id !== sponsorId));
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Sponsors"
        description="Sponsors and exhibitors shown on the event's public page."
        action={<Button size="sm" onClick={() => setCreating(true)}>New sponsor</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={3} label="Loading sponsors" />
      ) : sponsors.length === 0 ? (
        <EmptyState icon={<HandshakeIcon />} title="No sponsors yet" description="Add a sponsor or exhibitor record." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="card flex items-center gap-4 rounded-2xl p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-primary/5">
                {sponsor.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- sponsor logos are R2 URLs on an arbitrary host.
                  <img src={sponsor.logo_url} alt={sponsor.name} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-boldonse text-sm uppercase text-primary">{sponsor.name.slice(0, 2)}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-primary">{sponsor.name}</p>
              </div>
              <Button size="sm" variant="ghost" loading={deletingId === sponsor.id} onClick={() => handleDelete(sponsor.id)} className="shrink-0 text-xs">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateSponsorModal
          eventId={event.id}
          withAuth={withAuth}
          onClose={() => setCreating(false)}
          onCreated={(sponsor) => {
            setSponsors((current) => [...current, sponsor]);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CreateSponsorModal({
  eventId,
  onClose,
  onCreated,
  withAuth,
}: {
  eventId: number | string;
  onClose: () => void;
  onCreated: (sponsor: Sponsor) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"sponsor" | "exhibitor">("sponsor");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pickingLogo, setPickingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: SponsorPayload = { name, type, website_url: websiteUrl || undefined };
    const result = logoFile
      ? await withAuth((token) => createSponsorMultipart(token, eventId, payload, logoFile))
      : await withAuth((token) => createSponsor(token, eventId, { ...payload, logo_url: logoUrl || undefined }));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreated(result.data);
  }

  return (
    <Modal title="New sponsor" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Vega Robotics" />
        <SelectField label="Type" value={type} onChange={(event) => setType(event.target.value as "sponsor" | "exhibitor")}>
          <option value="sponsor">Sponsor</option>
          <option value="exhibitor">Exhibitor</option>
        </SelectField>
        <TextField label="Website" type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://vegarobotics.com" />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Logo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setLogoFile(event.target.files?.[0] ?? null);
              if (event.target.files?.[0]) setLogoUrl("");
            }}
            className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setPickingLogo(true)} className="w-fit">
            Choose from media library
          </Button>
          {!logoFile && (
            <TextField label="or logo URL" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://cdn.otomatiks.com/sponsors/vega.png" />
          )}
        </div>

        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Add sponsor
        </Button>
      </form>

      {pickingLogo && (
        <GlobalMediaPickerModal
          withAuth={withAuth}
          mode="single"
          title="Choose logo from media library"
          onClose={() => setPickingLogo(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setLogoUrl(items[0].url);
              setLogoFile(null);
            }
          }}
        />
      )}
    </Modal>
  );
}
