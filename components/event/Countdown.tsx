"use client";

import { useEffect, useState } from "react";

function getTimeParts(targetMs: number) {
  const diff = targetMs - Date.now();
  const clamped = Math.max(0, diff);
  return {
    ended: diff <= 0,
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped / 3_600_000) % 24),
    minutes: Math.floor((clamped / 60_000) % 60),
    seconds: Math.floor((clamped / 1_000) % 60),
  };
}

/**
 * Countdown to the event start.
 *
 * The unit tiles use `tabular-nums` and a fixed width so the row can't
 * reflow as digits change — a countdown that shifts its neighbours every
 * second is the classic version of this component's layout bug.
 *
 * The four tiles share one `.glass-panel` backing instead of each carrying
 * its own — this component re-renders every second by design (it's a live
 * countdown, above the fold on every event page), and `backdrop-filter` is
 * one of the more expensive things a browser can recompute. Four
 * independent blurred surfaces ticking every second, forever, was a real,
 * constant source of the site feeling hangy; one shared surface cuts that
 * cost to a quarter without changing how it looks.
 *
 * `suppressHydrationWarning` is required on the values: the server renders
 * the remaining time at request time and the client re-renders it a moment
 * later, so a mismatch is expected rather than a bug.
 */
export default function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const [parts, setParts] = useState(() => getTimeParts(targetMs));

  useEffect(() => {
    const id = setInterval(() => setParts(getTimeParts(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (Number.isNaN(targetMs) || parts.ended) return null;

  const units: [string, number][] = [
    ["Days", parts.days],
    ["Hours", parts.hours],
    ["Minutes", parts.minutes],
    ["Seconds", parts.seconds],
  ];

  return (
    <div>
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
        Event starts in
      </p>
      <div className="glass-panel inline-flex items-center gap-2.5 rounded-2xl px-2.5 py-3.5 sm:gap-3 sm:px-3">
        {units.map(([label, value], index) => (
          <div key={label} className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex w-14 flex-col items-center transition-transform duration-[var(--dur-med)] ease-[var(--ease-out)] hover:-translate-y-0.5 sm:w-16">
              <span
                className="font-display text-xl font-extrabold tabular-nums leading-none text-primary"
                suppressHydrationWarning
              >
                {String(value).padStart(2, "0")}
              </span>
              <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {label}
              </span>
            </div>
            {/* Separator between tiles, omitted after the last one. */}
            {index < units.length - 1 && (
              <span className="hidden text-lg font-bold text-primary/20 sm:inline" aria-hidden="true">
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
