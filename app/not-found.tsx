import Button from "@/components/ui/Button";

/**
 * Root 404, for a path that doesn't match any route.
 *
 * Distinct from `components/event/EventNotFound.tsx`, which handles the
 * different case of a valid path on a subdomain that has no published event
 * behind it.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="tech-grid pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative flex max-w-md flex-col items-center">
        <span className="font-boldonse text-[5rem] font-extrabold leading-none tracking-tight text-primary/10 sm:text-[7rem]">
          404
        </span>
        <h1 className="-mt-6 font-boldonse text-2xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-4 text-balance leading-relaxed text-muted">
          That page doesn&rsquo;t exist. It may have moved, or the link may be out of date.
        </p>
        <div className="mt-8">
          <Button href="/" variant="primary">
            Back to the event
          </Button>
        </div>
      </div>
    </main>
  );
}
