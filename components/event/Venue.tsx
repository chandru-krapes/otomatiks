import type { Event } from "@/lib/types";
import { PLACEHOLDER } from "@/lib/placeholders";
import SectionHeading from "./SectionHeading";

function getEmbedUrl(event: Event): string | null {
  // If a map URL is provided, try to convert a standard Google Maps share link to an embed URL.
  if (event.venue_map_url) {
    const url = event.venue_map_url;
    // Already an embed URL
    if (url.includes("google.com/maps/embed")) return url;
    // Convert short /maps/place/... link to embed
    if (url.includes("google.com/maps")) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(event.venue_address || event.venue_name || "")}&output=embed&z=15`;
    }
    return url;
  }
  // Fall back to geocoding the address or venue name
  const query = event.venue_address || event.venue_name;
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=15`;
}

function LocationIcon() {
  return (
    <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.05 3.4 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function Venue({ event }: { event: Event }) {
  const hasVenue = event.venue_name || event.venue_address || event.venue_map_url;
  const hasContact = event.contact_email || event.contact_phone;
  const embedUrl = getEmbedUrl(event);

  return (
    <section id="contact" className="section-tint relative px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          ghost="Contact"
          eyebrow="Get In Touch"
          title="Venue & Contact"
          description={!hasVenue && !hasContact ? "Details coming soon." : undefined}
        />

        {(hasVenue || hasContact) && (
          <div className="grid items-stretch gap-8 lg:grid-cols-2">
            {/* ── Left: merged Venue + Contact info panel ── */}
            <div className="glass-panel flex flex-col gap-8 rounded-3xl p-8">
              {/* Venue block */}
              {hasVenue && (
                <div>
                  <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Venue</span>
                  <div className="flex flex-col gap-4">
                    {event.venue_name && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                          <LocationIcon />
                        </div>
                        <div>
                          <p className="font-display text-base font-bold text-primary">{event.venue_name}</p>
                          {event.venue_address && (
                            <p className="mt-0.5 text-sm leading-relaxed text-muted">{event.venue_address}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {!event.venue_name && event.venue_address && (
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                          <LocationIcon />
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{event.venue_address}</p>
                      </div>
                    )}
                    {event.venue_map_url && (
                      <a
                        href={event.venue_map_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="focus-ring group ml-12 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-secondary transition-colors hover:text-primary"
                      >
                        Open in Google Maps
                        <svg
                          className="arrow-slide h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M5 12h13M13 6l6 6-6 6" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Divider */}
              {hasVenue && hasContact && <div className="h-px w-full bg-primary/10" />}

              {/* Contact block */}
              {hasContact && (
                <div>
                  <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Contact</span>
                  <dl className="flex flex-col gap-4">
                    {event.contact_email && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                          <MailIcon />
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Email</dt>
                          <dd className="mt-0.5">
                            <a href={`mailto:${event.contact_email}`} className="text-sm font-medium text-primary transition-colors hover:text-secondary">
                              {event.contact_email}
                            </a>
                          </dd>
                        </div>
                      </div>
                    )}
                    {event.contact_phone && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
                          <PhoneIcon />
                        </div>
                        <div>
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">Phone</dt>
                          <dd className="mt-0.5">
                            <a href={`tel:${event.contact_phone}`} className="text-sm font-medium text-primary transition-colors hover:text-secondary">
                              {event.contact_phone}
                            </a>
                          </dd>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Fallback if neither has content but section rendered */}
              {!hasVenue && !hasContact && (
                <p className="text-sm text-muted">{PLACEHOLDER.aboutBody}</p>
              )}
            </div>

            {/* ── Right: Google Maps embed ── */}
            <div className="glass-panel overflow-hidden rounded-3xl min-h-[360px] lg:min-h-0">
              {embedUrl ? (
                <iframe
                  title="Venue location map"
                  src={embedUrl}
                  className="h-full w-full min-h-[360px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 text-center p-8">
                  <LocationIcon />
                  <p className="text-sm font-medium text-muted">Map unavailable — no venue location provided.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Standalone fallback when nothing is set */}
        {!hasVenue && !hasContact && (
          <p className="text-center text-sm text-muted">{PLACEHOLDER.aboutBody}</p>
        )}
      </div>
    </section>
  );
}
