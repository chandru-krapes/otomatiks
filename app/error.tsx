"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

/**
 * Route-level error boundary.
 *
 * Deliberately shows a plain, human message and never `error.message`. The
 * errors that reach here are backend/network failures from `resolveEvent()`
 * and the API helpers, and their raw text is Django/fetch internals — of no
 * use to a parent trying to buy a ticket, and not something to put on a
 * public page. The `digest` is surfaced instead, since that is the handle
 * that matches a server-side log entry.
 *
 * Note the prop is `retry`, not `reset`: `reset()` only re-renders the
 * boundary's children with the same failed data, whereas `retry()` re-runs
 * the fetch — which is the actual recovery path for a transient API failure.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Event page failed to render:", error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative flex max-w-md flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 4.5 21 19.5H3L12 4.5Z" strokeLinejoin="round" />
            <path d="M12 10v3.6M12 16.8v.2" />
          </svg>
        </div>

        <h1 className="font-boldonse text-2xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-3xl">
          Something went wrong
        </h1>
        <p className="text-balance leading-relaxed text-muted">
          We couldn&rsquo;t load this event just now. This is usually temporary — try again in a
          moment.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="primary" onClick={() => retry()}>
            Try again
          </Button>
          <Button href="/" variant="secondary">
            Back to start
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-muted/70">
            Reference: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}
