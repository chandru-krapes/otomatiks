"use client";

import { useRef } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";

const LENGTH = 6;

// Six segmented digit boxes acting as one code value for the event website
export default function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  // Fired once the 6th digit lands for the event website
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("");
    onChange(joined);
    if (joined.length === LENGTH && !joined.includes("")) onComplete?.(joined);
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = digits.slice();
    for (let i = 0; i < pasted.length && index + i < LENGTH; i++) next[index + i] = pasted[i];
    const joined = next.join("");
    onChange(joined);
    const lastFilled = Math.min(index + pasted.length, LENGTH) - 1;
    refs.current[lastFilled]?.focus();
    if (joined.length === LENGTH && !joined.includes("")) onComplete?.(joined);
  }

  return (
    <div role="group" aria-label="Verification code" className="flex items-center gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-label={`Digit ${index + 1} of ${LENGTH}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.target.select()}
          className={`h-12 w-10 rounded-xl border bg-white text-center text-lg font-bold text-primary outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus:border-secondary focus:ring-4 focus:ring-secondary/12 disabled:cursor-not-allowed disabled:bg-primary/4 sm:h-14 sm:w-12 sm:text-xl ${
            error ? "border-red-400 ring-4 ring-red-500/10" : "border-primary/15 hover:border-primary/30"
          }`}
        />
      ))}
    </div>
  );
}
