"use client";

// "Settle up" before/after section. Contrasts the group-chat hassle with
// Divvy's one-tap, pre-filled Venmo + live paid-tracking. Reveals on scroll:
// chat bubbles stagger in, the tracker bar fills, the rows appear.

import { useEffect, useRef, useState } from "react";
import { CheckIcon, SendIcon } from "@/components/icons";

const BUBBLES = [
  "what’s your venmo again?",
  "wait how much do I owe?",
  "did everyone pay me back??",
];

const PEOPLE = [
  { name: "Sam", initial: "S", paid: true },
  { name: "You", initial: "Y", paid: true },
  { name: "Jordan", initial: "J", paid: false },
  { name: "Alex", initial: "A", paid: false },
];

export default function SettleSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const r =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    setReduced(r);
    if (r) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Staggered reveal style for an element (skipped under reduced motion).
  const reveal = (delay: number, y = 14): React.CSSProperties | undefined =>
    reduced
      ? undefined
      : {
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : `translateY(${y}px)`,
          transition:
            "opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1)",
          transitionDelay: `${delay}ms`,
        };

  return (
    <section className="bg-background px-6 py-20">
      <div ref={ref} className="mx-auto max-w-3xl">
        <p
          className="text-center font-rounded text-[11px] font-bold uppercase tracking-[1.2px] text-gold"
          style={reveal(0)}
        >
          Settle up
        </p>
        <h2
          className="mt-2 text-center font-serif text-[30px] font-bold leading-tight text-text-primary"
          style={reveal(80)}
        >
          No more “what’s your Venmo?”
        </h2>
        <p
          className="mx-auto mt-3 max-w-md text-center font-sans text-[15px] leading-relaxed text-text-secondary"
          style={reveal(160)}
        >
          Divvy pre-fills the amount and the person — one tap to pay. Then it
          tracks who’s settled, so you’re not the one chasing.
        </p>

        <div className="mt-10 grid items-stretch gap-5 sm:grid-cols-2">
          {/* ── Before: the group chat ─────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-[20px] bg-background-deep p-5"
            style={reveal(220)}
          >
            <p className="mb-4 font-rounded text-[12px] font-semibold uppercase tracking-wide text-text-tertiary">
              The group chat
            </p>
            <div className="flex flex-1 flex-col justify-end gap-2">
              {BUBBLES.map((b, i) => (
                <div
                  key={b}
                  className="max-w-[88%] self-start rounded-2xl rounded-bl-md bg-card px-3.5 py-2 font-sans text-[14px] text-text-secondary shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  style={reveal(360 + i * 180)}
                >
                  {b}
                </div>
              ))}
              <p
                className="mt-1 font-sans text-[12px] text-text-tertiary"
                style={reveal(360 + BUBBLES.length * 180)}
              >
                Seen · 3 days later
              </p>
            </div>
          </div>

          {/* ── After: Divvy ───────────────────────────────────────────────── */}
          <div
            className="flex flex-col rounded-[20px] border border-gold/25 bg-card p-5 shadow-[0_4px_16px_rgba(46,31,97,0.08)]"
            style={reveal(300)}
          >
            <p className="mb-4 font-rounded text-[12px] font-semibold uppercase tracking-wide text-gold">
              With Divvy
            </p>

            {/* Paid tracker */}
            <div className="mb-4">
              <div className="flex items-baseline justify-between">
                <span className="font-rounded text-[13px] font-semibold text-success">
                  $42.10 paid
                </span>
                <span className="font-rounded text-[13px] font-medium text-text-tertiary">
                  $42.10 left
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-deep">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: reduced ? "50%" : shown ? "50%" : "0%",
                    background: "rgb(64,158,122)",
                    transition: "width .9s cubic-bezier(.2,.7,.2,1) .45s",
                  }}
                />
              </div>
            </div>

            {/* People rows */}
            <ul className="flex flex-1 flex-col justify-center gap-2.5">
              {PEOPLE.map((p, i) => (
                <li
                  key={p.name}
                  className="flex items-center gap-2.5"
                  style={reveal(520 + i * 120)}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-rounded text-[12px] font-bold"
                    style={{
                      background: p.paid
                        ? "rgba(64,158,122,0.18)"
                        : "rgba(46,31,97,0.12)",
                      color: p.paid ? "rgb(64,158,122)" : "rgb(46,31,97)",
                    }}
                  >
                    {p.initial}
                  </span>
                  <span className="flex-1 font-rounded text-[14px] font-medium text-text-primary">
                    {p.name}
                  </span>
                  {p.paid ? (
                    <span className="inline-flex items-center gap-1 font-rounded text-[13px] font-semibold text-success">
                      <CheckIcon className="h-4 w-4" /> Paid
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-rounded text-[13px] font-semibold text-text-primary"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgb(199,166,97), rgb(230,209,148))",
                      }}
                    >
                      <SendIcon className="h-3.5 w-3.5" /> Venmo
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <p
              className="mt-4 font-sans text-[12px] leading-snug text-text-tertiary"
              style={reveal(960)}
            >
              Amount and @handle already filled in — just confirm.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
