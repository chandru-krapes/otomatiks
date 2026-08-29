"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Event } from "@/lib/types";
import {
  createEvent,
  createEventMultipart,
  deleteEvent,
  duplicateEvent,
  publishEvent,
  updateEvent,
  updateEventMultipart,
  type EventCreatePayload,
} from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader, Table, Td, Thead, toLocalInput, Tr } from "../ui";
import MediaPickerModal from "../MediaPicker";
import GlobalMediaPickerModal from "../GlobalMediaPicker";
import DateTimePicker from "@/components/ui/DateTimePicker";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextField, TextareaField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

const STATUS_TONE: Record<string, "success" | "neutral" | "danger"> = {
  published: "success",
  draft: "neutral",
  cancelled: "danger",
};

/**
 * Every event this staff member can see (drafts included), with create,
 * edit, publish and duplicate actions. Selecting a row is how the rest of
 * the console picks its "current event" — this is the only section that
 * isn't itself scoped to one.
 */
export default function EventsSection({
  events,
  onEventsChanged,
  onSelect,
  withAuth,
}: {
  events: Event[];
  onEventsChanged: () => void;
  onSelect: (eventId: number | string) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [busyId, setBusyId] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => event.title.toLowerCase().includes(q) || event.slug.toLowerCase().includes(q));
  }, [events, search]);

  async function handlePublish(eventId: number | string) {
    setBusyId(eventId);
    setError(null);
    const result = await withAuth((token) => publishEvent(token, eventId));
    setBusyId(null);
    if (!result.ok) setError(result.message);
    else onEventsChanged();
  }

  async function handleDuplicate(eventId: number | string) {
    setBusyId(eventId);
    setError(null);
    const result = await withAuth((token) => duplicateEvent(token, eventId));
    setBusyId(null);
    if (!result.ok) setError(result.message);
    else onEventsChanged();
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Events"
        description="Every event you organize or administer, drafts included."
        action={
          <Button size="sm" onClick={() => setCreating(true)} icon={<PlusIcon />}>
            New event
          </Button>
        }
      />

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by title or slug…"
        className="w-full max-w-sm rounded-xl border border-primary/15 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/12"
      />

      {error && <Alert tone="error">{error}</Alert>}

      {filtered.length === 0 ? (
        <EmptyState title="No events found" description="Create your first event, or adjust your search." />
      ) : (
        <Table>
          <Thead columns={["Event", "Status", "Dates", "Venue", ""]} />
          <tbody>
            {filtered.map((event) => (
              <Tr key={event.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-hairline bg-primary/5">
                      {event.banner_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- event banners are R2 URLs on an arbitrary host.
                        <img src={event.banner_url} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <button type="button" onClick={() => onSelect(event.id)} className="focus-ring rounded text-left font-semibold text-primary hover:text-secondary">
                        {event.title}
                      </button>
                      <p className="text-xs text-muted">/{event.slug}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[event.status] ?? "neutral"}>{event.status}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-xs text-muted">{formatDate(event.start_date) ?? "TBD"}</Td>
                <Td className="text-xs text-muted">{event.venue_name ?? "—"}</Td>
                <Td>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(event)}>
                      Edit
                    </Button>
                    {event.status !== "published" && (
                      <Button size="sm" variant="secondary" loading={busyId === event.id} onClick={() => handlePublish(event.id)}>
                        Publish
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" loading={busyId === event.id} onClick={() => handleDuplicate(event.id)}>
                      Duplicate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(event)} className="text-red-600 hover:bg-red-50">
                      Delete
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {creating && (
        <EventFormModal
          withAuth={withAuth}
          onClose={() => setCreating(false)}
          onSaved={(newEvent) => {
            setCreating(false);
            onEventsChanged();
            onSelect(newEvent.id);
          }}
        />
      )}

      {editing && (
        <EventFormModal
          event={editing}
          withAuth={withAuth}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onEventsChanged();
          }}
        />
      )}

      {deleting && (
        <DeleteEventModal
          event={deleting}
          withAuth={withAuth}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            onEventsChanged();
          }}
        />
      )}
    </div>
  );
}

/**
 * Deleting an event is destructive and, unlike everything else in this table, can't be undone
 * from here (there's no "restore" the way a cancelled registration or a paused ticket type
 * can be flipped back) — so it gets its own confirm step instead of firing straight off the
 * row's button, and asks the admin to type the event's title back to confirm rather than a
 * bare "are you sure?", the same friction a bare `DELETE` on a live event deserves.
 */
function DeleteEventModal({
  event,
  onClose,
  onDeleted,
  withAuth,
}: {
  event: Event;
  onClose: () => void;
  onDeleted: () => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canDelete = confirmText.trim() === event.title;

  async function handleDelete() {
    if (!canDelete) return;
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) => deleteEvent(token, event.id));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onDeleted();
  }

  return (
    <Modal title="Delete event" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Alert tone="error">
          This permanently deletes <span className="font-semibold">{event.title}</span> — its ticket types, registrations, promo codes,
          gallery, speakers, and sponsors go with it. This cannot be undone.
        </Alert>
        <TextField
          label={`Type "${event.title}" to confirm`}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={event.title}
          autoComplete="off"
        />
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            disabled={!canDelete}
            onClick={handleDelete}
            className="!bg-red-600 !shadow-none hover:!bg-red-700"
          >
            Delete event
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/**
 * Create/edit event form, shared by both flows — the field set and the
 * file-vs-URL banner choice are identical, only the submit call and initial
 * values differ. `banner_image` is the event's one "primary media" slot
 * (as opposed to the many-item gallery under Media library): a file upload
 * takes priority over a pasted URL when both are given.
 */
function EventFormModal({
  event,
  onClose,
  onSaved,
  withAuth,
}: {
  event?: Event;
  onClose: () => void;
  onSaved: (event: Event) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const isEditing = Boolean(event);
  const [title, setTitle] = useState(event?.title ?? "");
  const [shortDescription, setShortDescription] = useState(event?.short_description ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [venueName, setVenueName] = useState(event?.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(event?.venue_address ?? "");
  const [contactEmail, setContactEmail] = useState(event?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(event?.contact_phone ?? "");
  const [startDate, setStartDate] = useState(toLocalInput(event?.start_date));
  const [endDate, setEndDate] = useState(toLocalInput(event?.end_date));
  const [bannerUrl, setBannerUrl] = useState(event?.banner_url ?? "");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [pickingBanner, setPickingBanner] = useState(false);
  const [pickingBannerFromLibrary, setPickingBannerFromLibrary] = useState(false);
  const [aboutImageUrl, setAboutImageUrl] = useState(event?.about_image_url ?? "");
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  const [pickingAboutImage, setPickingAboutImage] = useState(false);
  const [pickingAboutImageFromLibrary, setPickingAboutImageFromLibrary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: Partial<EventCreatePayload> = {
      title,
      short_description: shortDescription || undefined,
      description: description || undefined,
      status: isEditing ? undefined : "draft",
      venue_name: venueName || undefined,
      venue_address: venueAddress || undefined,
      contact_email: contactEmail || undefined,
      contact_phone: contactPhone || undefined,
      start_date: startDate ? new Date(startDate).toISOString() : undefined,
      end_date: endDate ? new Date(endDate).toISOString() : undefined,
      banner_url: !bannerFile && bannerUrl ? bannerUrl : undefined,
      about_image_url: !aboutImageFile && aboutImageUrl ? aboutImageUrl : undefined,
    };

    // `banner_image` and `about_image` can be sent together in one multipart request — each
    // uploads to its own R2 folder — so either file present routes through the multipart call.
    const result = bannerFile || aboutImageFile
      ? isEditing
        ? await withAuth((token) => updateEventMultipart(token, event!.id, payload, bannerFile, aboutImageFile))
        : await withAuth((token) => createEventMultipart(token, payload as EventCreatePayload, bannerFile, aboutImageFile))
      : isEditing
        ? await withAuth((token) => updateEvent(token, event!.id, payload))
        : await withAuth((token) => createEvent(token, payload as EventCreatePayload));

    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSaved(result.data);
  }

  return (
    <Modal title={isEditing ? `Edit “${event!.title}”` : "New event"} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Robotica 2026" />
        <TextField
          label="Short description"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="A national robotics championship for students."
          hint="One line — used in cards and listings."
        />
        <TextareaField
          label="Long description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="The full 'about this event' copy…"
          hint="Shown in the event's About section."
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Primary media (banner)</span>
          <p className="text-xs text-muted">The event&rsquo;s single hero image — separate from the many-item gallery under Media library.</p>
          {bannerUrl && !bannerFile && (
            // eslint-disable-next-line @next/next/no-img-element -- event banner is an R2 URL on an arbitrary host.
            <img src={bannerUrl} alt="Current banner" className="h-28 w-full rounded-xl object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setBannerFile(e.target.files?.[0] ?? null);
              if (e.target.files?.[0]) setBannerUrl("");
            }}
            className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
          <div className="flex flex-wrap gap-2">
            {isEditing && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setPickingBanner(true)} className="w-fit">
                Choose from this event&rsquo;s gallery
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={() => setPickingBannerFromLibrary(true)} className="w-fit">
              Browse media library
            </Button>
          </div>
          {!bannerFile && (
            <TextField label="or banner URL" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://cdn.otomatiks.com/event_banners/robotica.jpg" />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Secondary image (Why join event)</span>
          <p className="text-xs text-muted">Shown alongside the copy in the public site&rsquo;s &ldquo;Why join event&rdquo; section — separate from the banner above.</p>
          {aboutImageUrl && !aboutImageFile && (
            // eslint-disable-next-line @next/next/no-img-element -- event about image is an R2 URL on an arbitrary host.
            <img src={aboutImageUrl} alt="Current secondary image" className="h-28 w-full rounded-xl object-cover" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setAboutImageFile(e.target.files?.[0] ?? null);
              if (e.target.files?.[0]) setAboutImageUrl("");
            }}
            className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
          <div className="flex flex-wrap gap-2">
            {isEditing && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setPickingAboutImage(true)} className="w-fit">
                Choose from this event&rsquo;s gallery
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={() => setPickingAboutImageFromLibrary(true)} className="w-fit">
              Browse media library
            </Button>
          </div>
          {!aboutImageFile && (
            <TextField
              label="or image URL"
              value={aboutImageUrl}
              onChange={(e) => setAboutImageUrl(e.target.value)}
              placeholder="https://cdn.otomatiks.com/event_about/robotica-about.jpg"
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Venue name" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="Expo Hall 3" />
          <TextField label="Venue address" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} placeholder="MG Road, Bengaluru" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Contact email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="team@robotica.dev" />
          <TextField label="Contact phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 90000 00000" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateTimePicker label="Start date" value={startDate} onChange={setStartDate} />
          <DateTimePicker label="End date" value={endDate} onChange={setEndDate} />
        </div>

        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          {isEditing ? "Save changes" : "Create event"}
        </Button>
      </form>

      {pickingBanner && event && (
        <MediaPickerModal
          eventId={event.id}
          withAuth={withAuth}
          mode="single"
          title="Choose banner from this event’s gallery"
          onClose={() => setPickingBanner(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setBannerUrl(items[0].media_url);
              setBannerFile(null);
            }
            setPickingBanner(false);
          }}
        />
      )}

      {pickingBannerFromLibrary && (
        <GlobalMediaPickerModal
          withAuth={withAuth}
          mode="single"
          title="Choose banner from media library"
          onClose={() => setPickingBannerFromLibrary(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setBannerUrl(items[0].url);
              setBannerFile(null);
            }
          }}
        />
      )}

      {pickingAboutImage && event && (
        <MediaPickerModal
          eventId={event.id}
          withAuth={withAuth}
          mode="single"
          title="Choose secondary image from this event’s gallery"
          onClose={() => setPickingAboutImage(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setAboutImageUrl(items[0].media_url);
              setAboutImageFile(null);
            }
            setPickingAboutImage(false);
          }}
        />
      )}

      {pickingAboutImageFromLibrary && (
        <GlobalMediaPickerModal
          withAuth={withAuth}
          mode="single"
          title="Choose secondary image from media library"
          onClose={() => setPickingAboutImageFromLibrary(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setAboutImageUrl(items[0].url);
              setAboutImageFile(null);
            }
          }}
        />
      )}
    </Modal>
  );
}
