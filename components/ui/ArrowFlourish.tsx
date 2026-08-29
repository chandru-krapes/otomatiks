/**
 * Small folded-arrow glyph flanking a compact section eyebrow (Testimonials,
 * Gallery) — an alternative to `SectionHeading`'s tracked-caps treatment for
 * a section that reads as one centred or left-aligned statement rather than
 * a header over a content grid.
 */
export default function ArrowFlourish({
  flip = false,
  className = "h-3 w-3 text-secondary",
}: {
  /** Mirrors the glyph — pass on the second flourish of a pair. */
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`${className} ${flip ? "-scale-x-100" : ""}`}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M1 1h14L8 8l7 7H1l7-7L1 1Z" />
    </svg>
  );
}
