import type { ReactNode } from "react";
import Parallax from "./Parallax";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  ghost,
  align = "center",
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  ghost?: string;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  const centered = align === "center";

  return (
    <div className={`relative mb-14 ${centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl text-left"}`}>
      {ghost && (
        <Parallax
          speed={0.12}
          anchor="center"
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10"
        >
          <span
            aria-hidden="true"
            className={`ghost-stroke -translate-y-1/2 select-none whitespace-nowrap font-extrabold uppercase leading-none tracking-tight opacity-90 text-[3.25rem] sm:text-[5.5rem] ${
              centered ? "block text-center" : "block text-left"
            }`}
          >
            {ghost}
          </span>
        </Parallax>
      )}
      {eyebrow && (
        <span className="mb-3 inline-block text-xs font-bold uppercase tracking-[0.22em] text-secondary">
          {eyebrow}
        </span>
      )}
      <div className={`flex flex-wrap items-center gap-6 ${centered ? "justify-center" : "justify-between"}`}>
        <h2 className="font-boldonse text-balance text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl lg:text-5xl uppercase">
          {title}
        </h2>
        {action}
      </div>
      {description && (
        <p className="mt-4 max-w-xl text-balance leading-relaxed text-muted">{description}</p>
      )}
    </div>
  );
}
