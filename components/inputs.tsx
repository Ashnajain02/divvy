"use client";

import { useEffect, useRef, useState } from "react";
import { type as T } from "@/components/ui";

// Underlined, transparent text field that reads as editable but stays on-system.
export function TextField({
  value,
  onChange,
  className = "",
  ariaLabel,
  placeholder,
  autoFocus,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <input
      type="text"
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      autoFocus={autoFocus}
      enterKeyHint={onEnter ? "done" : undefined}
      autoComplete="off"
      autoCorrect="off"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className={`min-h-11 w-full rounded-[10px] border border-transparent bg-background-deep/40 px-3 py-2 ${T.body} text-text-primary outline-none placeholder:text-text-tertiary focus:border-gold/40 focus:bg-background-deep/70 ${className}`}
    />
  );
}

// Money input. Keeps a local string buffer so partial entries ("16.", "") feel
// natural, while emitting a parsed number to the parent. Wrapped in a <label>
// so a tap anywhere in the field (including the "$") focuses the input in one go.
export function MoneyInput({
  value,
  onChange,
  className = "",
  ariaLabel,
  align = "right",
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  ariaLabel?: string;
  align?: "left" | "right";
}) {
  const [buffer, setBuffer] = useState(() => formatBuffer(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-sync when the external value changes and isn't mid-edit-equivalent.
  useEffect(() => {
    const parsed = parseFloat(buffer);
    if (!Number.isFinite(parsed) || Math.abs(parsed - value) > 0.001) {
      setBuffer(formatBuffer(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label
      className={`flex min-h-11 cursor-text items-center rounded-[10px] border border-transparent bg-background-deep/40 px-3 focus-within:border-gold/40 focus-within:bg-background-deep/70 ${className}`}
    >
      <span className={`${T.price} text-text-secondary`}>$</span>
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        enterKeyHint="done"
        value={buffer}
        aria-label={ariaLabel}
        onChange={(e) => {
          const v = e.target.value;
          setBuffer(v);
          const n = parseFloat(v);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        // Select the existing amount on focus so typing overwrites it.
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => setBuffer(formatBuffer(value))}
        className={`w-full bg-transparent py-2 ${T.price} text-text-primary outline-none ${
          align === "right" ? "text-right" : "text-left"
        }`}
      />
    </label>
  );
}

function formatBuffer(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "";
  return String(Math.round(n * 100) / 100);
}
