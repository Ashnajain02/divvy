"use client";

// Shared Divvy UI primitives. Native HTML + Tailwind only — no UI library.
// Typography roles from the design system are expressed as className helpers so
// every screen stays on-system.

import React from "react";
import { ChevronLeftIcon } from "@/components/icons";

// ── Typography helpers ──────────────────────────────────────────────────────
export const type = {
  display: "font-serif text-[32px] leading-tight font-bold",
  headline: "font-serif text-[20px] leading-snug font-semibold",
  title: "font-rounded text-[17px] font-semibold",
  body: "font-sans text-[16px]",
  label: "font-rounded text-[15px] font-medium",
  caption: "font-sans text-[13px] font-medium",
  small: "font-rounded text-[12px] font-medium",
  price: "font-rounded text-[16px] font-semibold tabular",
  priceLarge: "font-rounded text-[20px] font-bold tabular",
  button: "font-rounded text-[17px] font-semibold",
  quote: "font-serif text-[14px] italic",
  sectionHeader:
    "font-rounded text-[11px] font-bold uppercase tracking-[1.2px]",
};

// ── Background flourish ─────────────────────────────────────────────────────
// Two giant blurred ellipses — pure decoration on Home / Summary.
export function BackgroundFlourish() {
  return (
    <div
      aria-hidden
      className="flourish fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div
        className="absolute -left-32 -top-40 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgb(199,166,97)", opacity: 0.1 }}
      />
      <div
        className="absolute -bottom-44 -right-36 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "rgb(46,31,97)", opacity: 0.05 }}
      />
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[14px] bg-card p-[14px] shadow-[0_3px_8px_rgba(0,0,0,0.05)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "destructive";
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const base =
    "press flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] px-5 py-3.5 text-center transition-transform disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
    type.button;
  const variants: Record<string, string> = {
    primary:
      "text-white shadow-[0_3px_8px_rgba(46,31,97,0.25)] focus-visible:ring-primary",
    secondary:
      "bg-background-deep text-text-primary border border-gold/30 focus-visible:ring-gold",
    destructive: "bg-destructive text-white focus-visible:ring-destructive",
  };
  const style =
    variant === "primary"
      ? {
          backgroundImage:
            "linear-gradient(to bottom right, rgb(46,31,97), rgb(89,56,166))",
        }
      : undefined;
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}

// Small gold capsule "Request" button.
export function GoldButton({
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`press inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-text-primary ${type.label} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(to right, rgb(199,166,97), rgb(230,209,148))",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// Sticky bottom action bar with safe-area padding. Screens drop their CTAs here.
export function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gold/15 bg-background/90 backdrop-blur">
      <div className="safe-bottom mx-auto max-w-3xl space-y-3 px-6 pt-4">
        {children}
      </div>
    </div>
  );
}

// Bottom sheet on phones, centered dialog on larger screens. Closes on backdrop
// tap and Escape. `labelledBy` wires the heading for screen readers.
export function Sheet({
  onClose,
  children,
  labelledBy,
}: {
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="safe-bottom max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[22px] bg-card px-5 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.2)] sm:rounded-[22px] sm:pb-5 sm:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
      >
        {/* Grab handle (phones) */}
        <div
          aria-hidden
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-text-tertiary/40 sm:hidden"
        />
        {children}
      </div>
    </div>
  );
}

// ── Section header ──────────────────────────────────────────────────────────
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-1 pb-2 pt-1">
      <span className="inline-block h-2 w-2 rounded-full bg-gold" />
      <span className={`${type.sectionHeader} text-text-secondary`}>
        {children}
      </span>
    </div>
  );
}

// ── Gold divider ────────────────────────────────────────────────────────────
export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-[0.8px] w-full ${className}`}
      style={{
        background:
          "linear-gradient(to right, rgb(199,166,97), rgb(230,209,148))",
        opacity: 0.5,
      }}
    />
  );
}

// ── Person chip ─────────────────────────────────────────────────────────────
export function Chip({
  selected,
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      aria-pressed={selected}
      className={`press min-h-10 rounded-full px-3.5 py-1.5 ${type.label} transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        selected
          ? "bg-primary text-white"
          : "border border-gold/30 bg-background-deep text-text-primary"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block h-7 w-7 animate-spin rounded-full border-[3px] border-gold/30 border-t-primary ${className}`}
    />
  );
}

// ── Nav bar (simple centered title with optional left/right slots) ──────────
export function NavBar({
  title,
  left,
  right,
}: {
  title: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gold/15 bg-background/85 px-4 backdrop-blur">
      <div className="flex w-16 justify-start">{left}</div>
      <h1 className={`${type.title} text-text-primary`}>{title}</h1>
      <div className="flex w-16 justify-end">{right}</div>
    </div>
  );
}

// A back chevron button for nav bars.
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Go back"
      className="press -ml-2 flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-background-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <ChevronLeftIcon className="h-5 w-5" />
    </button>
  );
}
