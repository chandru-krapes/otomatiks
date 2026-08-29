import type { Event, Speaker } from "@/lib/types";
import { PLACEHOLDER } from "@/lib/placeholders";
import SectionHeading from "./SectionHeading";
import Stagger from "@/components/ui/Stagger";
import EmptyState, { PeopleIcon } from "@/components/ui/EmptyState";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Speaker card.
 *
 * Everything rendered is a field the backend actually returned. The previous
 * version filled the gaps with invented content — a "GOLD" badge hard-coded
 * onto whichever speaker happened to be third in the list, "Fire Epic Ltd."
 * as everyone's organisation, "Founder & CEO" whenever `designation` was
 * missing, and four dead `#` social links per card. On a page shown to
 * sponsors and parents, those read as real claims, so they're gone; a
 * speaker with only a name now simply shows a name.
 *
 * The bio is revealed on hover/focus on pointer devices, but is always
 * visible on touch layouts — hover-only content is unreachable on a phone.
 */
function SpeakerCard({ speaker }: { speaker: Speaker }) {
  const photo = speaker.photo_url;

  return (
    <article className="card card-interactive group relative flex h-full flex-col items-center overflow-hidden rounded-2xl px-3 pb-5 pt-6 text-center sm:px-6 sm:pb-8 sm:pt-10">
      {/* Halo behind the portrait, brightening on hover. */}
      <div
        className="pointer-events-none absolute -top-8 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-secondary/10 blur-2xl transition-opacity duration-[var(--dur-med)] group-hover:opacity-100 sm:opacity-60"
        aria-hidden="true"
      />

      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-lg ring-2 ring-secondary/0 transition-all duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:ring-secondary/40 sm:h-28 sm:w-28 sm:border-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- speaker photos are R2 URLs on arbitrary hosts.
          <img
            src={photo}
            alt={speaker.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 font-display text-base font-bold text-primary sm:text-2xl">
            {initials(speaker.name)}
          </div>
        )}
      </div>

      <div className="relative mt-3 flex w-full flex-grow flex-col items-center justify-start sm:mt-5">
        <h3 className="font-display text-xs font-bold leading-snug text-primary sm:text-lg">
          {speaker.name}
        </h3>
        {speaker.designation && (
          <p className="mt-1 text-[11px] font-semibold leading-snug text-secondary sm:mt-2 sm:text-sm">
            {speaker.designation}
          </p>
        )}
      </div>

      {speaker.bio && (
        <p
          className={
            "relative mt-3 w-full border-t border-primary/8 pt-3 text-[11px] leading-relaxed text-muted sm:mt-5 sm:pt-4 sm:text-xs " +
            // Always readable where there is no hover; revealed on hover or
            // keyboard focus on pointer devices.
            "line-clamp-3 transition-opacity duration-[var(--dur-med)] " +
            "[@media(hover:hover)]:opacity-70 [@media(hover:hover)]:group-hover:opacity-100 " +
            "[@media(hover:hover)]:group-focus-within:opacity-100"
          }
        >
          {speaker.bio}
        </p>
      )}
    </article>
  );
}

export default function Speakers({ event }: { event: Event }) {
  const speakers = event.speakers;

  return (
    <section id="speakers" className="section-glow relative px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          ghost="Speakers"
          eyebrow={PLACEHOLDER.speakersEyebrow}
          title={PLACEHOLDER.speakersTitle}
        />

        {!speakers || speakers.length === 0 ? (
          <EmptyState
            icon={<PeopleIcon />}
            title="Lineup coming soon"
            description="Speakers and mentors for this event are still being confirmed."
          />
        ) : (
          <Stagger className="grid grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-4">
            {speakers.map((speaker) => (
              <SpeakerCard key={speaker.id} speaker={speaker} />
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
