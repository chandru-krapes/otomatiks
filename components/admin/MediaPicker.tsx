"use client";

import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/types";
import { listEventGallery } from "@/lib/adminApi";
import type { useAdminSession } from "./useAdminSession";
import { Modal } from "./ui";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

/**
 * "Choose from the media library" dialog — lets an admin assign media that's
 * already been uploaded (to the event's Media library) instead of uploading
 * the same file again for every place it's used. Sources from the event's
 * gallery regardless of what it's being assigned to next (the event banner,
 * a ticket type's own gallery, …), since that's the one place media gets
 * uploaded once and then reused.
 *
 * `mode="single"` (the event banner, which is one field, not a list) limits
 * the selection to one item and clicking a second replaces the first;
 * `mode="multi"` (a ticket type's gallery) behaves like a normal multi-select.
 */
export default function MediaPickerModal({
  eventId,
  withAuth,
  mode = "multi",
  title = "Choose from media library",
  onClose,
  onConfirm,
}: {
  eventId: number | string;
  withAuth: ReturnType<typeof useAdminSession>["withAuth"];
  mode?: "single" | "multi";
  title?: string;
  onClose: () => void;
  onConfirm: (items: GalleryItem[]) => void;
}) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number | string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const result = await withAuth((token) => listEventGallery(token, eventId));
      if (cancelled) return;
      if (result.ok) setItems(result.data);
      else setError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, withAuth]);

  function toggle(itemId: number | string) {
    setSelected((current) => {
      if (mode === "single") return current.has(itemId) ? new Set() : new Set([itemId]);
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm(items.filter((item) => selected.has(item.id)));
  }

  return (
    <Modal title={title} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        {loading ? (
          <ListSkeleton rows={2} label="Loading media library" />
        ) : items.length === 0 ? (
          <EmptyState title="No media yet" description="Upload something to this event's Media library first." />
        ) : (
          <div className="admin-scroll-light grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isSelected}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                    isSelected ? "border-secondary" : "border-transparent hover:border-primary/30"
                  }`}
                >
                  {item.media_type === "video" ? (
                    <video src={item.media_url} className="h-full w-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- gallery media is an R2 URL on an arbitrary host.
                    <img src={item.media_url} alt={item.caption ?? ""} className="h-full w-full object-cover" />
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
        )}

        <Button onClick={handleConfirm} disabled={selected.size === 0} className="w-full">
          Use selected {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>
    </Modal>
  );
}
