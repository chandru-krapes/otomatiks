import Image from "next/image";
import type { FounderMessage as FounderMessageData } from "@/lib/types";
import Parallax from "./Parallax";

function QuoteMark({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 32" fill="currentColor" aria-hidden="true">
      <path d="M0 20.4C0 9.6 6.8 2.4 16.8 0l2.4 4.8C12 7.2 8.4 11.6 8 18h9.2v14H0V20.4Zm22 0C22 9.6 28.8 2.4 38.8 0l2.4 4.8C34 7.2 30.4 11.6 30 18h9.2v14H22V20.4Z" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}


export default function FounderMessage({ founderMessage }: { founderMessage: FounderMessageData | undefined }) {
  const message = founderMessage?.message?.trim();
  if (!message) return null;

  const title = founderMessage?.title?.trim() || "Founder Message";
  const name = founderMessage?.name?.trim();
  const designation = founderMessage?.designation?.trim();
  const photo = founderMessage?.photo_url;

  return (
    <section id="founder-message" className="relative overflow-hidden px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        {/* Quote side */}
        <div className="relative">
          <Parallax speed={0.1} className="pointer-events-none absolute -left-4 -top-14 -z-10">
            <span aria-hidden className="ghost-stroke select-none text-6xl font-extrabold uppercase sm:text-8xl">
              Founder
            </span>
          </Parallax>

          <span className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-secondary">
            <span className="inline-block h-1.5 w-5 rounded-full bg-secondary" />
            Founder
          </span>
          <h2 className="font-boldonse text-3xl font-extrabold uppercase leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl">
            {title}
          </h2>

          <div className="glass-panel relative mt-8 overflow-hidden rounded-3xl border-l-4 border-secondary p-6 shadow-[var(--elev-2)] sm:p-8">
            <QuoteMark className="pointer-events-none absolute right-5 top-5 h-14 w-14 text-accent/10 sm:h-20 sm:w-20" />
            <p className="relative text-balance text-base leading-relaxed text-foreground/80 sm:text-lg">
              {message}
            </p>

            {(name || designation) && (
              <div className="relative mt-6 flex items-center gap-3 border-t border-primary/8 pt-5">
                <span aria-hidden className="h-px w-8 bg-secondary" />
                <div>
                  {name && <p className="font-display text-base font-bold text-primary">{name}</p>}
                  {designation && <p className="text-sm font-medium text-muted">{designation}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Portrait side */}
        <div className="group relative mx-auto w-full max-w-sm lg:max-w-none">
          {/* Hidden below `sm` and on the cheaper `blur-xl` radius, matching every other
              ambient blob on this page (see EventWebsite.tsx) — these two used to run
              unconditionally on every screen size at the heavier `blur-2xl`, which is real,
              constant GPU cost a phone (the device least able to spare it) got no visual
              opt-out from. */}
          <div
            className="animate-blob-slow pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 bg-secondary/15 blur-xl sm:block"
            aria-hidden="true"
          />
          <div
            className="animate-float-slow pointer-events-none absolute -bottom-10 -left-8 hidden h-32 w-32 rounded-full bg-primary/10 blur-xl sm:block"
            aria-hidden="true"
          />

          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border-4 border-white shadow-[var(--elev-3)] transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:-translate-y-1.5">
            {photo ? (
              <Image
                src={photo}
                alt={name || "Founder"}
                fill
                sizes="(min-width: 1024px) 420px, 90vw"
                className="object-cover transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)] group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 font-boldonse text-6xl uppercase text-primary">
                {name ? initials(name) : "F"}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>

          {(name || designation) && (
            <div className="glass-panel absolute -bottom-6 left-1/2 w-[calc(100%-2.5rem)] -translate-x-1/2 rounded-2xl px-5 py-3.5 text-center shadow-[var(--elev-2)] transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] group-hover:-translate-y-1">
              {name && <p className="font-display text-sm font-bold text-primary">{name}</p>}
              {designation && <p className="text-xs font-medium text-muted">{designation}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
