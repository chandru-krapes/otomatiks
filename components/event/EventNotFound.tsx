/**
 * Shown when the request's subdomain doesn't resolve to a published event.
 *
 * Kept generic on purpose: at this point there is no event, so there is no
 * branding, theme colour or logo to apply — only the platform's own visual
 * language.
 */
export default function EventNotFound({ subdomain }: { subdomain?: string | null }) {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="animate-blob pointer-events-none absolute -left-10 top-1/4 hidden h-64 w-64 bg-accent/10 blur-3xl sm:block" aria-hidden="true" />
      <div className="animate-blob-slow pointer-events-none absolute -right-10 bottom-1/4 hidden h-72 w-72 bg-secondary/10 blur-3xl sm:block" aria-hidden="true" />

      <div className="relative flex max-w-md flex-col items-center">
        <span className="font-boldonse text-[5rem] font-extrabold leading-none tracking-tight text-primary/10 sm:text-[7rem]">
          404
        </span>

        <h1 className="-mt-6 font-boldonse text-2xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-3xl">
          Event Not Found
        </h1>

        <p className="mt-4 text-balance leading-relaxed text-muted">
          {subdomain
            ? `We couldn't find an event published at "${subdomain}". Double-check the address — the event may not be live yet.`
            : "This address doesn't map to an event. Try visiting a specific event's own address instead."}
        </p>

        {/* Decorative rule, matching the section dividers used across the site. */}
        <span className="mt-8 h-px w-24 bg-primary/15" aria-hidden="true" />
      </div>
    </main>
  );
}
