"use client";

import { useEffect, useState } from "react";
import type { EventSummary, Testimonial } from "@/lib/types";
import { createTestimonial, deleteTestimonial, getMyTestimonial, updateTestimonial } from "@/lib/api";
import { formatDate } from "@/lib/format";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import Stars, { RatingInput } from "@/components/ui/Stars";
import { TextareaField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";

type Mode = "loading" | "view" | "prompt" | "form";

/**
 * One event's review, for the "main account" (booking account) dashboard —
 * not the community account, which has no equivalent here. Exactly one
 * testimonial per (account, event): the backend enforces that with a 400 on
 * a second `POST`, so this always resolves to either "you haven't reviewed
 * this yet" or "here's your review, with edit/delete" — never a list.
 */
export default function TestimonialManager({
  event,
  accessToken,
}: {
  event: EventSummary;
  accessToken: string;
}) {
  const [mode, setMode] = useState<Mode>("loading");
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyTestimonial(event.id, accessToken).then((existing) => {
      if (cancelled) return;
      setTestimonial(existing);
      setMode(existing ? "view" : "prompt");
    });
    return () => {
      cancelled = true;
    };
  }, [event.id, accessToken]);

  function startCreate() {
    setRating(0);
    setMessage("");
    setError(null);
    setMode("form");
  }

  function startEdit() {
    if (!testimonial) return;
    setRating(testimonial.rating);
    setMessage(testimonial.message);
    setError(null);
    setMode("form");
  }

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (rating < 1) {
      setError("Pick a star rating before submitting.");
      return;
    }
    setError(null);
    setSubmitting(true);

    const result = testimonial
      ? await updateTestimonial(event.id, { rating, message }, accessToken)
      : await createTestimonial(event.id, { rating, message }, accessToken);

    setSubmitting(false);

    if (result.ok) {
      setTestimonial(result.data);
      setMode("view");
      return;
    }

    // A 400 here usually means this account already has a review for this
    // event — most likely a second tab, or a stale "prompt" state from
    // before this one loaded. Reconcile with the server instead of just
    // showing an error that contradicts what the account can see.
    const existing = await getMyTestimonial(event.id, accessToken);
    if (existing) {
      setTestimonial(existing);
      setMode("view");
      return;
    }
    setError(result.message);
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteTestimonial(event.id, accessToken);
    setDeleting(false);

    if (!result.ok) {
      setError(result.message);
      setConfirmingDelete(false);
      return;
    }
    setTestimonial(null);
    setConfirmingDelete(false);
    setMode("prompt");
  }

  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-display text-sm font-bold text-primary">{event.title}</p>
        {mode === "view" && testimonial && (
          <span className="shrink-0 text-[11px] font-medium text-muted">
            {formatDate(testimonial.created_at)}
          </span>
        )}
      </div>

      {mode === "loading" && (
        <div className="mt-3 flex flex-col gap-2" role="status" aria-busy="true">
          <span className="sr-only">Checking for your review</span>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
      )}

      {mode === "prompt" && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted">You haven&rsquo;t reviewed this event yet.</p>
          <Button type="button" variant="secondary" size="sm" onClick={startCreate} className="shrink-0">
            Write a review
          </Button>
        </div>
      )}

      {mode === "view" && testimonial && (
        <div className="mt-3 flex flex-col gap-3">
          <Stars rating={testimonial.rating} />
          <p className="text-sm leading-relaxed text-foreground/80">{testimonial.message}</p>

          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">Delete this review?</p>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleDelete}
                  loading={deleting}
                  className="border-red-300 text-red-700 hover:border-red-400"
                >
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button type="button" variant="tertiary" size="sm" onClick={startEdit} className="text-xs">
                Edit
              </Button>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={() => setConfirmingDelete(true)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {mode === "form" && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-4">
          <RatingInput value={rating} onChange={setRating} label={`Rating for ${event.title}`} />

          <TextareaField
            label="Your review"
            required
            rows={3}
            value={message}
            onChange={(changeEvent) => setMessage(changeEvent.target.value)}
            placeholder="How was the event for you?"
          />

          {error && <Alert tone="error" emphasize>{error}</Alert>}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              {testimonial ? "Save changes" : "Submit review"}
            </Button>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={() => setMode(testimonial ? "view" : "prompt")}
              disabled={submitting}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
