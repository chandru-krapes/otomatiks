import Link from "next/link";
import type { Event } from "@/lib/types";
import Button from "@/components/ui/Button";

/**
 * Temporary stand-in for the real checkout flow. Ticket booking opens the
 * next Saturday from whenever this is viewed — `CheckoutPage` (the actual
 * checkout implementation) is untouched and still wired up at
 * `app/checkout/page.tsx`; swap this back out for `<CheckoutPage />` there
 * once bookings go live. See flow.pdf follow-up: "for now" gate on checkout.
 */
function nextSaturday(from: Date): Date {
  const result = new Date(from);
  const daysUntilSaturday = (6 - result.getDay() + 7) % 7 || 7;
  result.setDate(result.getDate() + daysUntilSaturday);
  return result;
}

function formatLaunchDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function CheckoutComingSoon({ event }: { event: Event }) {
  const launchDate = nextSaturday(new Date());
  const formatted = formatLaunchDate(launchDate);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-16">
      {/* Ambient ground — same blob/tech-grid language used across the site,
          hidden below `sm` for the same battery/GPU reasons as the real
          checkout page. */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden sm:block" aria-hidden="true">
        <div className="animate-blob-1 absolute -left-16 top-[8%] h-72 w-72 bg-accent/10 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-3 absolute right-[6%] top-[55%] h-80 w-80 bg-secondary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
        <div className="animate-blob-2 absolute left-[35%] bottom-[-10%] h-64 w-64 bg-primary/8 blur-xl" style={{ willChange: "transform", contain: "strict" }} />
      </div>
      <div className="tech-grid pointer-events-none absolute inset-0 z-0 opacity-40" aria-hidden="true" />

      <div className="route-transition relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <div className="animate-pop-in relative flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary/10 text-secondary shadow-[var(--elev-2)]">
          <span className="animate-scan pointer-events-none absolute inset-x-2 h-px bg-secondary/40" aria-hidden="true" />
          <TicketGlyph />
        </div>

        <p className="animate-pop-in mt-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary shadow-[var(--elev-1)]" style={{ animationDelay: "60ms" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-secondary" />
          </span>
          Booking opens soon
        </p>

        <h1 className="mt-5 font-boldonse text-3xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-4xl">
          Tickets aren&rsquo;t open yet
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
          We&rsquo;re putting the final touches on checkout for {event.title}. Booking begins
        </p>

        <div className="animate-pop-in mt-5 flex flex-col items-center gap-1 rounded-2xl border border-primary/15 bg-white/60 px-8 py-5 shadow-[var(--elev-1)] backdrop-blur-sm" style={{ animationDelay: "120ms" }}>
          <span className="font-display text-2xl font-bold text-primary sm:text-3xl">{formatted}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Mark your calendar</span>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button href={`/#tickets`} variant="secondary">
            Back to tickets
          </Button>
          <Link
            href="/"
            className="focus-ring rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
          >
            Return to event home
          </Link>
        </div>
      </div>
    </div>
  );
}

function TicketGlyph() {
  return (
    <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 9V7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V9a2 2 0 1 0 0 6v1.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V15a2 2 0 1 0 0-6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6v12" strokeDasharray="2.2 2.4" strokeLinecap="round" />
    </svg>
  );
}
