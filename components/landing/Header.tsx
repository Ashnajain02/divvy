"use client";

// Web-style sticky site header. Transparent over the indigo hero, then
// solidifies to cream once you scroll past it. This is what gives the page a
// "website" feel rather than an app screen.

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-gold/15 bg-background/85 backdrop-blur"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 rounded-[9px]" />
          <span
            className={`font-serif text-[20px] font-bold transition-colors ${
              scrolled ? "text-primary" : "text-white"
            }`}
          >
            Divvy
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <a
            href="#tour"
            className={`hidden rounded-full px-3 py-2 font-rounded text-[14px] font-medium transition-colors sm:block ${
              scrolled
                ? "text-text-secondary hover:text-text-primary"
                : "text-white/80 hover:text-white"
            }`}
          >
            See the app
          </a>
          <Link
            href="/app"
            className="press flex min-h-10 items-center rounded-full px-4 py-2 font-rounded text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(46,31,97,0.35)]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(46,31,97), rgb(89,56,166))",
            }}
          >
            Start splitting
          </Link>
        </nav>
      </div>
    </header>
  );
}
