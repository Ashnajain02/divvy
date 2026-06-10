// Thin client-side analytics helper. Fires a named event to PostHog. No-ops on
// the server or when PostHog isn't initialized (no key), so it's always safe to
// call from client components.

import posthog from "posthog-js";

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // analytics must never break the app
  }
}
