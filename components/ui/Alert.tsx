import type { ReactNode } from "react";

/**
 * Inline feedback banner — the one component for the red/amber/green boxes
 * that were previously hand-rolled in five places (BookingForm ×2,
 * BookingPage, BookingConfirmation, BookingLoginPage, CommunityLoginPage).
 *
 * `error` uses `role="alert"` so a failed submit is announced immediately;
 * the quieter tones use `role="status"` so they're read at the next natural
 * pause instead of interrupting.
 */
export type AlertTone = "error" | "warning" | "success" | "info";

const TONES: Record<AlertTone, { box: string; icon: string; path: ReactNode }> = {
  error: {
    box: "border-red-200 bg-red-50 text-red-700",
    icon: "text-red-500",
    path: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <path d="M12 7.5v5" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 16.2v.2" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "text-amber-500",
    path: (
      <>
        <path
          d="M12 4.5 21 19.5H3L12 4.5Z"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M12 10v3.5" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 16.6v.2" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: "text-emerald-500",
    path: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <path d="m8.2 12.3 2.6 2.6 5-5.2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  info: {
    box: "border-primary/20 bg-primary/5 text-primary",
    icon: "text-primary/70",
    path: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <path d="M12 11v5.5" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 7.6v.2" strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
};

export default function Alert({
  tone = "info",
  children,
  className = "",
  /** Adds a one-shot shake. Only worth it for a submit that just failed. */
  emphasize = false,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  emphasize?: boolean;
}) {
  const config = TONES[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${config.box} ${
        emphasize ? "animate-shake" : "animate-pop-in"
      } ${className}`}
    >
      <svg
        className={`mt-0.5 h-4 w-4 shrink-0 ${config.icon}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        {config.path}
      </svg>
      <span className="min-w-0 leading-relaxed">{children}</span>
    </div>
  );
}
