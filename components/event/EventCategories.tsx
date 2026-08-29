"use client";

import { useId, useState } from "react";
import type { Event, TicketType } from "@/lib/types";
import { formatClockTime, formatDate } from "@/lib/format";
import { formatCurrency } from "@/lib/pricing";
import { isTicketAvailable } from "@/lib/booking";
import SectionHeading from "./SectionHeading";
import AddToCartButton from "@/components/booking/AddToCartButton";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Lightbox, { useLightbox } from "@/components/ui/Lightbox";
import LazyVideoThumb from "@/components/ui/LazyVideoThumb";

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function FeeIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4h11M6 4a3 3 0 0 0 0 6h11M6 10a3 3 0 0 1 0 6h11M9 4v16" />
    </svg>
  );
}

function PlayIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

/** One fact row in the sidebar card — day, time, venue, fee. Omitted entirely
 * when the ticket type didn't supply that field, never a placeholder. */
function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm text-foreground/80">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        {icon}
      </span>
      {children}
    </div>
  );
}

export default function EventCategories({ event }: { event: Event }) {
  const categories = event.ticket_types;
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsId = useId();
  const lightbox = useLightbox();

  const active: TicketType | undefined = categories?.[activeIndex];
  const gallery = active?.gallery_items;
  const heroItem = gallery?.[0];

  const dateLabel = formatDate(active?.start_time);
  const startLabel = formatClockTime(active?.start_time);
  const endLabel = formatClockTime(active?.end_time);
  const timeLabel = startLabel && endLabel ? `${startLabel} – ${endLabel}` : startLabel;
  const available = active ? isTicketAvailable(active) : false;

  return (
    <section id="event" className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="tech-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl">
        <SectionHeading eyebrow="Event Category" title="What's Happening" />

        {!categories || categories.length === 0 ? (
          <EmptyState
            title="Categories coming soon"
            description="Competition tracks and sessions will be listed here once they're finalised."
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:items-start">
            {/* Picker — sidebar card on desktop, matching the reference; a
                horizontal scroller on mobile, same pattern as Schedule's day
                tabs and the ticket picker this replaced. */}
            <div
              role="tablist"
              aria-label="Event categories"
              aria-orientation="vertical"
              className="no-scrollbar flex gap-3 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:pb-0"
            >
              {categories.map((category, index) => {
                const selected = index === activeIndex;
                const categoryAvailable = isTicketAvailable(category);
                return (
                  <div
                    key={category.id}
                    className={`card w-64 shrink-0 rounded-2xl p-6 transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] lg:w-full ${
                      selected ? "border-secondary/40 shadow-[var(--elev-2)]" : "hover:-translate-y-0.5 hover:border-primary/25"
                    }`}
                  >
                    {/* The tab itself only covers the "pick this category"
                        part — the Register CTA below is a real link and
                        can't be nested inside a <button> without breaking
                        both the CTA's click and this tab's semantics. */}
                    <button
                      type="button"
                      role="tab"
                      id={`${tabsId}-tab-${index}`}
                      aria-selected={selected}
                      aria-controls={`${tabsId}-panel`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActiveIndex(index)}
                      onKeyDown={(keyEvent) => {
                        const forward = keyEvent.key === "ArrowRight" || keyEvent.key === "ArrowDown";
                        const backward = keyEvent.key === "ArrowLeft" || keyEvent.key === "ArrowUp";
                        if (!forward && !backward) return;
                        keyEvent.preventDefault();
                        const next = (index + (forward ? 1 : -1) + categories.length) % categories.length;
                        setActiveIndex(next);
                        document.getElementById(`${tabsId}-tab-${next}`)?.focus();
                      }}
                      className="focus-ring press block w-full rounded-lg text-left"
                    >
                      <p
                        className={`font-boldonse text-lg font-extrabold uppercase leading-snug tracking-tight transition-colors duration-[var(--dur-med)] ${
                          selected ? "text-primary" : "text-primary/70"
                        }`}
                      >
                        {category.name}
                      </p>
                      <span
                        aria-hidden="true"
                        className={`mt-2 block h-1 w-10 origin-left rounded-full bg-accent transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] ${
                          selected ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                      {category.short_description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
                          {category.short_description}
                        </p>
                      )}
                    </button>

                    {/* Only the facts this category actually has — the same
                        essentials shown large in the detail panel, compact. */}
                    <div className="mt-4 flex flex-col gap-2 border-t border-primary/10 pt-4">
                      {formatDate(category.start_time) && (
                        <InfoRow icon={<CalendarIcon />}>
                          <span className="text-xs">{formatDate(category.start_time)}</span>
                        </InfoRow>
                      )}
                      {formatClockTime(category.start_time) && (
                        <InfoRow icon={<ClockIcon />}>
                          <span className="text-xs">
                            {formatClockTime(category.start_time)}
                            {formatClockTime(category.end_time) ? ` – ${formatClockTime(category.end_time)}` : ""}
                          </span>
                        </InfoRow>
                      )}
                      {category.venue && (
                        <InfoRow icon={<PinIcon />}>
                          <span className="text-xs">Venue - {category.venue}</span>
                        </InfoRow>
                      )}
                      <InfoRow icon={<FeeIcon />}>
                        <span className="text-xs">Participation Fees - {formatCurrency(Number(category.price) || 0)}</span>
                      </InfoRow>
                    </div>

                    {categoryAvailable ? (
                      <AddToCartButton ticket={category} size="sm" className="mt-5 w-full" />
                    ) : (
                      <span className="mt-5 flex w-full items-center justify-center rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-xs font-semibold text-muted">
                        Unavailable
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail panel: media on top, description below — matches the
                reference layout, built from the category's own gallery
                instead of a generic placeholder. */}
            {active && (
              <div key={activeIndex} role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-tab-${activeIndex}`} className="animate-pop-in">
                <div className="card overflow-hidden rounded-3xl">
                  <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/8 via-transparent to-secondary/8 sm:aspect-[16/8]">
                    {heroItem ? (
                      <button
                        type="button"
                        onClick={() => lightbox.open(0)}
                        aria-label={heroItem.caption ? `View ${heroItem.caption}` : "View category media"}
                        className="group absolute inset-0 h-full w-full"
                      >
                        {heroItem.media_type === "video" ? (
                          <LazyVideoThumb
                            src={heroItem.media_url}
                            className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-105"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element -- category media is an R2 URL on an arbitrary host.
                          <img
                            src={heroItem.media_url}
                            alt={heroItem.caption ?? ""}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-105"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
                        <span className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-xl backdrop-blur-sm transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:scale-110">
                          <PlayIcon className="h-6 w-6 translate-x-[2px]" />
                        </span>
                        {gallery && gallery.length > 1 && (
                          <span className="absolute right-4 top-4 rounded-full bg-primary/80 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                            +{gallery.length - 1} more
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="tech-grid flex h-full w-full items-center justify-center">
                        <span className="ghost-stroke select-none text-6xl font-extrabold uppercase sm:text-7xl">
                          {String(activeIndex + 1).padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 p-6 sm:p-8">
                    {active.access && active.access.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {active.access.map((item) => (
                          <Badge key={item.id} tone="accent">
                            {item.kind}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <h3 className="font-display text-2xl font-bold leading-snug text-primary sm:text-3xl">
                      {active.name}
                    </h3>

                    <p className="leading-relaxed text-muted">
                      {active.description || active.short_description || "More details for this category are coming soon."}
                    </p>

                    {(dateLabel || timeLabel || active.venue) && (
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-primary/10 pt-4 text-sm text-foreground/70">
                        {dateLabel && (
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon />
                            {dateLabel}
                          </span>
                        )}
                        {timeLabel && (
                          <span className="flex items-center gap-1.5">
                            <ClockIcon />
                            {timeLabel}
                          </span>
                        )}
                        {active.venue && (
                          <span className="flex items-center gap-1.5">
                            <PinIcon />
                            {active.venue}
                          </span>
                        )}
                      </div>
                    )}

                    {available && <AddToCartButton ticket={active} className="mt-2 w-fit" />}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {gallery && lightbox.activeIndex !== null && (
        <Lightbox items={gallery} activeIndex={lightbox.activeIndex} onClose={lightbox.close} onNavigate={lightbox.navigate} />
      )}
    </section>
  );
}
