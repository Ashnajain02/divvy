// Core Divvy data model. Currency-agnostic in the model; USD in the v1 UI.

export type AddOn = {
  id: string; // uuid
  name: string;
  price: number; // can be 0 for non-charged modifiers
};

export type LineItem = {
  id: string; // uuid
  name: string;
  basePrice: number;
  quantity: number; // default 1
  addOns: AddOn[];
  assignedTo: string[]; // person names
};

export type SplitSession = {
  id: string; // 10-char alphanumeric short id
  createdAt: number; // ms
  restaurantName: string;
  items: LineItem[];
  discount: number;
  tax: number;
  serviceCharge: number;
  tip: number;
  people: string[]; // names
  paidStatus: Record<string, boolean>; // name → paid
  splitTaxTipEvenly: boolean; // tax/tip distribution mode
  currency?: string; // symbol/code captured from the receipt (USD UI in v1)
  payerVenmo?: string; // bill-payer's Venmo handle — lets shared-link viewers pay them back
  shared?: boolean; // true once a shareable link has been created (enables paid-status sync)
  receiptImageData?: string; // optional base64 — not persisted server-side in v1
};

// Shape returned by the GPT-4o receipt parser (/api/parse). The single source
// of truth is the zod schema, which also drives OpenAI Structured Outputs.
export type { ParsedReceipt } from "./receipt-schema";
