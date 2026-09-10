"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { searchSchools } from "@/lib/schoolSearch";
import type { School } from "@/lib/schools";
import { labelClass } from "./Field";

const MIN_QUERY_LENGTH = 2;

/**
 * Type-ahead replacement for the old fixed 15-school Chennai-only dropdown — backed by
 * `lib/schools.ts`'s full Tamil Nadu directory (2,322 schools) with fuzzy matching (see
 * `lib/schoolSearch.ts`). Unlike that dropdown, there's no separate "Other — enter manually"
 * branch: this *is* a plain text field (whatever's typed is the value, matched or not), a
 * floating list of the best fuzzy matches just appears alongside it to save typing the rest of
 * a long name — so a school that isn't in the sheet still works exactly like free text always
 * did.
 */
export default function SchoolCombobox({
  value,
  onChange,
  label = "School",
  required,
  placeholder = "Start typing your school's name…",
  fieldClassName = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  fieldClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const inputId = `${reactId}-input`;
  const listId = `${reactId}-list`;

  const results = useMemo(() => (value.trim().length >= MIN_QUERY_LENGTH ? searchSchools(value) : []), [value]);

  // Closes on any interaction outside this field — `pointerdown`, not `click`/`blur`, so it
  // fires before a tap on a result button's own `onPointerDown` handler (see below), matching
  // the touch-safety approach `components/ui/Select.tsx` already uses for its search input.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function pick(school: School) {
    onChange(school.name);
    setOpen(false);
  }

  const showList = open && value.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${fieldClassName}`}>
      <label className={labelClass} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        required={required}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          // Reset here (a real event handler), not in an effect keyed on `value` — every
          // keystroke changes the result list, so the previously-highlighted index rarely still
          // makes sense once it does.
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (!showList || results.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlighted((current) => Math.min(current + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlighted((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            pick(results[highlighted]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-xl border border-primary/15 bg-white px-4 py-3 text-base text-foreground outline-none transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-primary/30 focus:border-secondary focus:ring-4 focus:ring-secondary/12 sm:text-sm"
      />
      {showList && (
        <div
          id={listId}
          role="listbox"
          className="admin-scroll-light absolute left-0 right-0 top-full z-[70] mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-hairline-strong bg-white p-1.5 shadow-[var(--elev-3)] animate-pop-in"
        >
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">
              No matches — you can still enter your school&rsquo;s name as typed.
            </p>
          ) : (
            results.map((school, index) => (
              <button
                key={`${school.name}|${school.district}|${school.block}`}
                type="button"
                role="option"
                aria-selected={index === highlighted}
                onMouseEnter={() => setHighlighted(index)}
                // `onPointerDown`, not `onClick` — fires before the input's own blur closes the
                // list, so the tap always lands on the intended item instead of racing a close.
                onPointerDown={(event) => {
                  event.preventDefault();
                  pick(school);
                }}
                className={`flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  index === highlighted ? "bg-secondary/10 text-secondary" : "text-foreground"
                }`}
              >
                <span className="font-medium">{school.name}</span>
                {(school.block || school.district) && (
                  <span className="text-xs text-muted">{[school.block, school.district].filter(Boolean).join(", ")}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
