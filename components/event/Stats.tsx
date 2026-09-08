import type { ReactNode } from "react";
import type { Event } from "@/lib/types";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

function MicIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 17l2 2 4-4 3 3V9l-4-4H8L4 9v9l3-3 4 2Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l2.9 6.1 6.6.7-4.9 4.5 1.3 6.6L12 17l-5.9 3.4 1.3-6.6-4.9-4.5 6.6-.7Z" />
    </svg>
  );
}

/**
 * At-a-glance numbers band — the same "big stat tiles" beat the org-wide About section
 * strikes with STORY_BUBBLES, but scoped to *this* event and entirely derived from whatever
 * content it actually has (speaker count, sponsor count, schedule days, highlights) rather
 * than a fixed platform-wide claim. Purely decorative, purely derived — never a number this
 * event didn't earn by having that much real content behind it, so it never needs updating by
 * hand and never overstates an event that's still thin on speakers/sponsors/schedule.
 */
export default function Stats({ event }: { event: Event }) {
  const candidates: ({ label: string; value: number; icon: ReactNode } | null)[] = [
    event.speakers?.length ? { label: event.speakers.length === 1 ? "Speaker" : "Speakers", value: event.speakers.length, icon: <MicIcon /> } : null,
    event.sponsors?.length ? { label: event.sponsors.length === 1 ? "Sponsor" : "Sponsors", value: event.sponsors.length, icon: <HandshakeIcon /> } : null,
    event.schedule?.length
      ? { label: event.schedule.length === 1 ? "Day" : "Days", value: event.schedule.length, icon: <CalendarIcon /> }
      : null,
    event.highlights?.length ? { label: "Highlights", value: event.highlights.length, icon: <StarIcon /> } : null,
  ];
  const items = candidates.filter((item): item is { label: string; value: number; icon: ReactNode } => item !== null);

  // Fewer than two numbers reads as thin rather than impressive — not worth the section at all.
  if (items.length < 2) return null;

  return (
    <section className="relative overflow-hidden px-6 py-16 lg:px-10">
      {/* No `.tech-grid` here — its radial mask-image fades the *whole* element (background
          gradient included) down to a small centred patch, which is exactly what stripped this
          band's colour off everywhere but its centre. The subtle white grid pattern below is a
          plain `background-image` on its own overlay div instead, which doesn't carry that mask. */}
      <div className="corner-marks relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary via-primary to-secondary px-6 py-10 shadow-[0_30px_70px_-30px_rgba(6,106,171,0.55)] sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "3rem 3rem",
          }}
          aria-hidden="true"
        />
        <div className="animate-blob-slow pointer-events-none absolute -right-10 -top-10 hidden h-56 w-56 rounded-full bg-white/10 blur-2xl sm:block" aria-hidden="true" />

        <div className="relative grid grid-cols-2 gap-6 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-14 sm:gap-y-8">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-secondary shadow-lg">
                {item.icon}
              </div>
              <div>
                <p className="font-boldonse text-2xl font-extrabold leading-none text-white sm:text-3xl">
                  <AnimatedNumber value={item.value} />+
                </p>
                <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white/75">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
