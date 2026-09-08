"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { uploadMedia } from "@/lib/adminApi";
import type { EmailPlaceholder } from "@/lib/adminTypes";
import type { useAdminSession } from "./useAdminSession";
import Alert from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/ui/Field";

export type WithAuth = ReturnType<typeof useAdminSession>["withAuth"];

export const EMOJI_PALETTE = [
  "🎉", "🎟️", "✅", "❌", "⏰", "📅", "📍", "💳", "💰", "🔁",
  "📧", "🔔", "🎓", "🏆", "🚀", "👋", "🙏", "😀", "😊", "🎊",
];

export function applyPlaceholderSamples(text: string, placeholders: EmailPlaceholder[]): string {
  const samples = new Map(placeholders.map((p) => [p.key, p.sample]));
  const loopVars = new Set(Array.from(text.matchAll(/\{%\s*for\s+(\w+)\s+in\s+\w+/g)).map((m) => m[1]));
  return text.replace(/\{\{\s*([\w.]+)(?:\|[^}]*)?\s*\}\}/g, (full, path: string) => {
    const root = path.split(".")[0];
    if (loopVars.has(root)) return full;
    const sample = samples.get(path) ?? samples.get(root);
    return sample ?? full;
  });
}

export function findUnknownPlaceholders(text: string, placeholders: EmailPlaceholder[]): string[] {
  const known = new Set(placeholders.map((p) => p.key));
  const loopVars = new Set(Array.from(text.matchAll(/\{%\s*for\s+(\w+)\s+in\s+\w+/g)).map((m) => m[1]));
  const found = new Set<string>();
  for (const match of text.matchAll(/\{\{\s*([\w.]+)(?:\|[^}]*)?\s*\}\}/g)) {
    const path = match[1];
    const root = path.split(".")[0];
    if (known.has(path) || known.has(root) || loopVars.has(root)) continue;
    found.add(path);
  }
  return Array.from(found);
}

export function ToolbarButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Highlights the button as "on" */
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()} // keep focus/selection inside the editor
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-primary hover:bg-primary/8 disabled:opacity-50 ${active ? "bg-primary/10" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-primary/12" />;
}

const TEXT_COLORS = ["#0b1f3a", "#066aab", "#e11d48", "#d97706", "#059669", "#7c3aed", "#475569", "#ffffff"];
const HIGHLIGHT_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa", "#e9d5ff", "transparent"];

function ColorPopover({ colors, onPick }: { colors: string[]; onPick: (color: string) => void }) {
  return (
    <div className="absolute left-0 top-full z-20 mt-1 grid w-40 grid-cols-4 gap-1.5 rounded-xl border border-hairline-strong bg-white p-2 shadow-[var(--elev-2)]">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color === "transparent" ? "No highlight" : color}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(color)}
          className="h-6 w-6 rounded-md border border-hairline-strong"
          style={{ background: color === "transparent" ? "repeating-conic-gradient(#ddd 0% 25%, white 0% 50%) 50% / 8px 8px" : color }}
        />
      ))}
    </div>
  );
}

export function InsertPlaceholderMenu({ placeholders, onInsert }: { placeholders: EmailPlaceholder[]; onInsert: (token: string) => void }) {
  if (placeholders.length === 0) return null;
  return (
    <div className="w-48">
      <Select
        value=""
        onChange={(event) => {
          if (event.target.value) onInsert(`{{ ${event.target.value} }}`);
        }}
        placeholder="Insert placeholder"
      >
        <option value="">Insert placeholder</option>
        {placeholders.map((p) => (
          <option key={p.key} value={p.key}>{p.label}</option>
        ))}
      </Select>
    </div>
  );
}

const BLOCK_FORMATS = [
  { value: "P", label: "Normal" },
  { value: "H1", label: "Heading 1" },
  { value: "H2", label: "Heading 2" },
  { value: "H3", label: "Heading 3" },
  { value: "BLOCKQUOTE", label: "Quote" },
];

const FONT_FAMILIES = [
  { value: "", label: "Sans Serif" },
  { value: "Georgia, 'Times New Roman', serif", label: "Serif" },
  { value: "'Courier New', Consolas, monospace", label: "Monospace" },
];

function ToolbarSelect({ options, onPick, width }: { options: { value: string; label: string }[]; onPick: (value: string) => void; width: string }) {
  return (
    <select
      defaultValue={options[0]?.value}
      onChange={(e) => {
        onPick(e.target.value);
        e.target.value = options[0]?.value ?? "";
      }}
      className={`${width} shrink-0 cursor-pointer rounded-lg border-none bg-transparent px-1.5 py-1 text-xs font-medium text-primary outline-none hover:bg-primary/8`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  );
}

function PlaceholderChip({ placeholder, onInsert }: { placeholder: EmailPlaceholder; onInsert: (token: string) => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onInsert(`{{ ${placeholder.key} }}`)}
      title={placeholder.sample ? `e.g. ${placeholder.sample}` : undefined}
      className="rounded-lg border border-primary/12 bg-primary/[0.03] px-3 py-2 text-left text-xs font-medium text-muted transition-colors hover:border-secondary/30 hover:bg-secondary/8 hover:text-secondary"
    >
      <span className="block truncate font-mono text-[11px] text-primary">{`{{${placeholder.key}}}`}</span>
      <span className="block truncate">{placeholder.label}</span>
    </button>
  );
}

export function RichBodyEditor({
  value,
  onChange,
  resetKey,
  uploadFolder,
  withAuth,
  placeholders,
}: {
  value: string;
  onChange: (html: string) => void;
  resetKey: number;
  uploadFolder: string;
  withAuth: WithAuth;
  placeholders?: EmailPlaceholder[];
}) {
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = value;
  }, [resetKey]);

  function rememberSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function focusAtSavedSelection() {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function exec(command: string, arg?: string) {
    focusAtSavedSelection();
    document.execCommand(command, false, arg);
    onChange(editorRef.current?.innerHTML ?? "");
    rememberSelection();
  }

  function handleLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    const result = await withAuth((token) => uploadMedia(token, file, uploadFolder));
    setUploading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    exec("insertHTML", `<img src="${result.data.url}" style="max-width:100%" />`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-primary/15 bg-primary/[0.03] p-1.5">
        <ToolbarSelect width="w-[5.5rem]" options={BLOCK_FORMATS} onPick={(format) => exec("formatBlock", format)} />
        <ToolbarSelect width="w-[5.5rem]" options={FONT_FAMILIES} onPick={(font) => exec("fontName", font)} />
        <ToolbarDivider />
        <ToolbarButton label="Bold" onClick={() => exec("bold")}><strong>B</strong></ToolbarButton>
        <ToolbarButton label="Italic" onClick={() => exec("italic")}><em>I</em></ToolbarButton>
        <ToolbarButton label="Underline" onClick={() => exec("underline")}><span className="underline">U</span></ToolbarButton>
        <ToolbarButton label="Strikethrough" onClick={() => exec("strikeThrough")}><span className="line-through">S</span></ToolbarButton>
        <ToolbarButton label="Quote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}>&ldquo;</ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Bulleted list" onClick={() => exec("insertUnorderedList")}>&#8226;&#8801;</ToolbarButton>
        <ToolbarButton label="Numbered list" onClick={() => exec("insertOrderedList")}>1.&#8801;</ToolbarButton>
        <ToolbarButton label="Decrease indent" onClick={() => exec("outdent")}>&#8676;</ToolbarButton>
        <ToolbarButton label="Increase indent" onClick={() => exec("indent")}>&#8677;</ToolbarButton>
        <ToolbarDivider />
        <ToolbarButton label="Link" onClick={handleLink}>🔗</ToolbarButton>
        <ToolbarButton label="Insert image" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? "…" : "🖼️"}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(inputEvent) => {
            const file = inputEvent.target.files?.[0];
            inputEvent.target.value = "";
            if (file) handleFile(file);
          }}
        />
        <ToolbarDivider />
        <div className="relative">
          <ToolbarButton label="Text color" onClick={() => setTextColorOpen((open) => !open)}>
            <span className="border-b-2 border-secondary font-bold">A</span>
          </ToolbarButton>
          {textColorOpen && (
            <ColorPopover
              colors={TEXT_COLORS}
              onPick={(color) => {
                exec("foreColor", color);
                setTextColorOpen(false);
              }}
            />
          )}
        </div>
        <div className="relative">
          <ToolbarButton label="Highlight" onClick={() => setHighlightOpen((open) => !open)}>
            <span className="rounded-sm bg-amber-200 px-0.5">H</span>
          </ToolbarButton>
          {highlightOpen && (
            <ColorPopover
              colors={HIGHLIGHT_COLORS}
              onPick={(color) => {
                exec("hiliteColor", color);
                setHighlightOpen(false);
              }}
            />
          )}
        </div>
        <ToolbarButton label="Clear formatting" onClick={() => exec("removeFormat")}>
          <span className="text-xs">T&#775;x</span>
        </ToolbarButton>
        <ToolbarDivider />
        <div className="relative">
          <ToolbarButton label="Emoji" onClick={() => setEmojiOpen((open) => !open)}>🙂</ToolbarButton>
          {emojiOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 grid w-56 grid-cols-8 gap-1 rounded-xl border border-hairline-strong bg-white p-2 shadow-[var(--elev-2)]">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    exec("insertText", emoji);
                    setEmojiOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-base hover:bg-primary/8"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? "")}
        onMouseUp={rememberSelection}
        onKeyUp={rememberSelection}
        onBlur={rememberSelection}
        className={`${inputClass} min-h-[12rem] [&_a]:text-secondary [&_a]:underline [&_img]:max-w-full [&_img]:rounded-lg [&_blockquote]:border-l-2 [&_blockquote]:border-secondary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted`}
      />
      {placeholders && placeholders.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Insert a placeholder</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {placeholders.map((placeholder) => (
              <PlaceholderChip key={placeholder.key} placeholder={placeholder} onInsert={(token) => exec("insertText", token)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
