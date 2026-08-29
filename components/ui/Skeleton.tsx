/**
 * Loading placeholders.
 *
 * Each skeleton mirrors the block-level structure of the component it stands
 * in for, so the layout doesn't jump when real content arrives. The shimmer
 * itself is CSS-only (`.skeleton` in globals.css) and animates a transform,
 * so a grid full of these stays compositor-only.
 *
 * All of them are `aria-hidden` and live inside a labelled `role="status"`
 * region — a screen reader should hear "Loading events", not twelve empty
 * boxes.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

function Region({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden rounded-2xl">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="mt-2 h-9 w-32 rounded-full" />
      </div>
    </div>
  );
}

export function EventCardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Region label="Loading events">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </Region>
  );
}

export function SpeakerCardSkeleton() {
  return (
    <div className="card flex flex-col items-center gap-3 rounded-2xl p-6">
      <Skeleton className="h-16 w-16 rounded-full sm:h-28 sm:w-28" />
      <Skeleton className="mt-2 h-4 w-24" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-7 w-28 rounded-full" />
    </div>
  );
}

export function SpeakerGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Region label="Loading speakers">
      <div className="grid grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <SpeakerCardSkeleton key={index} />
        ))}
      </div>
    </Region>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 rounded-2xl p-8">
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <div className="my-2 flex flex-col gap-3 border-y border-primary/10 py-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}

export function TicketGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Region label="Loading tickets">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }, (_, index) => (
          <TicketCardSkeleton key={index} />
        ))}
      </div>
    </Region>
  );
}

/** Stands in for the whole event page while the subdomain's event resolves. */
export function EventPageSkeleton() {
  return (
    <Region label="Loading event">
      <div className="flex min-h-screen flex-col">
        <div className="h-16 w-full bg-primary/80" />
        <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-4/5" />
            <Skeleton className="mt-2 h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-6 h-12 w-40 rounded-full" />
            <div className="mt-6 flex gap-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-20 w-[4.5rem] rounded-2xl" />
              ))}
            </div>
          </div>
          <Skeleton className="hidden aspect-square w-full rounded-3xl sm:block" />
        </div>
      </div>
    </Region>
  );
}

/** Booking page: form column plus summary column. */
export function BookingPageSkeleton() {
  return (
    <Region label="Loading booking form">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:px-10">
        <div className="card flex flex-col gap-6 rounded-3xl p-8">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-4/5" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
        <div className="card flex flex-col gap-6 rounded-3xl p-8">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Region>
  );
}

/** Generic rows, for dashboard/registration lists. */
export function ListSkeleton({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <Region label={label}>
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="card flex items-center gap-4 rounded-2xl p-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </Region>
  );
}
