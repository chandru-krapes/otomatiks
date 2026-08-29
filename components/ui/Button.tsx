import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

/**
 * The site's one button system.
 *
 * Every call-to-action on the site resolves to one of these variants, so the
 * hierarchy stays readable at a glance: exactly one `primary` per view (the
 * thing we want pressed), `secondary` for the supporting choice, `tertiary`
 * for inline "read more"-style links, and `ghost` for low-stakes controls
 * inside a panel that already has its own primary.
 *
 * Renders as `<button>`, `next/link`, or a plain `<a>` depending on what it
 * is given — a CTA shouldn't have to change component just because its
 * destination is external.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "light";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-all duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-ring press " +
  "disabled:pointer-events-none disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  // The one obvious action. `sweep` adds the highlight pass on hover.
  primary:
    "sweep bg-secondary text-white shadow-[0_6px_20px_-4px_color-mix(in_srgb,var(--secondary)_55%,transparent)] " +
    "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_color-mix(in_srgb,var(--secondary)_65%,transparent)]",
  secondary:
    "border border-primary/25 bg-white text-primary shadow-[var(--elev-1)] " +
    "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[var(--elev-2)]",
  // Inline text action — no chrome until you interact with it.
  tertiary:
    "px-0 text-secondary hover:text-primary",
  ghost:
    "text-primary/80 hover:bg-primary/8 hover:text-primary",
  // For placement on a dark or photographic ground (header, hero overlay).
  light:
    "border border-white/30 bg-white/12 text-white backdrop-blur-md " +
    "hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

function buttonClass(variant: ButtonVariant, size: ButtonSize, className: string) {
  // `tertiary` opts out of the horizontal padding a chrome-less text link
  // shouldn't have, but keeps the vertical rhythm of its size.
  const sizing = variant === "tertiary" ? SIZES[size].replace(/px-\d+ /, "") : SIZES[size];
  return `${BASE} ${VARIANTS[variant]} ${sizing} ${className}`.trim();
}

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin-slow ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Trailing arrow that slides on hover — pairs with `tertiary`. */
export function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`arrow-slide ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h13M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  /** Leading glyph. Kept separate from `children` so spacing stays uniform. */
  icon?: ReactNode;
  /** Trailing glyph, e.g. `<ArrowRight />`. */
  trailingIcon?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children"> & {
    href?: undefined;
    /** Swaps the label for a spinner and blocks interaction while in flight. */
    loading?: boolean;
    /** Announced to assistive tech while `loading`. */
    loadingLabel?: string;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<"a">, "className" | "children" | "href"> & {
    href: string;
    /** Opens in a new tab and applies the matching `rel`. */
    external?: boolean;
  };

export default function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = "primary",
    size = "md",
    className = "",
    children,
    icon,
    trailingIcon,
  } = props;
  const classes = buttonClass(variant, size, className);

  if (props.href !== undefined) {
    const { href, external, variant: _v, size: _s, className: _c, children: _ch, icon: _i, trailingIcon: _t, ...rest } = props;
    void _v; void _s; void _c; void _ch; void _i; void _t;

    const content = (
      <>
        {icon}
        {children}
        {trailingIcon}
      </>
    );

    // An external destination is a plain anchor: next/link's prefetching and
    // client-side navigation have nothing to do off-origin.
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
          {content}
        </a>
      );
    }

    // In-page anchors (`#tickets`) must stay plain anchors too — routing a
    // hash through next/link would push a history entry instead of scrolling.
    if (href.startsWith("#")) {
      return (
        <a href={href} className={classes} {...rest}>
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  const {
    loading,
    loadingLabel = "Please wait…",
    disabled,
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    icon: _i,
    trailingIcon: _t,
    ...rest
  } = props;
  void _v; void _s; void _c; void _ch; void _i; void _t;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  );
}
