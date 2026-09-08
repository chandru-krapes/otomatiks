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

// Countdown to the event start.


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
