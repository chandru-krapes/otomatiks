"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { ApiResult } from "@/lib/api";
import type { Event, GalleryItem, TicketType } from "@/lib/types";
import {
  createPromoCode,
  createTicketGalleryFiles,
  createTicketGalleryFromUrls,
  createTicketType,
  deletePromoCode,
  deleteTicketGalleryItem,
  deleteTicketType,
  listPromoCodes,
  listTicketGallery,
  listTicketTypes,
  pauseTicketType,
  resumeTicketType,
  updatePromoCode,
  updateTicketType,
  type PromoCodeCreatePayload,
  type TicketTypeCreatePayload,
} from "@/lib/adminApi";
import type { PromoCode } from "@/lib/adminTypes";
import { formatDate } from "@/lib/format";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader, Table, Td, Thead, toLocalInput, Tr } from "../ui";
import { AddMediaModal } from "./GallerySection";
import MediaPickerModal from "../MediaPicker";
import DateTimePicker from "@/components/ui/DateTimePicker";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextareaField, TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function TicketsSection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [managingMedia, setManagingMedia] = useState<TicketType | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<TicketType | null>(null);
  const [deletingPromo, setDeletingPromo] = useState<PromoCode | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const [ticketsResult, promosResult] = await Promise.all([
        withAuth((token) => listTicketTypes(token, event.id)),
        withAuth<PromoCode[]>(async (token) => ({ ok: true as const, data: await listPromoCodes(token, event.id) })),
      ]);
      if (cancelled) return;
      if (ticketsResult.ok) {
        const data = ticketsResult.data;
        setTicketTypes(Array.isArray(data) ? data : data.results ?? []);
      } else {
        setError(ticketsResult.message);
      }
      if (promosResult.ok) setPromoCodes(promosResult.data);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  async function handleTogglePause(ticket: TicketType) {
    setBusyId(ticket.id);
    setError(null);
    const result = ticket.is_registration_paused
      ? await withAuth((token) => resumeTicketType(token, event.id, ticket.id))
      : await withAuth((token) => pauseTicketType(token, event.id, ticket.id));
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setTicketTypes((current) => current.map((t) => (t.id === ticket.id ? { ...t, ...result.data } : t)));
  }

  async function handleDeactivatePromo(promo: PromoCode) {
    setBusyId(promo.id);
    setError(null);
    const result = await withAuth((token) => updatePromoCode(token, event.id, promo.id, { is_active: false }));
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPromoCodes((current) => current.map((p) => (p.id === promo.id ? { ...p, ...result.data } : p)));
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Ticket types"
          description="Manage pricing, capacity and sale windows."
          action={<Button size="sm" onClick={() => setCreatingTicket(true)}>New ticket type</Button>}
        />

        {error && <Alert tone="error">{error}</Alert>}

        {loading ? (
          <ListSkeleton rows={3} label="Loading ticket types" />
        ) : ticketTypes.length === 0 ? (
          <EmptyState title="No ticket types yet" description="Create one to start selling." />
        ) : (
          <Table>
            <Thead columns={["Name", "Price", "Sold / Capacity", "Status", ""]} />
            <tbody>
              {ticketTypes.map((ticket) => (
                <Tr key={ticket.id}>
                  <Td>
                    <p className="font-semibold text-primary">{ticket.name}</p>
                    {ticket.short_description && <p className="text-xs text-muted">{ticket.short_description}</p>}
                  </Td>
                  <Td className="whitespace-nowrap">₹{ticket.price}</Td>
                  <Td className="whitespace-nowrap">{ticket.sold_count ?? 0} / {ticket.capacity ?? "∞"}</Td>
                  <Td className="whitespace-nowrap">
                    {ticket.is_registration_paused ? (
                      <Badge tone="warning">Paused</Badge>
                    ) : ticket.is_sold_out ? (
                      <Badge tone="danger">Sold out</Badge>
                    ) : (
                      <Badge tone="success">On sale</Badge>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {/* Every button gets the same fixed width, "Resume" (the longest label
                        this row ever shows) sized with room to spare — otherwise "Resume"
                        replacing "Pause" (one word longer) widens just that row's action
                        group, and since the group is right-aligned, every button in that row
                        shifts left relative to every other row's, breaking the column
                        alignment down the table. `flex-nowrap` plus the `<Td>`'s own
                        `whitespace-nowrap` keep the four actions on one line — letting the
                        group wrap left the last button stranded on its own row (the Table
                        wrapper already scrolls horizontally on a narrow screen instead, see
                        components/admin/ui.tsx). */}
                    <div className="flex flex-nowrap items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" className="w-20" onClick={() => setEditingTicket(ticket)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="w-20" onClick={() => setManagingMedia(ticket)}>
                        Media
                      </Button>
                      <Button size="sm" variant="ghost" className="w-20" loading={busyId === ticket.id} onClick={() => handleTogglePause(ticket)}>
                        {ticket.is_registration_paused ? "Resume" : "Pause"}
                      </Button>
                      <Button size="sm" variant="ghost" className="w-20 !text-red-600 hover:!bg-red-50" onClick={() => setDeletingTicket(ticket)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <SectionHeader
          title="Promo codes"
          description="Discount codes scoped to this event."
          action={<Button size="sm" onClick={() => setCreatingPromo(true)}>New promo code</Button>}
        />

        {promoCodes.length === 0 ? (
          <EmptyState title="No promo codes" description="Create a code to run a discount campaign." />
        ) : (
          <Table>
            <Thead columns={["Code", "Discount", "Used / Max", "Valid until", "Status", ""]} />
            <tbody>
              {promoCodes.map((promo) => {
                // `is_active` only flips to false once a backend Celery beat job notices
                // `valid_until` has passed (see PromoCode's own docstring in lib/adminTypes.ts) -
                // that job runs on its own schedule, not the instant the date rolls over, so a
                // just-expired code can still read `is_active: true` here for a while. Checking
                // `valid_until` directly means the admin table is never stuck showing "Active"
                // on a code that's already unusable at checkout.
                const isExpired = Boolean(promo.valid_until) && new Date(promo.valid_until!) < new Date();
                const isActive = promo.is_active !== false && !isExpired;
                return (
                  <Tr key={promo.id}>
                    <Td className="font-mono font-semibold text-primary">{promo.code}</Td>
                    <Td>{promo.discount_type === "percentage" ? `${promo.discount_value}%` : `₹${promo.discount_value}`}</Td>
                    <Td>{promo.used_count ?? 0} / {promo.max_uses ?? "∞"}</Td>
                    {/* `formatDate` (month spelled out), not the raw numeric `toLocaleDateString()`
                        this used to call — "10/2/2026" reads as either 2 October or 10 February
                        depending on the reader's own date-format habit, which is exactly the
                        kind of ambiguity that made an organizer misread a still-valid code as
                        expired months ago. */}
                    <Td className="whitespace-nowrap text-xs text-muted">{formatDate(promo.valid_until) ?? "—"}</Td>
                    <Td>
                      <Badge tone={isActive ? "success" : isExpired ? "warning" : "neutral"}>
                        {isActive ? "Active" : isExpired ? "Expired" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {/* Same fixed-width-per-slot fix as the ticket-type table above — here
                          "Deactivate" doesn't just vary in label length, it's absent entirely
                          once a code is inactive/expired, so an empty same-width placeholder
                          fills that slot instead of just omitting the button; otherwise Edit
                          and Delete slide left on every row that has no Deactivate button,
                          breaking the column alignment down the table. `flex-nowrap` plus the
                          `<Td>`'s own `whitespace-nowrap` keep all three actions on one line. */}
                      <div className="flex flex-nowrap items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" className="w-24" onClick={() => setEditingPromo(promo)}>
                          Edit
                        </Button>
                        {isActive ? (
                          <Button size="sm" variant="ghost" className="w-24" loading={busyId === promo.id} onClick={() => handleDeactivatePromo(promo)}>
                            Deactivate
                          </Button>
                        ) : (
                          <span className="w-24" aria-hidden="true" />
                        )}
                        <Button size="sm" variant="ghost" className="w-24 !text-red-600 hover:!bg-red-50" onClick={() => setDeletingPromo(promo)}>
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      {creatingTicket && (
        <TicketTypeFormModal
          eventId={event.id}
          withAuth={withAuth}
          onClose={() => setCreatingTicket(false)}
          onSaved={(ticket) => {
            setTicketTypes((current) => [...current, ticket]);
            setCreatingTicket(false);
          }}
        />
      )}

      {editingTicket && (
        <TicketTypeFormModal
          eventId={event.id}
          ticket={editingTicket}
          withAuth={withAuth}
          onClose={() => setEditingTicket(null)}
          onSaved={(ticket) => {
            setTicketTypes((current) => current.map((t) => (t.id === ticket.id ? ticket : t)));
            setEditingTicket(null);
          }}
        />
      )}

      {creatingPromo && (
        <PromoCodeFormModal
          eventId={event.id}
          existingCodes={promoCodes}
          withAuth={withAuth}
          onClose={() => setCreatingPromo(false)}
          onSaved={(promo) => {
            setPromoCodes((current) => upsertPromoCode(current, promo));
            setCreatingPromo(false);
          }}
        />
      )}

      {editingPromo && (
        <PromoCodeFormModal
          eventId={event.id}
          promo={editingPromo}
          existingCodes={promoCodes}
          withAuth={withAuth}
          onClose={() => setEditingPromo(null)}
          onSaved={(promo) => {
            setPromoCodes((current) => upsertPromoCode(current, promo));
            setEditingPromo(null);
          }}
        />
      )}

      {managingMedia && (
        <TicketMediaModal eventId={event.id} ticket={managingMedia} withAuth={withAuth} onClose={() => setManagingMedia(null)} />
      )}

      {deletingTicket && (
        <ConfirmDeleteModal
          title="Delete ticket type"
          confirmLabel="Delete ticket type"
          message={
            <>
              This permanently deletes <span className="font-semibold">{deletingTicket.name}</span>. This cannot be undone.
            </>
          }
          onConfirm={() => withAuth((token) => deleteTicketType(token, event.id, deletingTicket.id))}
          onDeleted={() => {
            setTicketTypes((current) => current.filter((t) => t.id !== deletingTicket.id));
            setDeletingTicket(null);
          }}
          onClose={() => setDeletingTicket(null)}
        />
      )}

      {deletingPromo && (
        <ConfirmDeleteModal
          title="Delete promo code"
          confirmLabel="Delete promo code"
          message={
            <>
              This permanently deletes <span className="font-mono font-semibold">{deletingPromo.code}</span>. This cannot be undone.
            </>
          }
          onConfirm={() => withAuth((token) => deletePromoCode(token, event.id, deletingPromo.id))}
          onDeleted={() => {
            setPromoCodes((current) => current.filter((p) => p.id !== deletingPromo.id));
            setDeletingPromo(null);
          }}
          onClose={() => setDeletingPromo(null)}
        />
      )}
    </div>
  );
}

function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = "Delete",
  errorFor500,
  onClose,
  onConfirm,
  onDeleted,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  errorFor500?: string;
  onClose: () => void;
  onConfirm: () => Promise<ApiResult<null>>;
  onDeleted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    const result = await onConfirm();
    setSubmitting(false);
    if (!result.ok) {
      setError(errorFor500 && result.status === 500 ? errorFor500 : result.message);
      return;
    }
    onDeleted();
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Alert tone="error">{message}</Alert>
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            loading={submitting}
            onClick={handleConfirm}
            className="!bg-red-600 !shadow-none hover:!bg-red-700"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function TicketMediaModal({
  eventId,
  ticket,
  onClose,
  withAuth,
}: {
  eventId: number | string;
  ticket: TicketType;
  onClose: () => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [items, setItems] = useState<GalleryItem[]>(ticket.gallery_items ?? []);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await withAuth((token) => listTicketGallery(token, eventId, ticket.id));
      if (cancelled) return;
      if (result.ok) setItems(result.data);
      else setError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, ticket.id, withAuth]);

  async function handleDelete(itemId: number | string) {
    setDeletingId(itemId);
    const result = await withAuth((token) => deleteTicketGalleryItem(token, eventId, ticket.id, itemId));
    setDeletingId(null);
    if (result.ok) setItems((current) => current.filter((item) => item.id !== itemId));
    else setError(result.message);
  }

  async function handleAttachExisting(selected: GalleryItem[]) {
    setPicking(false);
    if (selected.length === 0) return;
    setAttaching(true);
    setError(null);
    const result = await withAuth((token) =>
      createTicketGalleryFromUrls(
        token,
        eventId,
        ticket.id,
        selected.map((item) => ({ media_url: item.media_url, caption: item.caption, media_type: item.media_type as "image" | "video" })),
      ),
    );
    setAttaching(false);
    if (result.ok) setItems((current) => [...current, ...result.data]);
    else setError(result.message);
  }

  return (
    <Modal title={`Media — ${ticket.name}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setAdding(true)}>Upload / add URL</Button>
          <Button size="sm" variant="secondary" loading={attaching} onClick={() => setPicking(true)}>
            Choose existing
          </Button>
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        {loading ? (
          <ListSkeleton rows={2} label="Loading ticket media" />
        ) : items.length === 0 ? (
          <EmptyState title="No media yet" description="Attach photos or clips specific to this ticket type." />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
              <div key={item.id} className="card group relative aspect-square overflow-hidden rounded-xl">
                {item.media_type === "video" ? (
                  <video src={item.media_url} className="h-full w-full object-cover" muted />
                ) : (
                  <img src={item.media_url} alt={item.caption ?? ""} className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  aria-label="Delete media"
                  className="focus-ring press absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-100"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding && (
        <AddMediaModal
          onClose={() => setAdding(false)}
          onAdded={(newItems) => {
            setItems((current) => [...current, ...newItems]);
            setAdding(false);
          }}
          upload={(token, files, caption, mediaType) => createTicketGalleryFiles(token, eventId, ticket.id, files, caption, mediaType)}
          uploadUrls={(token, urlItems) => createTicketGalleryFromUrls(token, eventId, ticket.id, urlItems)}
          withAuth={withAuth}
        />
      )}

      {picking && (
        <MediaPickerModal
          eventId={eventId}
          withAuth={withAuth}
          mode="multi"
          title="Choose media for this ticket"
          onClose={() => setPicking(false)}
          onConfirm={handleAttachExisting}
        />
      )}
    </Modal>
  );
}

/** Create/edit are the same form (mirrors PromoCodeFormModal's own create/edit split below) —
 * an optional `ticket` prefills every field from the existing row and switches the submit to a
 * PATCH instead of a POST. */
function TicketTypeFormModal({
  eventId,
  ticket,
  onClose,
  onSaved,
  withAuth,
}: {
  eventId: number | string;
  ticket?: TicketType;
  onClose: () => void;
  onSaved: (ticket: TicketType) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const isEditing = Boolean(ticket);

  const [name, setName] = useState(ticket?.name ?? "");
  const [shortDescription, setShortDescription] = useState(ticket?.short_description ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [price, setPrice] = useState(ticket?.price ?? "");
  const [capacity, setCapacity] = useState(ticket?.capacity != null ? String(ticket.capacity) : "");
  const [kind, setKind] = useState<"individual" | "team">(ticket?.kind === "team" ? "team" : "individual");
  const [maxTeamSize, setMaxTeamSize] = useState(ticket?.max_team_size != null ? String(ticket.max_team_size) : "");
  // This session's own place/time — separate from the parent event's venue/dates (see
  // TicketTypeCreatePayload's own comment in lib/adminApi.ts). Previously not editable at all
  // once a ticket type was created, so a rescheduled session had nowhere to reflect that.
  const [venue, setVenue] = useState(ticket?.venue ?? "");
  const [startTime, setStartTime] = useState(() => toLocalInput(ticket?.start_time));
  const [endTime, setEndTime] = useState(() => toLocalInput(ticket?.end_time));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: TicketTypeCreatePayload = {
      name,
      short_description: shortDescription || undefined,
      description: description || undefined,
      price,
      kind,
      capacity: capacity ? Number(capacity) : undefined,
      max_team_size: kind === "team" && maxTeamSize ? Number(maxTeamSize) : undefined,
      venue: venue || undefined,
      start_time: startTime ? new Date(startTime).toISOString() : undefined,
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
    };
    const result = ticket
      ? await withAuth((token) => updateTicketType(token, eventId, ticket.id, payload))
      : await withAuth((token) => createTicketType(token, eventId, payload));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSaved(result.data);
  }

  return (
    <Modal title={isEditing ? `Edit “${ticket!.name}”` : "New ticket type"} onClose={onClose} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="Standard Pass" />
        <TextField
          label="Short description"
          value={shortDescription}
          onChange={(event) => setShortDescription(event.target.value)}
          placeholder="3-day general admission"
          hint="One line — shown on the ticket card."
        />
        <TextareaField
          label="Long description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What's included, full details…"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Price (₹)" required inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="499.00" />
          <TextField label="Capacity" type="number" value={capacity} onChange={(event) => setCapacity(event.target.value)} placeholder="500" />
        </div>
        <TextField
          label="Venue"
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
          placeholder="Main Auditorium"
          hint="This session's own location — leave blank to use the event's main venue."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <DateTimePicker
            label="Starts at"
            value={startTime}
            onChange={setStartTime}
            hint="This session's own schedule — reschedule it here if it moves."
          />
          <DateTimePicker label="Ends at" value={endTime} onChange={setEndTime} />
        </div>
        <SelectField label="Kind" value={kind} onChange={(event) => setKind(event.target.value as "individual" | "team")}>
          <option value="individual">Individual</option>
          <option value="team">Team</option>
        </SelectField>
        {kind === "team" && (
          <TextField label="Max team size" required type="number" value={maxTeamSize} onChange={(event) => setMaxTeamSize(event.target.value)} placeholder="4" />
        )}
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          {isEditing ? "Save changes" : "Create ticket type"}
        </Button>
      </form>
    </Modal>
  );
}

function upsertPromoCode(current: PromoCode[], promo: PromoCode): PromoCode[] {
  const exists = current.some((p) => p.id === promo.id);
  return exists ? current.map((p) => (p.id === promo.id ? promo : p)) : [...current, promo];
}

function codesMatch(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

function PromoCodeFormModal({
  eventId,
  promo,
  existingCodes,
  onClose,
  onSaved,
  withAuth,
}: {
  eventId: number | string;
  promo?: PromoCode;
  existingCodes: PromoCode[];
  onClose: () => void;
  onSaved: (promo: PromoCode) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(promo ?? null);
  const isEditing = Boolean(editingPromo);

  const [code, setCode] = useState(promo?.code ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">((promo?.discount_type as "percentage" | "flat") ?? "percentage");
  const [discountValue, setDiscountValue] = useState(promo?.discount_value ?? "");
  const [maxUses, setMaxUses] = useState(promo?.max_uses != null ? String(promo.max_uses) : "");
  const [validFrom, setValidFrom] = useState(() => toLocalInput(promo?.valid_from ?? new Date().toISOString()));
  const [validUntil, setValidUntil] = useState(() => toLocalInput(promo?.valid_until));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = existingCodes.find((p) => p.id !== editingPromo?.id && code.trim() && codesMatch(p.code, code));

  function switchToEditingDuplicate(target: PromoCode) {
    setEditingPromo(target);
    setCode(target.code);
    setDiscountType((target.discount_type as "percentage" | "flat") ?? "percentage");
    setDiscountValue(target.discount_value);
    setMaxUses(target.max_uses != null ? String(target.max_uses) : "");
    setValidFrom(toLocalInput(target.valid_from ?? new Date().toISOString()));
    setValidUntil(toLocalInput(target.valid_until));
    setError(null);
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (duplicate) return;
    setSubmitting(true);
    setError(null);
    const payload: PromoCodeCreatePayload = {
      code: code.toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses ? Number(maxUses) : undefined,
      valid_from: validFrom ? new Date(validFrom).toISOString() : undefined,
      valid_until: validUntil ? new Date(validUntil).toISOString() : undefined,
    };
    const result = editingPromo
      ? await withAuth((token) => updatePromoCode(token, eventId, editingPromo.id, payload))
      : await withAuth((token) => createPromoCode(token, eventId, payload));
    setSubmitting(false);
    if (!result.ok) {
      const serverSideDuplicate =
        !editingPromo && /already exists/i.test(result.message) ? existingCodes.find((p) => codesMatch(p.code, code)) : undefined;
      if (serverSideDuplicate) {
        switchToEditingDuplicate(serverSideDuplicate);
        return;
      }
      setError(result.message);
      return;
    }
    onSaved(result.data);
  }

  return (
    <Modal title={isEditing ? `Edit “${editingPromo!.code}”` : "New promo code"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Code" required value={code} onChange={(event) => setCode(event.target.value)} placeholder="EARLYBIRD20" />

        {duplicate && (
          <Alert tone="warning">
            <div className="flex flex-col items-start gap-2">
              <span>
                A promo code <span className="font-mono font-semibold">{duplicate.code}</span> already exists for this event — codes must be
                unique per event.
              </span>
              <Button type="button" size="sm" variant="secondary" onClick={() => switchToEditingDuplicate(duplicate)}>
                Edit that code instead
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Discount type" value={discountType} onChange={(event) => setDiscountType(event.target.value as "percentage" | "flat")}>
            <option value="percentage">Percentage</option>
            <option value="flat">Flat amount</option>
          </SelectField>
          <TextField label="Value" required inputMode="decimal" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} placeholder="20.00" />
        </div>
        <TextField label="Max uses" type="number" value={maxUses} onChange={(event) => setMaxUses(event.target.value)} placeholder="100" />
        <div className="grid gap-4 sm:grid-cols-2">
          <DateTimePicker label="Valid from" required value={validFrom} onChange={setValidFrom} />
          <DateTimePicker label="Valid until" value={validUntil} onChange={setValidUntil} />
        </div>
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} disabled={Boolean(duplicate)} className="w-full">
          {isEditing ? "Save changes" : "Create promo code"}
        </Button>
      </form>
    </Modal>
  );
}
