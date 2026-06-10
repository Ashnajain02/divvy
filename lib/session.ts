// Helpers that build and mutate SplitSession values immutably for the wizard.

import { shortId, uuid } from "./id";
import { itemTotal } from "./compute";
import type { AddOn, LineItem, ParsedReceipt, SplitSession } from "./types";

export function emptySession(): SplitSession {
  return {
    id: shortId(),
    createdAt: stableNow(),
    restaurantName: "",
    items: [],
    discount: 0,
    tax: 0,
    serviceCharge: 0,
    tip: 0,
    people: [],
    paidStatus: {},
    splitTaxTipEvenly: false,
  };
}

// createdAt is stamped when the session is first created in the browser.
function stableNow(): number {
  return typeof Date !== "undefined" ? Date.now() : 0;
}

export function newItem(name = "", basePrice = 0): LineItem {
  return {
    id: uuid(),
    name,
    basePrice,
    quantity: 1,
    addOns: [],
    assignedTo: [],
  };
}

// Build a wizard session from the parsed receipt JSON.
export function sessionFromParsed(parsed: ParsedReceipt): SplitSession {
  const discount = (parsed.discounts ?? []).reduce(
    (s, d) => s + (Number(d.amount) || 0),
    0,
  );
  const items: LineItem[] = (parsed.items ?? []).map((it) => {
    const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
    const lineTotal = Number(it.line_total) || 0;
    // Store the per-unit price so (basePrice × quantity) reconciles exactly to
    // the printed row total. For qty 1 this is just the line total.
    const item = newItem(it.name ?? "", qty > 1 ? lineTotal / qty : lineTotal);
    item.quantity = qty;
    return item;
  });
  return {
    ...emptySession(),
    restaurantName: parsed.restaurant_name ?? "",
    currency: parsed.currency ?? undefined,
    items,
    discount,
    tax: Number(parsed.printed_tax) || 0,
    serviceCharge: Number(parsed.printed_service_charge) || 0,
    tip: Number(parsed.printed_tip) || 0,
  };
}

// Display name combining a stripped quantity prefix back in for clarity.
export function displayName(item: LineItem): string {
  return item.quantity > 1 ? `${item.quantity}× ${item.name}` : item.name;
}

// ── Item transforms (all pure; return new arrays) ───────────────────────────

// Split one item into two identical half-priced rows. Strips a leading "1 " or
// "2x "/"2 " quantity prefix from the name first.
export function splitItem(items: LineItem[], id: string): LineItem[] {
  const out: LineItem[] = [];
  for (const item of items) {
    if (item.id !== id) {
      out.push(item);
      continue;
    }
    const name = stripQuantityPrefix(item.name);
    const half = Math.round((itemTotal(item) / 2) * 100) / 100;
    out.push(
      { ...newItem(name, half), assignedTo: [...item.assignedTo] },
      { ...newItem(name, half), assignedTo: [...item.assignedTo] },
    );
  }
  return out;
}

function stripQuantityPrefix(name: string): string {
  return name.replace(/^\s*(?:1\s+|2x\s+|2\s+)/i, "").trim() || name.trim();
}

// Make `sourceId` an add-on of `targetId`. The add-on carries the source's full
// total as its price. The source is removed from the top level.
export function groupInto(
  items: LineItem[],
  sourceId: string,
  targetId: string,
): LineItem[] {
  if (sourceId === targetId) return items;
  const source = items.find((i) => i.id === sourceId);
  if (!source) return items;
  const addOn: AddOn = {
    id: uuid(),
    name: source.name,
    price: itemTotal(source),
  };
  return items
    .filter((i) => i.id !== sourceId)
    .map((i) =>
      i.id === targetId ? { ...i, addOns: [...i.addOns, addOn] } : i,
    );
}

// Pop an add-on back out to its own top-level item.
export function ungroupAddOn(
  items: LineItem[],
  parentId: string,
  addOnId: string,
): LineItem[] {
  const parent = items.find((i) => i.id === parentId);
  const addOn = parent?.addOns.find((a) => a.id === addOnId);
  if (!parent || !addOn) return items;
  const restored: LineItem = {
    ...newItem(addOn.name, addOn.price),
    assignedTo: [...parent.assignedTo],
  };
  const out: LineItem[] = [];
  for (const i of items) {
    if (i.id === parentId) {
      out.push({ ...i, addOns: i.addOns.filter((a) => a.id !== addOnId) });
      out.push(restored);
    } else {
      out.push(i);
    }
  }
  return out;
}
