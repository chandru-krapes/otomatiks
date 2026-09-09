import Parallax from "./Parallax";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

const STORY_BUBBLES = [
  { id: "sb-1", value: 14, suffix: "+", label: "Years of Experience" },
  { id: "sb-2", value: 20, suffix: "+", label: "Hubs Worldwide" },
  { id: "sb-3", value: 100000, suffix: "+", label: "Students Trained" },
  { id: "sb-4", value: 50, suffix: "+", label: "Events Conducted" },
];

// Inline SVGs, not the /icons/*.gif stock art these bubbles used to render — those four files
// alone were 2-2.7MB each (8MB+ combined) for a decorative icon shown at ~60px, and being
// animated GIFs, the browser has to keep decoding every frame for as long as they're on
// screen. A few hundred bytes of stroke SVG, in the same line-icon language every other
// section already uses (see TeamIcon/CalendarIcon etc.), costs nothing by comparison.
function ExpertIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M6.5 9.8v4.4c0 1.6 2.5 3 5.5 3s5.5-1.4 5.5-3V9.8" />
      <path d="M20.5 7.5v6" />
    </svg>
  );
}

function StoreIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5 5 4h14l1 5.5" />
      <path d="M3.5 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M5 10v9.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" />
      <path d="M9.5 20.5V15a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v5.5" />
    </svg>
  );
}

function SocialLifeIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.5 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="16.5" cy="9" r="2.4" />
      <path d="M15 14.2c2.3.4 4 2.3 4 4.6" />
    </svg>
  );
}

function EventsIcon({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
      <path d="m8.5 15 2 2 4.5-4.5" />
    </svg>
  );
}

const ICONS = [ExpertIcon, StoreIcon, SocialLifeIcon, EventsIcon];

export default function About() {
  return (
    <section id="about" className="section-warm relative px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12">
          {STORY_BUBBLES.map((item, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
            <div key={item.id} className="group flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-secondary/10 overflow-hidden text-secondary transition-transform duration-500 group-hover:-translate-y-1.5 sm:h-32 sm:w-32 shadow-lg shadow-secondary/5">
                  <Icon className="h-[42%] w-[42%]" />
                </div>
              </div>
              
              {/* Capsule Card */}
              <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-white/30 border border-primary/10 px-4 py-2.5 shadow-sm backdrop-blur-md min-h-[68px] w-full max-w-[170px] transition-all duration-300 group-hover:border-primary/25 group-hover:shadow-md group-hover:-translate-y-0.5">
                <span className="font-boldonse text-lg font-extrabold leading-none text-secondary">
                  <AnimatedNumber value={item.value} />
                  {item.suffix}
                </span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-wider text-primary leading-tight">
                  {item.label}
                </span>
              </div>
            </div>
            );
          })}
        </div>

        <div className="relative">
          <Parallax speed={0.1} className="pointer-events-none absolute -left-4 -top-10">
            <span aria-hidden className="ghost-stroke select-none text-7xl font-extrabold uppercase sm:text-8xl">
              Story
            </span>
          </Parallax>
          <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.22em] text-secondary">
            Our Story
          </span>
          <h2 className="font-boldonse text-4xl font-extrabold leading-tight tracking-tight text-primary sm:text-5xl uppercase">
            Empowering Young Innovators
          </h2>
          <p className="mt-3 flex items-center gap-2 text-base font-semibold uppercase tracking-wider text-sky-500">
            <span className="inline-block h-1.5 w-5 rounded-full bg-secondary" />
            Through Creativity & Technology
          </p>
          <p className="mt-6 leading-relaxed text-foreground/75">
            At Otomatiks, we believe in the power of curiosity and innovation to shape the future. Our journey began with a passion for robotics and a vision to make cutting-edge technology accessible to young minds. Founded by a team of educators and tech enthusiasts, Otomatiks has grown into a leading provider of Robotics & AI education, empowering students to become tomorrow&rsquo;s innovators.
          </p>
          <p className="mt-4 leading-relaxed text-foreground/75">
            We started with a simple idea: to create hands-on learning experiences that ignite a love for science, technology, engineering, and mathematics (STEM). From our first classroom workshop to partnering with schools nationwide, we&rsquo;ve been committed to nurturing creativity and critical thinking in students of all ages.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="glass-panel rounded-2xl p-5 border border-primary/10 transition-transform duration-300 hover:-translate-y-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                 Our Vision
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80 font-medium">
                To make students globally recognized by changing the way they think.
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5 border border-primary/10 transition-transform duration-300 hover:-translate-y-1">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                 Our Mission
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80 font-medium">
                To bridge the gap between academics and real-time environments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}