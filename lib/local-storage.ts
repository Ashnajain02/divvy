// Session history persistence in the browser. v1 has no accounts — a user's
// past splits live in localStorage only.

import type { SplitSession } from "./types";

const KEY = "divvy.sessions.v1";
const VENMO_KEY = "divvy.venmo.v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function loadSessions(): SplitSession[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SplitSession[];
    if (!Array.isArray(parsed)) return [];
    // Newest first.
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export function loadSession(id: string): SplitSession | null {
  return loadSessions().find((s) => s.id === id) ?? null;
}

export function saveSession(session: SplitSession): void {
  if (!isBrowser()) return;
  const all = loadSessions().filter((s) => s.id !== session.id);
  all.unshift(session);
  // Drop receipt image data before persisting — keeps us well under the
  // localStorage quota (base64 photos are large and ephemeral by design).
  const slim = all.map(({ receiptImageData: _omit, ...rest }) => rest);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(slim));
  } catch {
    // Quota exceeded or disabled — fail quietly; history is best-effort.
  }
}

// The user's own Venmo handle, remembered across splits so they don't re-enter
// it every time they share a link.
export function loadVenmo(): string {
  if (!isBrowser()) return "";
  try {
    return window.localStorage.getItem(VENMO_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveVenmo(handle: string): void {
  if (!isBrowser()) return;
  try {
    if (handle.trim()) window.localStorage.setItem(VENMO_KEY, handle);
    else window.localStorage.removeItem(VENMO_KEY);
  } catch {
    // ignore
  }
}

export function deleteSession(id: string): void {
  if (!isBrowser()) return;
  const all = loadSessions().filter((s) => s.id !== id);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
