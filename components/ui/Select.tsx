"use client";

import { Children, isValidElement, useMemo } from "react";
import type { ReactNode } from "react";
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
  name,
  variant = "light",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
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

  return (
    <RadixSelect.Root
      value={radixValue}
      onValueChange={(next) => onChange({ target: { value: next === EMPTY_VALUE ? "" : next } })}
      disabled={disabled}
      name={name}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={`group flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-base outline-none transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] sm:text-sm ${TRIGGER_VARIANTS[variant]} ${className}`}
      >
        <RadixSelect.Value placeholder={placeholder}>{selectedLabel}</RadixSelect.Value>
        <RadixSelect.Icon>
          <ChevronIcon />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          className="admin-scroll-light z-[70] max-h-72 w-[var(--radix-select-trigger-width)] overflow-y-auto rounded-2xl border border-hairline-strong bg-white p-1.5 shadow-[var(--elev-3)] animate-pop-in"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-secondary/10 data-[highlighted]:text-secondary data-[state=checked]:font-semibold data-[state=checked]:text-primary"
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
  name?: string;
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
