import type { Event } from "@/lib/types";

/**
 * Small at-a-glance numbers derived from whatever content the backend
 * happens to provide (speaker count, sponsor count, schedule days...).
 * Purely decorative and purely derived — no event-specific hardcoding.
 */
export default function Stats({ event }: { event: Event }) {
  const items = [
    event.speakers?.length ? { label: "Speakers", value: event.speakers.length } : null,
    event.sponsors?.length ? { label: "Sponsors", value: event.sponsors.length } : null,
    event.schedule?.length
      ? { label: event.schedule.length === 1 ? "Day" : "Days", value: event.schedule.length }
      : null,
    event.highlights?.length ? { label: "Highlights", value: event.highlights.length } : null,
  ].filter((item): item is { label: string; value: number } => Boolean(item));

  if (items.length === 0) return null;

  const sizes = ["h-36 w-36 text-2xl", "h-28 w-28 text-xl", "h-32 w-32 text-xl", "h-24 w-24 text-lg"];

  return (
    <section className="border-t border-surface-border px-6 py-16 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`flex flex-col items-center justify-center gap-1 rounded-full border border-surface-border bg-surface text-center font-bold text-on-surface ${sizes[index % sizes.length]}`}
          >
            <span>{item.value}+</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
