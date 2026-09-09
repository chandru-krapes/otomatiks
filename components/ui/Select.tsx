"use client";

import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { labelClass } from "@/components/ui/Field";

/**
 * Themed replacement for the native `<select>` — the browser renders its dropdown list with
 * its own OS chrome no amount of CSS on the `<select>` element can reach, which is what read
 * as "cheap" next to the rest of the console. Built on Radix's unstyled `Select` primitive so
 * every part (trigger, panel, options, check mark) is themed to match.
 *
 * Shared by the admin console and the public booking/community flow, so every dropdown
 * across the app is the same themed control — `components/ui/Field.tsx`'s native
 * `<select>`/`selectClass` are kept only for the rare spot that still wants OS chrome.
 *
 * Accepts the same `<option>` children every existing call site already writes, so swapping
 * the import (or the tag, for a bare `<select>`) is the only change needed — no need to
 * rewrite call sites into an options-array API. `onChange` is called with a synthetic
 * `{ target: { value } }` for the same reason: every caller already does
 * `onChange={(e) => setX(e.target.value)}`.
 */

/** Radix's `Select.Item` rejects an empty-string `value` outright, but "" is exactly what a
 * placeholder option (`<option value="">— Select —</option>`) needs to mean "nothing chosen"
 * — so it's remapped to this sentinel internally and back to "" at the `onChange` boundary. */
const EMPTY_VALUE = "__select_empty__";

interface OptionData {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Flattens an `<option>`'s children down to plain text — same as reading its `.textContent`
 * would in the DOM. A single string/number child was the only case handled before, so an
 * option built from more than one expression (`{event.title} {status && \`(${status})\`}`,
 * the common case for anything with a computed label) fell through to showing the raw
 * `value` instead — the event id turning up in place of its title, list and trigger alike. */
function childrenToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join("");
  if (isValidElement(node)) return childrenToText((node.props as { children?: ReactNode }).children);
  return "";
}

function extractOptions(children: ReactNode): OptionData[] {
  const options: OptionData[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child) || child.type !== "option") return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    const rawValue = props.value === undefined || props.value === null ? "" : String(props.value);
    const label = childrenToText(props.children).trim() || rawValue;
    options.push({ value: rawValue === "" ? EMPTY_VALUE : rawValue, label, disabled: props.disabled });
  });
  return options;
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 transition-transform duration-[var(--dur-fast)] group-data-[state=open]:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

const TRIGGER_VARIANTS = {
  light:
    "border-primary/15 bg-white text-foreground hover:border-primary/30 focus:border-secondary focus:ring-4 focus:ring-secondary/12 data-[state=open]:border-secondary data-[state=open]:ring-4 data-[state=open]:ring-secondary/12 data-[placeholder]:text-muted/60 disabled:cursor-not-allowed disabled:bg-primary/4 disabled:text-muted",
  dark:
    "border-white/10 bg-white/[0.06] text-on-surface hover:border-white/25 focus:border-secondary focus:ring-4 focus:ring-secondary/20 data-[state=open]:border-secondary data-[state=open]:ring-4 data-[state=open]:ring-secondary/20 data-[placeholder]:text-on-surface/40",
};

export function Select({
  value,
  onChange,
  children,
  className = "",
  placeholder,
  disabled,
  required,
  name,
  variant = "light",
  searchable = false,
  searchPlaceholder = "Type to filter…",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Adds a text filter at the top of the panel — for a long, alphabetical option list (every
   * school, every district, …) where scrolling to find one by eye is the slow way to use this
   * control. Filters client-side against each option's own label. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Forwarded to Radix's `Select.Root` (real bubble-input validation), plus `aria-required` on
   * the trigger. Not a hard guarantee on its own here — an explicit `<option value="">` (the
   * "Select…" placeholder item some call sites add so the resting label reads right; see that
   * item's own comment where it's used) is itself a real, selectable value as far as this
   * component and the browser are concerned, so picking it still counts as "answered". Pair with
   * an actual submit-time check wherever leaving it on that placeholder must be blocked. */
  required?: boolean;
  name?: string;
  variant?: "light" | "dark";
  /** For a select with no visible `<label>` of its own (e.g. AttendeeCard's saved-student
   * quick-fill) — forwarded straight to the trigger button. */
  "aria-label"?: string;
}) {
  const options = useMemo(() => extractOptions(children), [children]);
  const radixValue = value === "" ? EMPTY_VALUE : value;
  // Radix's `Select.Value` only knows an item's display text once that item has actually
  // rendered into the DOM at least once (i.e. the panel has been opened) — until then it
  // falls back to showing the raw `value` itself, which is how a value like an event's numeric
  // id ended up on screen instead of its title on first load. Looking the label up ourselves
  // from the already-extracted `options` and passing it as `Value`'s children sidesteps that
  // entirely, so the trigger shows the right text before the panel has ever been opened.
  const selectedLabel = options.find((option) => option.value === radixValue)?.label;

  // Panel open state is tracked here (rather than left to Radix's own uncontrolled default)
  // purely so `searchable` can reset the filter text on close and grab focus on open — see
  // the search `<input>` below.
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const needle = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query, searchable]);

  /**
   * Radix's own built-in "type a letter, jump to the matching item" search runs on every
   * keystroke inside an open panel, and reassigns DOM focus onto the item it jumps to — which,
   * once this filter box exists, stole focus back out of it after every single character (only
   * the first ever landed; every keystroke after was fielded by whatever item Radix's own
   * search had just focused instead, not this input). Radix composes a consumer-supplied
   * `onKeyDown` on `Content` *ahead of* that internal handler and skips its own handling once
   * `preventDefault()` has been called — the documented escape hatch for exactly this — so
   * intercepting printable keys here and applying them to `query` ourselves (character keys
   * and Backspace only; Escape/Arrow/Enter are left alone so closing and keyboard-navigating
   * the still-open, already-filtered list keep working) avoids that internal handler, and the
   * focus steal, entirely. */
  function handleContentKeyDown(event: KeyboardEvent) {
    if (!searchable) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      setQuery((current) => current.slice(0, -1));
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      setQuery((current) => current + event.key);
    }
  }

  // Radix moves focus onto the panel itself (typically the selected/first item) the moment it
  // opens — a `requestAnimationFrame` fires just after that so this steal actually wins,
  // landing the cursor in the filter box instead of on an item.
  useEffect(() => {
    if (searchable && open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [searchable, open]);

  return (
    <RadixSelect.Root
      value={radixValue}
      onValueChange={(next) => onChange({ target: { value: next === EMPTY_VALUE ? "" : next } })}
      disabled={disabled}
      required={required}
      name={name}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          // Radix moves focus onto the panel itself (typically the selected/first item) the
          // moment it opens; a `requestAnimationFrame` fires just after that so this steal
          // actually wins, landing the cursor in the filter box instead of on an item.
          if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
        } else {
          setQuery("");
        }
      }}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        aria-required={required || undefined}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-base outline-none transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] sm:text-sm ${TRIGGER_VARIANTS[variant]} ${className}`}
      >
        {/* `min-w-0` is load-bearing: as a flex child, this element's default min-width is
            "auto" (its content's width), which lets it overflow past the trigger and wrap onto
            a second line instead of truncating — growing this control taller than every plain
            input beside it in the same row (see DatePicker's identical fix). */}
        <RadixSelect.Value placeholder={placeholder} className="block min-w-0 flex-1 truncate">
          {selectedLabel}
        </RadixSelect.Value>
        <RadixSelect.Icon>
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          onKeyDown={handleContentKeyDown}
          // `w-max` (bounded below by the trigger's own width, above by a cap so one very long
          // label can't stretch the panel edge-to-edge) instead of pinning to the trigger's
          // width outright — the old fixed width forced every option's label to wrap onto
          // multiple lines the moment it was longer than the trigger button itself (a school
          // name, say), even though the floating panel has no reason to match that width.
          // Radix's own collision handling still keeps it from overflowing the viewport.
          className="admin-scroll-light z-[70] max-h-72 w-max min-w-[var(--radix-select-trigger-width)] max-w-[26rem] overflow-y-auto rounded-2xl border border-hairline-strong bg-white p-1.5 shadow-[var(--elev-3)] animate-pop-in"
        >
          {searchable && (
            // `sticky` (not a plain flow element above `Viewport`) so it stays pinned to the
            // panel's top edge as the option list scrolls beneath it, rather than scrolling
            // away with everything else — `Content` above is the actual scroll container.
            <div className="sticky top-0 z-10 -mx-1.5 -mt-1.5 mb-1.5 flex items-center gap-2 border-b border-hairline bg-white px-3 py-2">
              <SearchIcon />
              <input
                ref={searchRef}
                type="text"
                value={query}
                // `handleContentKeyDown` above (bubbled up from here) is what actually owns
                // typing — this only needs to catch anything that arrives some other way
                // (paste, an IME composing text, autofill).
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full min-w-[10rem] bg-transparent text-sm text-foreground outline-none placeholder:text-muted/60"
              />
            </div>
          )}
          <RadixSelect.Viewport>
            {searchable && filteredOptions.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted">No matches for &ldquo;{query}&rdquo;.</p>
            )}
            {filteredOptions.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="flex cursor-pointer items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-foreground outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-secondary/10 data-[highlighted]:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary"
              >
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="text-secondary">
                  <CheckIcon />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

/** Convenience wrapper: a labelled field around `Select`, API-compatible with
 * `components/ui/Field.tsx`'s `SelectField` (label/hint/error/fieldClassName + native-select
 * props) so every existing call site only needs its import swapped. */
export function SelectField({
  label,
  hint,
  error,
  fieldClassName,
  children,
  variant,
  ...selectProps
}: {
  label: string;
  hint?: string;
  error?: string;
  fieldClassName?: string;
  children: ReactNode;
  variant?: "light" | "dark";
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${fieldClassName ?? ""}`}>
      <span className={labelClass}>{label}</span>
      <Select variant={variant} {...selectProps}>
        {children}
      </Select>
      {error ? (
        <span role="alert" className="animate-shake text-xs font-medium text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}
