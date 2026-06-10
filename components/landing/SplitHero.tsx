"use client";

// The signature moment: as you scroll, the fork and spoon pull the two halves
// of the D apart (diagonally, matching the logo), revealing the Divvy wordmark
// underneath. Scroll-scrubbed and pinned — a JS handler maps scroll progress to
// a single `--p` (0→1) CSS variable on the stage, and all transforms derive
// from it in CSS (see globals.css), so there are zero React re-renders mid-scroll.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CameraIcon, ChevronDownIcon } from "@/components/icons";

const INDIGO_GRAD =
  "linear-gradient(165deg, rgb(40,27,86) 0%, rgb(46,31,97) 45%, rgb(63,42,120) 100%)";

export type Sprites = {
  fork: string;
  spoon: string;
  dTop: string;
  dBottom: string;
};

export default function SplitHero({ sprites }: { sprites: Sprites }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
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
      // Split finishes at 70% of the scrub; the rest is a hold on the reveal.
      const q = Math.min(p / 0.7, 1);
      stage.style.setProperty("--p", p.toFixed(4));
      stage.style.setProperty("--q", q.toFixed(4));
      const cta = ctaRef.current;
      if (cta) {
        const shown = p > 0.82 ? "1" : "0";
        if (cta.getAttribute("data-shown") !== shown)
          cta.setAttribute("data-shown", shown);
      }
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

  // ── Reduced motion: a calm static hero, no pin/scrub ───────────────────────
  if (reduced) {
    return (
      <section
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center"
        style={{ background: INDIGO_GRAD }}
      >
        <div className="relative aspect-square w-[min(64vw,300px)]">
          <Stack sprites={sprites} />
        </div>
        <h1 className="mt-6 font-serif text-[56px] font-bold leading-none text-white">
          Divvy
        </h1>
        <p className="mt-3 font-rounded text-[16px] font-medium text-gold-light">
          Split the bill, not the friendship
        </p>
        <Link
          href="/app"
          className="press mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-rounded text-[17px] font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          <CameraIcon /> Scan a receipt
        </Link>
      </section>
    );
  }

  // ── Animated: tall section + pinned stage ──────────────────────────────────
  return (
    <section ref={sectionRef} className="relative h-[260vh]">
      <div
        ref={stageRef}
        className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center overflow-hidden"
        style={{ background: INDIGO_GRAD }}
      >
        {/* Ambient blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgb(199,166,97)", opacity: 0.16 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -right-24 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "rgb(89,56,166)", opacity: 0.45 }}
        />

        {/* The splitting logo */}
        <div className="relative aspect-square w-[min(72vw,360px)]">
          {/* Revealed underneath (behind the sprite layers) */}
          <div className="split-reveal absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-[clamp(44px,13vw,72px)] font-bold leading-none text-white">
              Divvy
            </span>
            <span className="mt-2 font-rounded text-[clamp(12px,3.5vw,16px)] font-medium text-gold-light">
              Split the bill, not the friendship
            </span>
          </div>
          {/* Sprite layers (on top). Order: spoon group then fork group. */}
          <Stack sprites={sprites} />
        </div>

        {/* End-of-scrub CTA */}
        <div
          ref={ctaRef}
          data-shown="0"
          className="split-cta absolute bottom-[14dvh] left-1/2 -translate-x-1/2"
        >
          <Link
            href="/app"
            className="press flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-4 font-rounded text-[17px] font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
          >
            <CameraIcon /> Scan a receipt
          </Link>
        </div>

        {/* Scroll cue */}
        <div className="split-cue absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <span className="font-rounded text-[12px] font-medium uppercase tracking-[1.2px] text-white/60">
            Scroll to split
          </span>
          <ChevronDownIcon className="a-bob h-5 w-5 text-white/60" />
        </div>
      </div>
    </section>
  );
}

// Stacked sprite layers. Because each PNG is exported on the same canvas in its
// original position, stacking them reproduces the logo; the split-top/-bottom
// classes pull each group apart from there.
function Stack({ sprites }: { sprites: Sprites }) {
  return (
    <>
      {/* eslint-disable @next/next/no-img-element */}
      <img src={sprites.spoon} alt="" className="split-layer split-bottom" />
      <img src={sprites.dBottom} alt="" className="split-layer split-bottom" />
      <img src={sprites.dTop} alt="" className="split-layer split-top" />
      <img src={sprites.fork} alt="" className="split-layer split-top" />
      {/* eslint-enable @next/next/no-img-element */}
    </>
  );
}
