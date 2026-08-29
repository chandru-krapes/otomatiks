import Parallax from "./Parallax";
import AnimatedNumber from "@/components/ui/AnimatedNumber";

/*
 * Organisation-level figures about Otomatiks itself, not about the event
 * this subdomain resolved to — which is why they're static here rather than
 * read from the event payload. Stored as numbers so they can count up.
 */
const STORY_BUBBLES = [
  { id: "sb-1", value: 14, suffix: "+", label: "Years of Experience" },
  { id: "sb-2", value: 20, suffix: "+", label: "Hubs Worldwide" },
  { id: "sb-3", value: 100000, suffix: "+", label: "Students Trained" },
  { id: "sb-4", value: 50, suffix: "+", label: "Events Conducted" },
];

const ICONS = [
  "/icons/expert.gif",
  "/icons/store.gif",
  "/icons/social-life.gif",
  "/icons/events.gif",
];

export default function About() {
  return (
    <section id="about" className="section-warm relative px-6 py-24 lg:px-10">
      <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12">
          {STORY_BUBBLES.map((item, index) => (
            <div key={item.id} className="group flex flex-col items-center text-center">
              <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-secondary/10 overflow-hidden text-secondary transition-transform duration-500 group-hover:-translate-y-1.5 sm:h-32 sm:w-32 shadow-lg shadow-secondary/5">
                  {/* Icon GIFs have real alpha transparency baked in (see public/icons/) — no
                      blend-mode or backing-plate trick needed to sit cleanly on the pink circle. */}
                  {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF; next/image can't optimise these and would freeze the frame. */}
                  <img
                    src={ICONS[index % ICONS.length]}
                    alt=""
                    loading="lazy"
                    className="h-[50%] w-[50%] object-contain"
                  />
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
          ))}
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