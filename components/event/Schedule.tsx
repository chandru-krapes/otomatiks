"use client";

import { useId, useState } from "react";
import type { Event, ScheduleDay, ScheduleItem } from "@/lib/types";
import { formatClockTime, formatDayTab } from "@/lib/format";
import SectionHeading from "./SectionHeading";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

/**
 * Event agenda.
 *
 * `Event.schedule` has been part of the API shape all along (lib/types.ts
 * `ScheduleDay[]`) but nothing rendered it — this section is what surfaces
 * it. Everything here is driven by the response: days, labels, times,
 * tracks and speakers are whatever the backend sent, and the section
 * removes itself entirely when there's no schedule at all.
 *
 * Client component because the day switcher is stateful. The cost is one
 * small island; the days themselves are all present in the initial HTML,
 * hidden panels included, so the content is server-rendered and indexable
 * regardless of which tab is selected.
 */
export default function Schedule({ event }: { event: Event }) {
  const days = event.schedule?.filter((day) => day.items && day.items.length > 0) ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsId = useId();

  if (!event.schedule || event.schedule.length === 0) return null;

  return (
    <section id="schedule" className="section-tint relative overflow-hidden px-6 py-24 lg:px-10">
      {/* Blueprint ground — the engineering motif, applied via the shared
          token rather than anything event-specific. */}
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative mx-auto max-w-5xl">
        <SectionHeading
          ghost="Schedule"
          eyebrow="What's On"
          title="Event Schedule"
          description="Sessions, workshops and competition rounds across the event."
        />

        {days.length === 0 ? (
          <EmptyState
            title="Agenda coming soon"
            description="The session-by-session schedule will be published here closer to the event."
          />
        ) : (
          <>
            {/* Day tabs. Only rendered when there's more than one day —
                a single-day event doesn't need a switcher above its list. */}
            {days.length > 1 && (
              <div
                role="tablist"
                aria-label="Schedule days"
                className="no-scrollbar mb-10 flex snap-x gap-2 overflow-x-auto pb-1"
              >
                {days.map((day, index) => {
                  const selected = index === activeIndex;
                  return (
                    <button
                      key={day.id ?? index}
                      role="tab"
                      id={`${tabsId}-tab-${index}`}
                      type="button"
                      aria-selected={selected}
                      aria-controls={`${tabsId}-panel-${index}`}
                      // Roving tabindex: the tablist is one tab stop, and
                      // arrow keys move between days.
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActiveIndex(index)}
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key !== "ArrowRight" && keyEvent.key !== "ArrowLeft") return;
                        keyEvent.preventDefault();
                        const offset = keyEvent.key === "ArrowRight" ? 1 : -1;
                        const next = (index + offset + days.length) % days.length;
                        setActiveIndex(next);
                        document.getElementById(`${tabsId}-tab-${next}`)?.focus();
                      }}
                      className={`focus-ring press shrink-0 snap-start rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] ${
                        selected
                          ? "border-secondary bg-secondary text-white shadow-[0_6px_18px_-6px_color-mix(in_srgb,var(--secondary)_70%,transparent)]"
                          : "border-primary/15 bg-white text-primary hover:-translate-y-0.5 hover:border-primary/35"
                      }`}
                    >
                      {dayLabel(day, index)}
                    </button>
                  );
                })}
              </div>
            )}

            {days.map((day, index) => (
              <div
                key={day.id ?? index}
                role={days.length > 1 ? "tabpanel" : undefined}
                id={`${tabsId}-panel-${index}`}
                aria-labelledby={days.length > 1 ? `${tabsId}-tab-${index}` : undefined}
                // `hidden` rather than unmounting: every day stays in the
                // server-rendered HTML, and switching tabs can't reflow the
                // page or lose scroll position.
                hidden={index !== activeIndex}
              >
                {/* Re-keyed on the active index so the entrance animation
                    replays on each switch, giving the tab change a visible
                    result without a page reload. */}
                <ol key={activeIndex} className="relative flex flex-col gap-4">
                  {/* Timeline spine. Sits behind the markers, and is hidden
                      on mobile where the times stack above the cards. */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-6 left-[7.25rem] top-6 hidden w-px bg-primary/12 sm:block"
                  />
                  {day.items.map((item, itemIndex) => (
                    <ScheduleRow key={item.id ?? itemIndex} item={item} index={itemIndex} />
                  ))}
                </ol>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}

function dayLabel(day: ScheduleDay, index: number): string {
  return day.label || formatDayTab(day.date) || `Day ${index + 1}`;
}

function ScheduleRow({ item, index }: { item: ScheduleItem; index: number }) {
  const start = formatClockTime(item.start_time);
  const end = formatClockTime(item.end_time);

  return (
    <li
      className="animate-pop-in group relative flex flex-col gap-3 sm:flex-row sm:gap-6"
      // Rows cascade rather than all appearing at once. Capped so a long
      // agenda's tail isn't left waiting.
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
    >
      {/* Time rail. Fixed width on desktop so every card starts on the same
          vertical line regardless of how long the times are. */}
      <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:flex-col sm:items-end sm:gap-0.5 sm:pt-5">
        {start ? (
          <>
            <span className="font-display text-sm font-bold text-primary">{start}</span>
            {end && <span className="text-xs text-muted">{end}</span>}
          </>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">TBA</span>
        )}
      </div>

      {/* Timeline marker, aligned to the spine above. */}
      <span
        aria-hidden="true"
        className="absolute left-[6.85rem] top-[1.6rem] hidden h-3 w-3 rounded-full border-2 border-white bg-primary/30 ring-4 ring-tint-cool transition-colors duration-[var(--dur-med)] group-hover:bg-secondary sm:block"
      />

      <div className="card card-interactive flex-1 rounded-2xl p-5 sm:ml-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="font-display text-base font-bold leading-snug text-primary">{item.title}</h3>
          {item.track && <Badge tone="accent">{item.track}</Badge>}
        </div>

        {item.speaker && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-secondary">
            <MicIcon />
            {item.speaker}
          </p>
        )}

        {item.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
        )}
      </div>
    </li>
  );
}

function MicIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
