"use client";

import { useState } from "react";

const STAR_PATH = "M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L10 1.5Z";

function StarGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

/** Read-only star rating (1–5, whole numbers). Used anywhere a rating is displayed. */
export default function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <StarGlyph
          key={index}
          className={`${size} ${index < filled ? "text-amber-400" : "text-primary/15"}`}
        />
      ))}
    </div>
  );
}

/**
 * Interactive 1–5 star picker for a review form. `role="radiogroup"` with
 * one `radio` per star, since a rating is exactly that — one mutually
 * exclusive choice from a small fixed set, not five independent toggles.
 */
export function RatingInput({
  value,
  onChange,
  size = "h-8 w-8",
  label = "Rating",
}: {
  value: number;
  onChange: (value: number) => void;
  size?: string;
  label?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= display;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue === 1 ? "" : "s"}`}
            onMouseEnter={() => setHovered(starValue)}
            onFocus={() => setHovered(starValue)}
            onBlur={() => setHovered(null)}
            onClick={() => onChange(starValue)}
            className="focus-ring press rounded-md p-0.5"
          >
            <StarGlyph
              className={`${size} transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] ${
                filled ? "scale-105 text-amber-400" : "text-primary/15"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
