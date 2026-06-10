// Strict schema for the GPT-4o receipt parser. Used two ways:
//  1. `zodResponseFormat(ParsedReceiptSchema, "receipt")` forces OpenAI's
//     Structured Outputs (strict), so the model cannot return malformed or
//     incomplete JSON — no fence-stripping or hand parsing needed.
//  2. As the runtime type (`ParsedReceipt`) used across the app.
//
// Field `.describe()` hints are emitted into the JSON schema and complement the
// system prompt. Every field is required; "absent" values are modeled as null
// (strict mode disallows optional fields).

import { z } from "zod";

export const ReceiptItemSchema = z.object({
  name: z
    .string()
    .describe(
      "Item name only — no price. Strip a leading '1 ' quantity; keep a leading '2'+ count in the name too.",
    ),
  quantity: z
    .number()
    .describe("Quantity for this row. Use 1 when no count is printed."),
  unit_price: z
    .number()
    .nullable()
    .describe("Per-unit price if the receipt prints one, otherwise null."),
  line_total: z
    .number()
    .describe("The dollar amount printed on this row (the row's total)."),
});

export const DiscountSchema = z.object({
  name: z.string(),
  amount: z.number().describe("Positive discount amount."),
});

export const ParsedReceiptSchema = z.object({
  restaurant_name: z
    .string()
    .nullable()
    .describe("The 1-3 lines of branding, not the address."),
  currency: z
    .string()
    .nullable()
    .describe("Currency symbol or code, e.g. '$', 'USD', '£', '€'. Null if unclear."),
  items: z.array(ReceiptItemSchema),
  discounts: z.array(DiscountSchema),
  printed_subtotal: z.number().nullable(),
  printed_tax: z.number().nullable(),
  printed_service_charge: z.number().nullable(),
  printed_tip: z.number().nullable(),
  printed_total: z.number().nullable(),
  needs_review: z
    .boolean()
    .describe(
      "True if the image is hard to read, partially cut off, or you are unsure about any value.",
    ),
  review_reason: z
    .string()
    .nullable()
    .describe("Short reason when needs_review is true, else null."),
});

export type ParsedReceipt = z.infer<typeof ParsedReceiptSchema>;
export type ReceiptItem = z.infer<typeof ReceiptItemSchema>;
