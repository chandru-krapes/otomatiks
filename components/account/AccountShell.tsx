import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Shared page chrome for the four account pages (booking/community ×
 * login/dashboard).
 */
export default function AccountShell({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Back to event site",
  maxWidth = "max-w-2xl",
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  maxWidth?: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="tech-grid pointer-events-none fixed inset-0" aria-hidden="true" />
      <div
        className="animate-blob-slow pointer-events-none fixed -right-20 top-[15%] hidden h-72 w-72 bg-accent/8 blur-3xl sm:block"
        style={{ contain: "strict" }}
        aria-hidden="true"
      />

      <div
        className={`route-transition relative mx-auto flex min-h-screen w-full flex-col gap-8 px-6 py-10 lg:px-10 ${maxWidth}`}
      >
        <div>
          <Link
            href={backHref}
            className="focus-ring group inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
          >
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:-translate-x-1"
            >
              &larr;
            </span>
            {backLabel}
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.22em] text-secondary">{eyebrow}</p>
          <h1 className="mt-2 font-boldonse text-2xl font-extrabold uppercase leading-snug tracking-tight text-primary sm:text-3xl sm:leading-tight">
            {title}
          </h1>
          {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
