"use client";

import { useEffect, useState } from "react";
import { listMedia } from "@/lib/adminApi";
import { MEDIA_FOLDERS, type MediaObject } from "@/lib/adminTypes";
import type { useAdminSession } from "./useAdminSession";
import { Modal } from "./ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { SelectField } from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v)$/i;

/** Best-effort media type from a key's extension — the platform-wide bucket has no
 * `media_type` field of its own (unlike a `GalleryItem`), so this is how a file picked
 * here gets classified once it's attached to a gallery, which does need one. */
export function inferMediaKind(key: string): "image" | "video" {
  return VIDEO_EXTENSIONS.test(key) ? "video" : "image";
}

/**
 * The picker grid at the heart of "choose from the media library" — every upload flow in
 * the admin panel (event gallery, ticket gallery, banner, secondary image, speaker photo,
 * sponsor logo) offers this as an alternative to uploading the same file again. Exported as
 * plain content (not wrapped in its own `Modal`) so it can sit inside another dialog as a
 * tab, e.g. `AddMediaModal`'s "Media library" tab; `GlobalMediaPickerModal` below wraps it
 * for the places that just need a standalone picker.
 *
 * `IsAdmin`-only server-side (see `MediaObject` in lib/adminTypes.ts) — an organizer session
 * still sees this tab/button, since role isn't threaded down through every call site, but a
 * 403 here surfaces as a normal inline error rather than breaking anything.
 */
export function GlobalMediaGrid({
  withAuth,
  mode = "multi",
  onConfirm,
  confirmLabel = "Use selected",
}: {
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  mode?: "single" | "multi";
  onConfirm: (items: MediaObject[]) => void;
  confirmLabel?: string;
}) {
  const [folder, setFolder] = useState("");
  const [items, setItems] = useState<MediaObject[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  function toggle(key: string) {
    setSelected((current) => {
      if (mode === "single") return current.has(key) ? new Set() : new Set([key]);
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectField label="Folder" value={folder} onChange={(e) => setFolder(e.target.value)} fieldClassName="max-w-xs">
        <option value="">All folders</option>
        {MEDIA_FOLDERS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </SelectField>

      {error && <Alert tone="error">{error}</Alert>}

      {loading ? (
        <ListSkeleton rows={2} label="Loading media library" />
      ) : items.length === 0 ? (
        <EmptyState title="No media yet" description="Upload something to the media library first." />
      ) : (
        <>
          <div className="admin-scroll-light grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {items.map((item) => {
              const isSelected = selected.has(item.key);
              const filename = item.key.split("/").pop() ?? item.key;
              const isImage = IMAGE_EXTENSIONS.test(item.key);
              const isVideo = VIDEO_EXTENSIONS.test(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggle(item.key)}
                  aria-pressed={isSelected}
                  title={filename}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                    isSelected ? "border-secondary" : "border-transparent hover:border-primary/30"
                  }`}
                >
                  {isVideo ? (
                    <video src={item.url} className="h-full w-full object-cover" muted />
                  ) : isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- media library files are R2 URLs on an arbitrary host.
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/5 p-2 text-center text-[10px] text-muted">{filename}</div>
                  )}
                  <span
                    className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {isSelected && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-white">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {hasMore && (
            <Button type="button" variant="ghost" size="sm" loading={loadingMore} onClick={handleLoadMore} className="w-fit">
              Load more
            </Button>
          )}
        </>
      )}

      <Button type="button" onClick={() => onConfirm(items.filter((item) => selected.has(item.key)))} disabled={selected.size === 0} className="w-full">
        {confirmLabel} {selected.size > 0 ? `(${selected.size})` : ""}
      </Button>
    </div>
  );
}

/** Standalone modal wrapper around `GlobalMediaGrid`, for the single-image fields (banner,
 * secondary image, speaker photo, sponsor logo) that just need a picker, not a tabbed dialog. */
export default function GlobalMediaPickerModal({
  withAuth,
  mode = "single",
  title = "Choose from media library",
  onClose,
  onConfirm,
}: {
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  mode?: "single" | "multi";
  title?: string;
  onClose: () => void;
  onConfirm: (items: MediaObject[]) => void;
}) {
  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-2xl">
      <GlobalMediaGrid
        withAuth={withAuth}
        mode={mode}
        onConfirm={(items) => {
          onConfirm(items);
          onClose();
        }}
      />
    </Modal>
  );
}
