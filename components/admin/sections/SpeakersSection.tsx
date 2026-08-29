"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event, Speaker } from "@/lib/types";
import { createSpeaker, createSpeakerMultipart, deleteSpeaker, listSpeakers, type SpeakerPayload } from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader } from "../ui";
import GlobalMediaPickerModal from "../GlobalMediaPicker";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextareaField, TextField } from "@/components/ui/Field";
import EmptyState, { PeopleIcon } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/** Speaker roster (apps/events) — staff-only list; speakers surface publicly through the
 * event's own nested serializer rather than this endpoint. Photo can come from a file upload
 * or an already-hosted URL, same either/or pattern as sponsor logos and the event banner. */
export default function SpeakersSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listSpeakers(token, event.id));
      if (cancelled) return;
      if (result.ok) {
        const data = result.data;
        setSpeakers(Array.isArray(data) ? data : data.results ?? []);
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

  async function handleDelete(speakerId: number | string) {
    setDeletingId(speakerId);
    const result = await withAuth((token) => deleteSpeaker(token, event.id, speakerId));
    setDeletingId(null);
    if (result.ok) setSpeakers((current) => current.filter((s) => s.id !== speakerId));
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Speakers"
        description="The speaker lineup shown on the event's public page."
        action={<Button size="sm" onClick={() => setCreating(true)}>New speaker</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={3} label="Loading speakers" />
      ) : speakers.length === 0 ? (
        <EmptyState icon={<PeopleIcon />} title="No speakers yet" description="Add a speaker to build out the lineup." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {speakers.map((speaker) => (
            <div key={speaker.id} className="card flex items-start gap-4 rounded-2xl p-5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-hairline bg-primary/5">
                {speaker.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- speaker photos are R2 URLs on an arbitrary host.
                  <img src={speaker.photo_url} alt={speaker.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-boldonse text-sm uppercase text-primary">{speaker.name.slice(0, 2)}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-primary">{speaker.name}</p>
                {speaker.designation && <p className="truncate text-xs text-secondary">{speaker.designation}</p>}
                {speaker.bio && <p className="mt-1.5 line-clamp-2 text-xs text-muted">{speaker.bio}</p>}
              </div>
              <Button size="sm" variant="ghost" loading={deletingId === speaker.id} onClick={() => handleDelete(speaker.id)} className="shrink-0 text-xs">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateSpeakerModal
          eventId={event.id}
          withAuth={withAuth}
          onClose={() => setCreating(false)}
          onCreated={(speaker) => {
            setSpeakers((current) => [...current, speaker]);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

function CreateSpeakerModal({
  eventId,
  onClose,
  onCreated,
  withAuth,
}: {
  eventId: number | string;
  onClose: () => void;
  onCreated: (speaker: Speaker) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: SpeakerPayload = { name, designation: designation || undefined, bio: bio || undefined };
    const result = photoFile
      ? await withAuth((token) => createSpeakerMultipart(token, eventId, payload, photoFile))
      : await withAuth((token) => createSpeaker(token, eventId, { ...payload, photo_url: photoUrl || undefined }));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreated(result.data);
  }

  return (
    <Modal title="New speaker" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Dr. Meera Iyer" />
        <TextField label="Designation" value={designation} onChange={(event) => setDesignation(event.target.value)} placeholder="Keynote Speaker" />
        <TextareaField label="Bio" rows={3} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Robotics researcher, IIT Bombay." />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Photo</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setPhotoFile(event.target.files?.[0] ?? null);
              if (event.target.files?.[0]) setPhotoUrl("");
            }}
            className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setPickingPhoto(true)} className="w-fit">
            Choose from media library
          </Button>
          {!photoFile && (
            <TextField
              label="or photo URL"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://cdn.otomatiks.com/speakers/meera.jpg"
            />
          )}
        </div>

        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Add speaker
        </Button>
      </form>

      {pickingPhoto && (
        <GlobalMediaPickerModal
          withAuth={withAuth}
          mode="single"
          title="Choose photo from media library"
          onClose={() => setPickingPhoto(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setPhotoUrl(items[0].url);
              setPhotoFile(null);
            }
          }}
        />
      )}
    </Modal>
  );
}
