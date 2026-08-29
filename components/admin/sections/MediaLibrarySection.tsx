"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { deleteMedia, listMedia, uploadMedia } from "@/lib/adminApi";
import { MEDIA_FOLDERS, type MediaObject } from "@/lib/adminTypes";
import type { useAdminSession } from "../useAdminSession";
import { Modal, SectionHeader } from "../ui";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import { TextField } from "@/components/ui/Field";
import EmptyState from "@/components/ui/EmptyState";
import { EventCardGridSkeleton } from "@/components/ui/Skeleton";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)$/i;

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Platform-wide media library (apps/common `/media/`) — browses the whole Cloudflare R2
 * bucket across every folder every upload flow in this admin panel writes into, not one
 * event's gallery (see GallerySection for that). `IsAdmin`-only: R2 keys aren't tagged by
 * event, so there's no way to scope this to "your" events the way everything else here is.
 *
 * Cursor-paginated rather than page-numbered (R2/S3 listing has no total count), so this
 * accumulates pages into one growing list behind a "Load more" button instead of the
 * page-number pagination used elsewhere.
 */
export default function MediaLibrarySection({ withAuth }: { withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [folder, setFolder] = useState("");
  const [items, setItems] = useState<MediaObject[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listMedia(token, { folder: folder || undefined }));
      if (cancelled) return;
      if (result.ok) {
        setItems(result.data.results);
        setCursor(result.data.next_cursor);
        setHasMore(result.data.has_more);
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [folder, withAuth]);

  async function handleLoadMore() {
    if (!cursor) return;
    setLoadingMore(true);
    const result = await withAuth((token) => listMedia(token, { folder: folder || undefined, cursor }));
    setLoadingMore(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setItems((current) => [...current, ...result.data.results]);
    setCursor(result.data.next_cursor);
    setHasMore(result.data.has_more);
  }

  async function handleDelete(key: string) {
    setDeletingKey(key);
    const result = await withAuth((token) => deleteMedia(token, key));
    setDeletingKey(null);
    if (result.ok) setItems((current) => current.filter((item) => item.key !== key));
    else setError(result.message);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Media library"
        description="Every file in the Cloudflare bucket, across every event and folder — admin-only."
        action={<Button size="sm" onClick={() => setUploading(true)}>Upload media</Button>}
      />

      <SelectField label="Folder" value={folder} onChange={(e) => setFolder(e.target.value)} fieldClassName="max-w-xs">
        <option value="">All folders</option>
        {MEDIA_FOLDERS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </SelectField>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <EventCardGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState title="No media yet" description="Upload something, or pick a different folder." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <MediaTile key={item.key} item={item} deleting={deletingKey === item.key} onDelete={() => handleDelete(item.key)} />
            ))}
          </div>

          {hasMore && (
            <Button variant="secondary" size="sm" loading={loadingMore} onClick={handleLoadMore} className="w-fit">
              Load more
            </Button>
          )}
        </>
      )}

      {uploading && (
        <UploadMediaModal
          withAuth={withAuth}
          defaultFolder={folder}
          onClose={() => setUploading(false)}
          onUploaded={(item) => {
            if (!folder || folder === item.folder) setItems((current) => [item, ...current]);
            setUploading(false);
          }}
        />
      )}
    </div>
  );
}

function MediaTile({ item, deleting, onDelete }: { item: MediaObject; deleting: boolean; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);
  const filename = item.key.split("/").pop() ?? item.key;
  const isImage = IMAGE_EXTENSIONS.test(item.key);
  const isVideo = VIDEO_EXTENSIONS.test(item.key);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied (permissions, insecure context) — the URL is still visible
      // in the file's title attribute, so this just skips the one-click convenience.
    }
  }

  return (
    <div className="card group relative overflow-hidden rounded-2xl">
      <div className="aspect-square w-full overflow-hidden bg-primary/5">
        {isVideo ? (
          <video src={item.url} className="h-full w-full object-cover" muted />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- media library files are R2 URLs on an arbitrary host.
          <img src={item.url} alt={filename} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
            <svg viewBox="0 0 24 24" className="h-8 w-8 text-primary/40" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 3h9l3 3v15H6z" />
              <path d="M15 3v3h3" />
            </svg>
            <span className="truncate text-[10px] text-muted">{filename}</span>
          </div>
        )}
      </div>
      <div className="absolute left-2 top-2">
        <Badge tone="neutral">{item.folder}</Badge>
      </div>
      <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy URL"
          title={item.url}
          className="focus-ring press flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
        >
          {copied ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="11" height="11" rx="1.5" />
              <path d="M5 15V5a1.5 1.5 0 0 1 1.5-1.5H15" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete"
          className="focus-ring press flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm disabled:opacity-100"
        >
          {deleting ? (
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
      </div>
      <p className="truncate px-3 py-2 text-xs font-medium text-primary" title={filename}>{filename}</p>
      <p className="truncate px-3 pb-2 text-[10px] text-muted">{formatBytes(item.size)}</p>
    </div>
  );
}

function UploadMediaModal({
  defaultFolder,
  onClose,
  onUploaded,
  withAuth,
}: {
  defaultFolder: string;
  onClose: () => void;
  onUploaded: (item: MediaObject) => void;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState(defaultFolder || "media_library");
  const [customFolder, setCustomFolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const targetFolder = folder === "__custom__" ? customFolder.trim() : folder;
    const result = await withAuth((token) => uploadMedia(token, file, targetFolder || undefined));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onUploaded(result.data);
  }

  return (
    <Modal title="Upload media" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">
          Uploads straight into the bucket without attaching to any record — copy the resulting URL into a banner,
          gallery item, or anywhere else that wants one.
        </p>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">File</span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-6 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
          />
        </div>
        <SelectField label="Folder" value={folder} onChange={(e) => setFolder(e.target.value)}>
          {MEDIA_FOLDERS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
          <option value="__custom__">Custom…</option>
        </SelectField>
        {folder === "__custom__" && (
          <TextField label="Custom folder name" value={customFolder} onChange={(e) => setCustomFolder(e.target.value)} placeholder="my_folder" />
        )}
        {error && <Alert tone="error" emphasize>{error}</Alert>}
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          Upload
        </Button>
      </form>
    </Modal>
  );
}
