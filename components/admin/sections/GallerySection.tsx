"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Event, GalleryItem } from "@/lib/types";
import type { MediaObject } from "@/lib/adminTypes";
import { createEventGalleryFiles, createEventGalleryFromUrls, deleteEventGalleryItem, listEventGallery } from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader } from "../ui";
import { GlobalMediaGrid, inferMediaKind } from "../GlobalMediaPicker";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { EventCardGridSkeleton } from "@/components/ui/Skeleton";

type MediaKind = "image" | "video";

/**
 * Event gallery (apps/events `/gallery/`) — every photo/clip attached to
 * *this* event, with delete, a multi-file bulk upload, and a bulk add-by-URL
 * form. Distinct from the platform-wide Media library section (apps/common
 * `/media/`), which browses the whole Cloudflare bucket across every event;
 * this one only ever shows/writes rows tied to `event.id`. Ticket types get
 * their own scoped gallery of the same shape (see the "Manage media" action
 * in TicketsSection), so the upload/list plumbing here is written to be
 * reusable rather than baked into just this one screen.
 */
export default function GallerySection({ event, withAuth }: { event: Event; withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listEventGallery(token, event.id));
      if (cancelled) return;
      if (result.ok) setItems(result.data);
      else setError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [event.id, withAuth]);

  async function handleDelete(itemId: number | string) {
    setDeletingId(itemId);
    const result = await withAuth((token) => deleteEventGalleryItem(token, event.id, itemId));
    setDeletingId(null);
    if (result.ok) setItems((current) => current.filter((item) => item.id !== itemId));
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Gallery"
        description="Photos and clips for this event's public gallery."
        action={<Button size="sm" onClick={() => setAdding(true)}>Add media</Button>}
      />

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <EventCardGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState title="No media yet" description="Upload files or add hosted URLs to build this event's gallery." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="card group relative overflow-hidden rounded-2xl">
              <div className="aspect-square w-full overflow-hidden bg-primary/5">
                {item.media_type === "video" ? (
                  <video src={item.media_url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- gallery media is an R2 URL on an arbitrary host.
                  <img src={item.media_url} alt={item.caption ?? ""} loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="absolute left-2 top-2">
                <Badge tone={item.media_type === "video" ? "accent" : "neutral"}>{item.media_type}</Badge>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                aria-label="Delete media"
                className="focus-ring press absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 disabled:opacity-100"
              >
                {deletingId === item.id ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9" opacity="0.3" />
                    <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                )}
              </button>
              {item.caption && (
                <p className="truncate bg-black/0 px-3 py-2 text-xs font-medium text-primary">{item.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {adding && (
        <AddMediaModal
          onClose={() => setAdding(false)}
          onAdded={(newItems) => {
            setItems((current) => [...current, ...newItems]);
            setAdding(false);
          }}
          upload={(token, files, caption, mediaType) => createEventGalleryFiles(token, event.id, files, caption, mediaType)}
          uploadUrls={(token, urlItems) => createEventGalleryFromUrls(token, event.id, urlItems)}
          withAuth={withAuth}
        />
      )}
    </div>
  );
}

/**
 * Shared add-media dialog — file upload (multi-select, bulk) and add-by-URL (multi-row,
 * bulk) in one modal. Takes its two write calls as props so TicketsSection's per-ticket
 * gallery modal can reuse this exact UI against the ticket-scoped endpoints instead.
 */
export function AddMediaModal({
  onClose,
  onAdded,
  upload,
  uploadUrls,
  withAuth,
}: {
  onClose: () => void;
  onAdded: (items: GalleryItem[]) => void;
  upload: (token: string, files: File[], caption: string, mediaType: MediaKind) => ReturnType<typeof createEventGalleryFiles>;
  uploadUrls: (token: string, items: { media_url: string; caption?: string; media_type: MediaKind }[]) => ReturnType<typeof createEventGalleryFromUrls>;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [tab, setTab] = useState<"files" | "urls" | "library">("files");
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);

  /** Selecting from the media library re-attaches already-uploaded bucket files — a
   * URL-only write through the same bulk-from-URL call the "Add from URL" tab uses, since
   * the file is already hosted and needs no re-upload. */
  async function handlePickFromLibrary(items: MediaObject[]) {
    if (items.length === 0) return;
    setAttaching(true);
    setAttachError(null);
    const result = await withAuth((token) =>
      uploadUrls(
        token,
        items.map((item) => ({ media_url: item.url, caption: item.key.split("/").pop(), media_type: inferMediaKind(item.key) })),
      ),
    );
    setAttaching(false);
    if (!result.ok) {
      setAttachError(result.message);
      return;
    }
    onAdded(result.data);
  }

  return (
    <Modal title="Add media" onClose={onClose} maxWidth="max-w-xl">
      <div className="mb-5 flex gap-2">
        <TabButton active={tab === "files"} onClick={() => setTab("files")}>Upload files</TabButton>
        <TabButton active={tab === "urls"} onClick={() => setTab("urls")}>Add from URL</TabButton>
        <TabButton active={tab === "library"} onClick={() => setTab("library")}>Media library</TabButton>
      </div>
      {tab === "files" ? (
        <FileUploadForm withAuth={withAuth} upload={upload} onAdded={onAdded} />
      ) : tab === "urls" ? (
        <UrlBulkForm withAuth={withAuth} uploadUrls={uploadUrls} onAdded={onAdded} />
      ) : (
        <div className="flex flex-col gap-4">
          {attachError && <Alert tone="error" emphasize>{attachError}</Alert>}
          <GlobalMediaGrid withAuth={withAuth} mode="multi" confirmLabel={attaching ? "Attaching…" : "Attach selected"} onConfirm={handlePickFromLibrary} />
        </div>
      )}
    </Modal>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focus-ring press rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
        active ? "border-secondary bg-secondary text-white" : "border-hairline-strong text-primary hover:bg-primary/5"
      }`}
    >
      {children}
    </button>
  );
}

function FileUploadForm({
  withAuth,
  upload,
  onAdded,
}: {
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  upload: (token: string, files: File[], caption: string, mediaType: MediaKind) => ReturnType<typeof createEventGalleryFiles>;
  onAdded: (items: GalleryItem[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [mediaType, setMediaType] = useState<MediaKind>("image");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (files.length === 0) {
      setError("Choose at least one file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) => upload(token, files, caption, mediaType));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onAdded(Array.isArray(result.data) ? result.data : [result.data]);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Files</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-6 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        {files.length > 0 && <span className="text-xs text-muted">{files.length} file(s) selected — uploaded as a batch.</span>}
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Caption (optional)" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Opening ceremony" />
        <SelectField label="Type" value={mediaType} onChange={(event) => setMediaType(event.target.value as MediaKind)}>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </SelectField>
      </div>
      {error && <Alert tone="error" emphasize>{error}</Alert>}
      <Button type="submit" variant="primary" loading={submitting} className="w-full">
        Upload {files.length > 0 ? `${files.length} file(s)` : ""}
      </Button>
    </form>
  );
}

interface UrlRow {
  url: string;
  caption: string;
  mediaType: MediaKind;
}

function emptyRow(): UrlRow {
  return { url: "", caption: "", mediaType: "image" };
}

function UrlBulkForm({
  withAuth,
  uploadUrls,
  onAdded,
}: {
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  uploadUrls: (token: string, items: { media_url: string; caption?: string; media_type: MediaKind }[]) => ReturnType<typeof createEventGalleryFromUrls>;
  onAdded: (items: GalleryItem[]) => void;
}) {
  const [rows, setRows] = useState<UrlRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(index: number, patch: Partial<UrlRow>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeRow(index: number) {
    setRows((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    const validRows = rows.filter((row) => row.url.trim());
    if (validRows.length === 0) {
      setError("Add at least one URL.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await withAuth((token) =>
      uploadUrls(
        token,
        validRows.map((row) => ({ media_url: row.url.trim(), caption: row.caption || undefined, media_type: row.mediaType })),
      ),
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onAdded(result.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-xl border border-hairline p-3 sm:flex-row sm:items-end">
            <TextField
              label="Media URL"
              required
              value={row.url}
              onChange={(event) => updateRow(index, { url: event.target.value })}
              placeholder="https://example.com/photo.jpg"
              fieldClassName="flex-[2]"
            />
            <TextField
              label="Caption"
              value={row.caption}
              onChange={(event) => updateRow(index, { caption: event.target.value })}
              placeholder="Optional"
              fieldClassName="flex-1"
            />
            <SelectField
              label="Type"
              value={row.mediaType}
              onChange={(event) => updateRow(index, { mediaType: event.target.value as MediaKind })}
              fieldClassName="sm:w-32"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </SelectField>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remove row"
                className="focus-ring press flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-red-50 hover:text-red-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => setRows((current) => [...current, emptyRow()])} className="w-fit">
        + Add another
      </Button>
      {error && <Alert tone="error" emphasize>{error}</Alert>}
      <Button type="submit" variant="primary" loading={submitting} className="w-full">
        Add {rows.filter((r) => r.url.trim()).length > 1 ? `${rows.filter((r) => r.url.trim()).length} items` : "media"}
      </Button>
    </form>
  );
}
