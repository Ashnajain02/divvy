// Pure money math for a SplitSession. Everything here is deterministic and
// dependency-free so it can be unit-reasoned about and reused on the share page.

import type { LineItem, SplitSession } from "./types";

export function itemTotal(item: LineItem): number {
  const addOnSum = item.addOns.reduce((s, a) => s + a.price, 0);
  return (item.basePrice + addOnSum) * item.quantity;
}

export function itemsTotal(items: LineItem[]): number {
  return items.reduce((s, i) => s + itemTotal(i), 0);
}

export function subtotal(s: Pick<SplitSession, "items" | "discount">): number {
  return itemsTotal(s.items) - s.discount;
}

export function grandTotal(
  s: Pick<SplitSession, "items" | "discount" | "tax" | "serviceCharge" | "tip">,
): number {
  return subtotal(s) + s.tax + s.serviceCharge + s.tip;
}

// Charges distributed across people on top of their items.
export function extraCharges(
  s: Pick<SplitSession, "tax" | "serviceCharge" | "tip" | "discount">,
): number {
  return s.tax + s.serviceCharge + s.tip - s.discount;
}

export type PersonBreakdownLine = {
  item: LineItem;
  share: number; // this person's slice of the item total
  ways: number; // how many people share this item
};

export type PersonBreakdown = {
  name: string;
  items: PersonBreakdownLine[];
  itemsSubtotal: number; // sum of their item shares
  extras: number; // their slice of tax/charges/tip − discount
  total: number; // itemsSubtotal + extras
  paid: boolean;
};

/**
 * Compute every person's owed amount with an itemized breakdown.
 *
 * Item shares: each item's total is divided evenly among its assignees.
 * Extra charges (tax + service + tip − discount) are distributed either
 * evenly across all people, or proportionally to each person's item subtotal.
 *
 * Edge cases:
 *  - If no item is assigned to anyone (or there are no items), all charges are
 *    split evenly across people.
 */
export function computeBreakdown(s: SplitSession): PersonBreakdown[] {
  const people = s.people;
  if (people.length === 0) return [];

  const anyAssigned = s.items.some((i) => i.assignedTo.length > 0);

  // Item subtotal per person.
  const itemsByPerson = new Map<string, PersonBreakdownLine[]>();
  const subtotalByPerson = new Map<string, number>();
  for (const name of people) {
    itemsByPerson.set(name, []);
    subtotalByPerson.set(name, 0);
  }

  if (anyAssigned) {
    for (const item of s.items) {
      const ways = item.assignedTo.length;
      if (ways === 0) continue;
      const share = itemTotal(item) / ways;
      for (const name of item.assignedTo) {
        if (!itemsByPerson.has(name)) continue;
        itemsByPerson.get(name)!.push({ item, share, ways });
        subtotalByPerson.set(name, (subtotalByPerson.get(name) ?? 0) + share);
      }
    }
  } else {
    // Nothing assigned → split items evenly too, so proportional mode still
    // has a sensible denominator.
    const evenItemShare = itemsTotal(s.items) / people.length;
    for (const name of people) subtotalByPerson.set(name, evenItemShare);
  }

  const extras = extraCharges(s);
  const totalItemSubtotal = people.reduce(
    (sum, n) => sum + (subtotalByPerson.get(n) ?? 0),
    0,
  );

  return people.map((name) => {
    const itemsSubtotal = subtotalByPerson.get(name) ?? 0;
    let personExtras: number;
    if (s.splitTaxTipEvenly || totalItemSubtotal <= 0) {
      personExtras = extras / people.length;
    } else {
      personExtras = extras * (itemsSubtotal / totalItemSubtotal);
    }
    return {
      name,
      items: itemsByPerson.get(name) ?? [],
      itemsSubtotal,
      extras: personExtras,
      total: itemsSubtotal + personExtras,
      paid: !!s.paidStatus[name],
    };
  });
}

// USD formatting. Always two decimals, with a leading $.
export function formatMoney(n: number): string {
  const safe = Number.isFinite(n) ? n : 0;
  const sign = safe < 0 ? "-" : "";
  return `${sign}$${Math.abs(safe).toFixed(2)}`;
}
