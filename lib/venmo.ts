// Venmo deep links.
//
//  - charge: the in-app "Request" button (organizer asks others for money) —
//            the venmo:// app deep link (Venmo no longer initiates from the web).
//  - pay:    the shared-link button (a friend sends the bill-payer their share),
//            pre-addressed to the payer's Venmo handle when we have it.
//
// The note is just the restaurant name (e.g. "The Corner Table"), and we encode
// the query manually with encodeURIComponent so spaces become %20 (which Venmo
// renders as spaces) rather than "+".

function clampAmount(n: number): string {
  return (Number.isFinite(n) ? Math.max(0, n) : 0).toFixed(2);
}

function cleanHandle(handle?: string): string {
  return (handle ?? "").trim().replace(/^@+/, "");
}

function query(txn: "pay" | "charge", amount: number, restaurantName: string): string {
  const note = restaurantName.trim() || "Divvy split";
  return `txn=${txn}&amount=${clampAmount(amount)}&note=${encodeURIComponent(note)}`;
}

export function venmoChargeLink(amount: number, restaurantName: string): string {
  return `venmo://paycharge?${query("charge", amount, restaurantName)}`;
}

export function venmoPayLink(
  amount: number,
  restaurantName: string,
  recipient?: string,
): string {
  const q = query("pay", amount, restaurantName);
  const handle = cleanHandle(recipient);
  return handle
    ? `https://venmo.com/${encodeURIComponent(handle)}?${q}`
    : `https://venmo.com/?${q}`;
}
