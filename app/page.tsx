// Divvy marketing site (mobile-first website, not an app screen). A fixed web
// header, the signature scroll-split-D hero, web-style content sections, and a
// footer.
//
// The hero auto-detects the four logo sprites in /public/sprites. Until they're
// present it shows a clean fallback hero; the moment they're added (and the page
// is rebuilt / dev-reloaded) the scroll-split activates with zero code changes.

import { existsSync } from "fs";
import { join } from "path";
import Link from "next/link";
import Logo from "@/components/Logo";
import Header from "@/components/landing/Header";
import Reveal from "@/components/landing/Reveal";
import AppTour from "@/components/landing/AppTour";
import NoMore from "@/components/landing/NoMore";
import SettleSection from "@/components/landing/SettleSection";
import SplitHero, { type Sprites } from "@/components/landing/SplitHero";
import { CameraIcon } from "@/components/icons";

const INDIGO_GRAD =
  "linear-gradient(165deg, rgb(40,27,86) 0%, rgb(46,31,97) 45%, rgb(63,42,120) 100%)";

const SPRITES: Sprites = {
  fork: "/sprites/fork.png",
  spoon: "/sprites/spoon.png",
  dTop: "/sprites/d-top.png",
  dBottom: "/sprites/d-bottom.png",
};

function spritesReady(): boolean {
  const dir = join(process.cwd(), "public", "sprites");
  return ["fork.png", "spoon.png", "d-top.png", "d-bottom.png"].every((f) =>
    existsSync(join(dir, f)),
  );
}

export default function Landing() {
  const ready = spritesReady();
  return (
    // overflow-x: clip (NOT hidden) — clips horizontal overflow without
    // creating a scroll container, so the hero's position:sticky still pins.
    <main className="overflow-x-clip bg-background">
      <Header />
      {ready ? <SplitHero sprites={SPRITES} /> : <FallbackHero />}
      <AppTour />
      <NoMore />
      <SettleSection />
      <ClosingCTA />
      <SiteFooter />
    </main>
  );
}

// ── Fallback hero (until sprites land) ───────────────────────────────────────
function FallbackHero() {
  return (
    <section
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ background: INDIGO_GRAD }}
    >
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
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {/* Animated composite logo */}
        <div className="relative h-32 w-32">
          <div
            aria-hidden
            className="a-halo absolute -inset-5 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent, rgba(230,209,148,0.9), transparent 55%, rgba(199,166,97,0.7), transparent)",
              filter: "blur(14px)",
            }}
          />
          <div className="a-float relative h-32 w-32 overflow-hidden rounded-[30px] shadow-[0_16px_40px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
            <Logo className="h-full w-full" />
            <span
              aria-hidden
              className="a-shine absolute -inset-y-4 left-0 w-1/2"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
              }}
            />
          </div>
        </div>

        <h1
          className="a-fadeup mt-7 font-serif text-[64px] font-bold leading-none text-white"
          style={{ animationDelay: "0.15s" }}
        >
          Divvy
        </h1>
        <p
          className="a-fadeup mt-3 font-rounded text-[17px] font-medium text-gold-light"
          style={{ animationDelay: "0.3s" }}
        >
          Split the bill, not the friendship
        </p>
        <Link
          href="/app"
          className="a-fadeup press mt-8 flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-rounded text-[16px] font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
          style={{ animationDelay: "0.5s" }}
        >
          <CameraIcon /> Scan a receipt
        </Link>
      </div>
    </section>
  );
}

// ── Closing CTA ──────────────────────────────────────────────────────────────
function ClosingCTA() {
  return (
    <section
      className="relative overflow-hidden px-6 py-20 text-center"
      style={{ background: INDIGO_GRAD }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "rgb(199,166,97)", opacity: 0.16 }}
      />
      <Reveal className="relative z-10 mx-auto flex max-w-md flex-col items-center">
        <Logo className="a-float h-16 w-16 rounded-[18px] shadow-[0_10px_30px_rgba(0,0,0,0.4)]" />
        <h2 className="mt-5 font-serif text-[30px] font-bold leading-tight text-white">
          Ready to divvy up?
        </h2>
        <p className="mt-2 font-rounded text-[15px] text-gold-light">
          Your next dinner is one photo away from even.
        </p>
        <Link
          href="/app"
          className="press mt-7 flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-rounded text-[16px] font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          <CameraIcon /> Scan a receipt
        </Link>
      </Reveal>
    </section>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer className="border-t border-gold/15 bg-background px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="h-9 w-9 rounded-[10px]" />
          <div>
            <p className="font-serif text-[18px] font-bold text-primary">Divvy</p>
            <p className="font-sans text-[12px] text-text-tertiary">
              Split the bill, not the friendship
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          <a
            href="#tour"
            className="font-rounded text-[14px] font-medium text-text-secondary hover:text-text-primary"
          >
            See the app
          </a>
          <Link
            href="/app"
            className="font-rounded text-[14px] font-medium text-text-secondary hover:text-text-primary"
          >
            Open the app
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-3xl font-sans text-[12px] text-text-tertiary">
        © 2026 Divvy
      </p>
    </footer>
  );
}
