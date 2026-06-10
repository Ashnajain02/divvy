// Venmo deep links. We use the universal https://venmo.com/ form (not the
// venmo:// app scheme) so links work in a browser on desktop and still hand off
// to the Venmo app on mobile.
//
//  - charge: the in-app "Request" button (organizer asks others for money).
//  - pay:    the shared-link button (a friend sends the bill-payer their share),
//            pre-addressed to the payer's Venmo handle when we have it.

function clampAmount(n: number): string {
  return (Number.isFinite(n) ? Math.max(0, n) : 0).toFixed(2);
}

function noteFor(restaurantName: string): string {
  return `${restaurantName ? `${restaurantName} — ` : ""}Divvy split`;
}

function cleanHandle(handle?: string): string {
  return (handle ?? "").trim().replace(/^@+/, "");
}

// Request money. We don't know the other person's Venmo handle, so this can't
// be pre-addressed — it uses the Venmo app deep link, which opens the app's
// request screen with the amount + note pre-filled (you pick the person).
// Venmo no longer initiates transactions from the website, so this only does
// something on a phone with the Venmo app installed.
export function venmoChargeLink(amount: number, restaurantName: string): string {
  const qs = new URLSearchParams({
    txn: "charge",
    amount: clampAmount(amount),
    note: noteFor(restaurantName),
  });
  return `venmo://paycharge?${qs.toString()}`;
}

// Pay the bill-payer back. When `recipient` is set, the link is pre-addressed to
// that handle; otherwise it opens Venmo's pay flow with the amount/note filled.
export function venmoPayLink(
  amount: number,
  restaurantName: string,
  recipient?: string,
): string {
  const qs = new URLSearchParams({
    txn: "pay",
    amount: clampAmount(amount),
    note: noteFor(restaurantName),
  });
  const handle = cleanHandle(recipient);
  return handle
    ? `https://venmo.com/${encodeURIComponent(handle)}?${qs.toString()}`
    : `https://venmo.com/?${qs.toString()}`;
}
