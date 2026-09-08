"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Event, Perk } from "@/lib/types";
import {
  createPerk,
  createPerkMultipart,
  deletePerk,
  listPerks,
  updatePerk,
  type PerkPayload,
} from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader } from "../ui";
import GlobalMediaPickerModal from "../GlobalMediaPicker";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

const ALL_EVENTS_VALUE = "";

function TrophyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4Z" />
      <path d="M7 5H4v1a4 4 0 0 0 4 4M17 5h3v1a4 4 0 0 1-4 4" />
    </svg>
  );
}

export default function PerksSection({ events, withAuth }: { events: Event[]; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Perk | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listPerks(token));
      if (cancelled) return;
      if (result.ok) setPerks(result.data);
      else setError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [withAuth]);

  async function handleDelete(perkId: number | string) {
    setDeletingId(perkId);
    const result = await withAuth((token) => deletePerk(token, perkId));
    setDeletingId(null);
    if (result.ok) setPerks((current) => current.filter((p) => p.id !== perkId));
    else setError(result.message);
  }

  const eventTitle = useMemo(() => {
    const byId = new Map(events.map((event) => [String(event.id), event.title]));
    return (eventId: number | string | null) => (eventId == null ? null : byId.get(String(eventId)) ?? `Event #${eventId}`);
  }, [events]);

  const global = perks.filter((p) => p.event == null);
  const scoped = perks.filter((p) => p.event != null);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="What you get"
        description="Prize/benefit highlights shown on the public event page. Show one on every event, or scope it to a single event."
        action={<Button size="sm" onClick={() => setEditing("new")}>New perk</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={3} label="Loading perks" />
      ) : perks.length === 0 ? (
        <EmptyState icon={<TrophyIcon />} title="No perks yet" description="Add a trophy, medal, certificate, or prize-pool highlight." />
      ) : (
        <div className="flex flex-col gap-6">
          <PerkGroup
            title="Shown on every event"
            perks={global}
            deletingId={deletingId}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
          {Object.entries(
            scoped.reduce<Record<string, Perk[]>>((groups, perk) => {
              const key = String(perk.event);
              (groups[key] ??= []).push(perk);
              return groups;
            }, {}),
          ).map(([eventId, groupPerks]) => (
            <PerkGroup
              key={eventId}
              title={eventTitle(eventId) ?? `Event #${eventId}`}
              perks={groupPerks}
              deletingId={deletingId}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editing && (
        <PerkModal
          events={events}
          perk={editing === "new" ? null : editing}
          withAuth={withAuth}
          onClose={() => setEditing(null)}
          onSaved={(perk) => {
            setPerks((current) => {
              const exists = current.some((p) => p.id === perk.id);
              return exists ? current.map((p) => (p.id === perk.id ? perk : p)) : [...current, perk];
            });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PerkGroup({
  title,
  perks,
  deletingId,
  onEdit,
  onDelete,
}: {
  title: string;
  perks: Perk[];
  deletingId: number | string | null;
  onEdit: (perk: Perk) => void;
  onDelete: (perkId: number | string) => void;
}) {
  if (perks.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...perks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((perk) => (
          <div key={perk.id} className="card flex items-center gap-4 rounded-2xl p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-primary/5">
              {perk.icon_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-picked URL/uploaded icon, not an optimizable static asset.
                <img src={perk.icon_url} alt={perk.title} className="h-full w-full object-contain p-1.5" />
              ) : (
                <TrophyIcon className="h-6 w-6 text-primary/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold text-primary">{perk.title}</p>
              {perk.description && <p className="truncate text-xs text-muted">{perk.description}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => onEdit(perk)} className="text-xs">
                Edit
              </Button>
              <Button size="sm" variant="ghost" loading={deletingId === perk.id} onClick={() => onDelete(perk.id)} className="text-xs">
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerkModal({
  events,
  perk,
  onClose,
  onSaved,
  withAuth,
}: {
  events: Event[];
  perk: Perk | null;
  onClose: () => void;
  onSaved: (perk: Perk) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [title, setTitle] = useState(perk?.title ?? "");
  const [description, setDescription] = useState(perk?.description ?? "");
  const [order, setOrder] = useState(String(perk?.order ?? 0));
  const [scope, setScope] = useState(perk?.event != null ? String(perk.event) : ALL_EVENTS_VALUE);
  const [iconUrl, setIconUrl] = useState(perk?.icon_url ?? "");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [picking, setPicking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: PerkPayload = {
      title,
      description: description || undefined,
      order: Number(order) || 0,
      event: scope === ALL_EVENTS_VALUE ? null : scope,
    };
    const result = perk
      ? await withAuth((token) => updatePerk(token, perk.id, { ...payload, ...(iconFile ? {} : { icon_url: iconUrl || null }) }))
      : iconFile
        ? await withAuth((token) => createPerkMultipart(token, payload, iconFile))
        : await withAuth((token) => createPerk(token, { ...payload, icon_url: iconUrl || undefined }));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSaved(result.data);
  }

  return (
    <Modal title={perk ? "Edit perk" : "New perk"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trophy" />
        <TextField label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Worth ₹3,00,000" />

        <SelectField
          label="Show on"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
        >
          <option value={ALL_EVENTS_VALUE}>All events</option>
          {events.map((event) => (
            <option key={event.id} value={String(event.id)}>
              {event.title}
            </option>
          ))}
        </SelectField>

        <TextField label="Display order" type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="0" />

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Icon</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              setIconFile(e.target.files?.[0] ?? null);
              if (e.target.files?.[0]) setIconUrl("");
            }}
            className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setPicking(true)} className="w-fit">
            Choose from media library
          </Button>
          {!iconFile && (
            <TextField label="or icon URL" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} placeholder="https://cdn.otomatiks.com/perks/trophy.png" />
          )}
        </div>

        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          {perk ? "Save perk" : "Add perk"}
        </Button>
      </form>

      {picking && (
        <GlobalMediaPickerModal
          withAuth={withAuth}
          mode="single"
          title="Choose icon from media library"
          onClose={() => setPicking(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setIconUrl(items[0].url);
              setIconFile(null);
            }
          }}
        />
      )}
    </Modal>
  );
}
