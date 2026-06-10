"use client";

// "No more…" — a pinned, scroll-scrubbed section. As you scroll, each gripe is
// struck through in sequence (gold line draws across, text dims), then the
// resolution line draws in. A JS handler maps scroll progress to per-line CSS
// vars (--s0..--s3, --sr); all visual interpolation is in inline calc() off
// those vars, so there are no React re-renders mid-scroll. Reduced-motion shows
// the finished (struck) state in a normal, non-pinned section.

import { useEffect, useRef, useState } from "react";

// The heading already says "No more…"; these read as its continuation. Ordered
// as a rising arc that mirrors the app: do the math, split it fairly, front the
// bill, get paid back. Kept short so each strikes through on one line at 375px.
const GRIPES = [
  "napkin math",
  "“just split it evenly”",
  "fronting the whole bill",
  "chasing people down",
];

// Scroll-progress windows for each strike, then the resolution. Tuned to play
// in sequence with a short hold at the end before the pin releases.
const WINDOWS: [number, number][] = [
  [0.05, 0.24],
  [0.22, 0.41],
  [0.39, 0.58],
  [0.56, 0.75],
];
const RES: [number, number] = [0.8, 0.96];

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);
const seg = (p: number, [a, b]: [number, number]) => clamp01((p - a) / (b - a));

const GOLD = "linear-gradient(to right, rgb(199,166,97), rgb(230,209,148))";
const INDIGO = "linear-gradient(to right, rgb(46,31,97), rgb(89,56,166))";

export default function NoMore() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
  }, []);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;
      WINDOWS.forEach((w, i) =>
        stage.style.setProperty(`--s${i}`, seg(p, w).toFixed(4)),
      );
      stage.style.setProperty("--sr", seg(p, RES).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const content = (
    <div className="mx-auto w-full max-w-2xl px-6">
      <h2 className="font-serif text-[34px] font-bold leading-tight text-text-primary sm:text-[40px]">
        No more<span className="text-gold">…</span>
      </h2>

      <ul className="mt-8 space-y-3.5">
        {GRIPES.map((g, i) => (
          <li key={g}>
            <span className="relative inline-block">
              <span
                className="whitespace-nowrap font-serif text-[clamp(22px,6.2vw,32px)] font-semibold text-text-primary"
                style={{ opacity: `calc(1 - var(--s${i}, 0) * 0.5)` }}
              >
                {g}
              </span>
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                style={{ width: `calc(var(--s${i}, 0) * 100%)`, background: GOLD }}
              />
            </span>
          </li>
        ))}
      </ul>

      <p
        className="mt-12 font-serif text-[26px] font-semibold leading-snug text-text-primary sm:text-[30px]"
        style={{
          opacity: "var(--sr, 0)",
          transform: "translateY(calc((1 - var(--sr, 0)) * 14px))",
        }}
      >
        Just snap it,{" "}
        <span className="relative whitespace-nowrap text-primary">
          split it
          <span
            aria-hidden
            className="absolute -bottom-1 left-0 h-[3px] rounded-full"
            style={{ width: `calc(var(--sr, 0) * 100%)`, background: INDIGO }}
          />
        </span>
        , and get on with dinner.
      </p>
    </div>
  );

  // Reduced motion: static, fully struck, no pin.
  if (reduced) {
    const allDone = {
      "--s0": 1,
      "--s1": 1,
      "--s2": 1,
      "--s3": 1,
      "--sr": 1,
    } as React.CSSProperties;
    return (
      <section className="flex min-h-[60vh] items-center bg-background-deep py-24">
        <div ref={stageRef} style={allDone} className="w-full">
          {content}
        </div>
      </section>
    );
  }

  // Animated: tall section + pinned stage scrubbed by scroll.
  return (
    <section ref={sectionRef} className="relative h-[240vh] bg-background-deep">
      <div
        ref={stageRef}
        className="sticky top-0 flex h-[100dvh] items-center bg-background-deep"
      >
        {content}
      </div>
    </section>
  );
}
