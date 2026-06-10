"use client";

// PostHog product analytics. Initializes only when NEXT_PUBLIC_POSTHOG_KEY is
// set, so the app runs fine without it (dev, or before you've added the key).
// Autocapture records every click/element automatically; we also fire named
// funnel events via lib/track. Pageviews are captured on route change since the
// App Router does client-side navigation.

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

function PageViews() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname && posthog.__loaded) posthog.capture("$pageview");
  }, [pathname]);
  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false, // captured manually above for the App Router
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
    });
  }, []);

  return (
    <PHProvider client={posthog}>
      <PageViews />
      {children}
    </PHProvider>
  );
}
