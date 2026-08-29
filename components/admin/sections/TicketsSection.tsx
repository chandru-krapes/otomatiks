"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Event, GalleryItem, TicketType } from "@/lib/types";
import {
  createPromoCode,
  createTicketGalleryFiles,
  createTicketGalleryFromUrls,
  createTicketType,
  deleteTicketGalleryItem,
  listPromoCodes,
  listTicketGallery,
  listTicketTypes,
  pauseTicketType,
  resumeTicketType,
  updatePromoCode,
  type PromoCodeCreatePayload,
  type TicketTypeCreatePayload,
} from "@/lib/adminApi";
import type { PromoCode } from "@/lib/adminTypes";
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
  const [creatingPromo, setCreatingPromo] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [managingMedia, setManagingMedia] = useState<TicketType | null>(null);

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

  /** "Kill a code early" — a code otherwise only deactivates on its own once `valid_until`
   * passes (a Celery beat job on the backend). */
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
                  <Td>
                    {ticket.is_registration_paused ? (
                      <Badge tone="warning">Paused</Badge>
                    ) : ticket.is_sold_out ? (
                      <Badge tone="danger">Sold out</Badge>
                    ) : (
                      <Badge tone="success">On sale</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setManagingMedia(ticket)}>
                        Media
                      </Button>
                      <Button size="sm" variant="ghost" loading={busyId === ticket.id} onClick={() => handleTogglePause(ticket)}>
                        {ticket.is_registration_paused ? "Resume" : "Pause"}
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
          action={<Button size="sm" variant="secondary" onClick={() => setCreatingPromo(true)}>New promo code</Button>}
        />

        {promoCodes.length === 0 ? (
          <EmptyState title="No promo codes" description="Create a code to run a discount campaign." />
        ) : (
          <Table>
            <Thead columns={["Code", "Discount", "Used / Max", "Valid until", "Status", ""]} />
            <tbody>
              {promoCodes.map((promo) => {
                const isActive = promo.is_active !== false;
                return (
                  <Tr key={promo.id}>
                    <Td className="font-mono font-semibold text-primary">{promo.code}</Td>
                    <Td>{promo.discount_type === "percentage" ? `${promo.discount_value}%` : `₹${promo.discount_value}`}</Td>
                    <Td>{promo.used_count ?? 0} / {promo.max_uses ?? "∞"}</Td>
                    <Td className="whitespace-nowrap text-xs text-muted">{promo.valid_until ? new Date(promo.valid_until).toLocaleDateString() : "—"}</Td>
                    <Td>
                      <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Inactive"}</Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingPromo(promo)}>
                          Edit
                        </Button>
                        {isActive && (
                          <Button size="sm" variant="ghost" loading={busyId === promo.id} onClick={() => handleDeactivatePromo(promo)}>
                            Deactivate
                          </Button>
                        )}
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
        <CreateTicketTypeModal
          eventId={event.id}
          withAuth={withAuth}
          onClose={() => setCreatingTicket(false)}
          onCreated={(ticket) => {
            setTicketTypes((current) => [...current, ticket]);
            setCreatingTicket(false);
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
    </div>
  );
}

/** Media library scoped to one ticket type — same file/URL/bulk semantics as the event-wide
 * Media library section, reusing its `AddMediaModal` against the ticket-gallery endpoints. */
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

  /** Re-attaches media already sitting in the event's Media library — a URL-only write, since
   * the file (if any) is already hosted; no re-upload needed. */
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
                  // eslint-disable-next-line @next/next/no-img-element -- ticket media is an R2 URL on an arbitrary host.
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

function CreateTicketTypeModal({
  eventId,
  onClose,
  onCreated,
  withAuth,
}: {
  eventId: number | string;
  onClose: () => void;
  onCreated: (ticket: TicketType) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [name, setName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("");
  const [kind, setKind] = useState<"individual" | "team">("individual");
  const [maxTeamSize, setMaxTeamSize] = useState("");
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
    };
    const result = await withAuth((token) => createTicketType(token, eventId, payload));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onCreated(result.data);
  }

  return (
    <Modal title="New ticket type" onClose={onClose} maxWidth="max-w-xl">
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
        <SelectField label="Kind" value={kind} onChange={(event) => setKind(event.target.value as "individual" | "team")}>
          <option value="individual">Individual</option>
          <option value="team">Team</option>
        </SelectField>
        {kind === "team" && (
          <TextField label="Max team size" required type="number" value={maxTeamSize} onChange={(event) => setMaxTeamSize(event.target.value)} placeholder="4" />
        )}
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Create ticket type
        </Button>
      </form>
    </Modal>
  );
}

/** Replaces a promo code by id if present, otherwise appends it — shared by both create and
 * edit's `onSaved`, since editing an existing code (found via the duplicate-code prompt below,
 * or from the table's own "Edit" button) resolves to the same "update this row" outcome as a
 * fresh create resolves to "add a row". */
function upsertPromoCode(current: PromoCode[], promo: PromoCode): PromoCode[] {
  const exists = current.some((p) => p.id === promo.id);
  return exists ? current.map((p) => (p.id === promo.id ? promo : p)) : [...current, promo];
}

function codesMatch(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/**
 * Create/edit promo code, shared by both flows (same pattern as EventsSection's
 * `EventFormModal`) — only the submit call and initial values differ.
 *
 * Also the fix for a duplicate-code create: codes are unique per event, and a create with a
 * code that already exists on this event fails with a 400 whose message doesn't say *which*
 * code collided or offer any next step. Since the full list of this event's codes is already
 * loaded (`existingCodes`), a live client-side check catches the collision before submit and
 * offers to switch straight into editing that existing code instead — and the same check runs
 * against the server's error message as a fallback, in case the in-memory list is stale.
 */
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
  // Which existing promo code this form is editing — starts as the `promo` prop (the table's
  // own "Edit" button), but can also become set mid-create, when the duplicate-code prompt
  // below is accepted.
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(promo ?? null);
  const isEditing = Boolean(editingPromo);

  const [code, setCode] = useState(promo?.code ?? "");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">((promo?.discount_type as "percentage" | "flat") ?? "percentage");
  const [discountValue, setDiscountValue] = useState(promo?.discount_value ?? "");
  const [maxUses, setMaxUses] = useState(promo?.max_uses != null ? String(promo.max_uses) : "");
  // Defaults to "now" on create — the backend requires `valid_from` (see the reference doc's
  // request body), and a code almost always starts working immediately, so this saves picking
  // it by hand every time while still being editable for a scheduled/future-dated code.
  const [validFrom, setValidFrom] = useState(() => toLocalInput(promo?.valid_from ?? new Date().toISOString()));
  const [validUntil, setValidUntil] = useState(() => toLocalInput(promo?.valid_until));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any other code on this event (excluding whichever one is currently being edited, if any)
  // that matches what's typed right now.
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
    if (duplicate) return; // the inline prompt below is the only way past this — no silent submit into a 400.
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
      // Fallback for a collision the in-memory `existingCodes` list didn't catch (stale data,
      // or a code created from another tab/session in the meantime).
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
