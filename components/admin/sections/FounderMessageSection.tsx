"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { FounderMessage } from "@/lib/types";
import { getFounderMessage, updateFounderMessage } from "@/lib/adminApi";
import type { useAdminSession } from "../useAdminSession";
import { SectionHeader } from "../ui";
import GlobalMediaPickerModal from "../GlobalMediaPicker";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { TextField, TextareaField } from "@/components/ui/Field";
import { ListSkeleton } from "@/components/ui/Skeleton";


export default function FounderMessageSection({ withAuth }: { withAuth: ReturnType<typeof useAdminSession>["withAuth"] }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [title, setTitle] = useState("Founder Message");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [message, setMessage] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function applyFounderMessage(data: FounderMessage) {
    setTitle(data.title || "Founder Message");
    setName(data.name ?? "");
    setDesignation(data.designation ?? "");
    setMessage(data.message ?? "");
    setPhotoUrl(data.photo_url ?? "");
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      const result = await withAuth((token) => getFounderMessage(token));
      if (cancelled) return;
      if (result.ok) applyFounderMessage(result.data);
      else setLoadError(result.message);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const previewPhoto = photoFile ? URL.createObjectURL(photoFile) : photoUrl || null;

  async function handleSubmit(formEvent: FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const result = await withAuth((token) =>
      updateFounderMessage(
        token,
        {
          title,
          name,
          designation,
          message,
          ...(photoFile ? {} : { photo_url: photoUrl || undefined }),
        },
        photoFile,
      ),
    );
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPhotoFile(null);
    applyFounderMessage(result.data);
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Founder message"
        description="One shared section shown on every event's page across every subdomain. Leave it blank to hide the section."
      />

      {loading ? (
        <ListSkeleton rows={4} label="Loading founder message" />
      ) : loadError ? (
        <Alert tone="error">{loadError}</Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSubmit} className="card flex flex-col gap-4 rounded-2xl p-5">
            <TextField label="Section title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Founder Message" />
            <TextareaField
              label="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={7}
              placeholder="To our extraordinary participants, esteemed parents, and forward-thinking school leaders…"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sathish S" />
              <TextField label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Founder & CEO, Otomatiks" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setPhotoFile(e.target.files?.[0] ?? null);
                  if (e.target.files?.[0]) setPhotoUrl("");
                }}
                className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-4 text-sm text-muted file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => setPicking(true)} className="w-fit">
                Choose from media library
              </Button>
              {!photoFile && (
                <TextField label="or photo URL" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://cdn.otomatiks.com/founder/sathish.jpg" />
              )}
            </div>

            {error && <Alert tone="error" emphasize>{error}</Alert>}
            {saved && !error && <Alert tone="success">Founder message saved — every event&rsquo;s page now shows this.</Alert>}

            <Button type="submit" variant="primary" loading={saving} className="w-full">
              Save founder message
            </Button>
          </form>

          <div className="card flex flex-col gap-4 rounded-2xl p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Preview</p>
            <div className="rounded-2xl border border-hairline bg-primary/[0.03] p-5">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-secondary">{title || "Founder Message"}</p>
              <div className="relative mt-3 rounded-xl bg-white p-4 text-sm leading-relaxed text-foreground/80 shadow-sm">
                {message || <span className="text-muted">Your message will appear here…</span>}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-hairline bg-white">
                  {previewPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element -- preview of an admin-picked URL/local file, not an optimizable static asset.
                    <img src={previewPhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-boldonse text-xs uppercase text-primary">{(name || "F").slice(0, 2)}</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{name || "Founder name"}</p>
                  <p className="text-xs text-muted">{designation || "Designation"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {picking && (
        <GlobalMediaPickerModal
          withAuth={withAuth}
          mode="single"
          title="Choose founder photo from media library"
          onClose={() => setPicking(false)}
          onConfirm={(items) => {
            if (items[0]) {
              setPhotoUrl(items[0].url);
              setPhotoFile(null);
            }
          }}
        />
      )}
    </div>
  );
}
