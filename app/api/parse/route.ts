// POST /api/parse — receives a base64 receipt image and asks GPT-4o vision to
// structure it. Two layers of reliability:
//   1. OpenAI Structured Outputs (strict json_schema via zodResponseFormat) —
//      the model physically cannot return malformed or incomplete JSON.
//   2. Our own math verifier + retry loop (up to 3 attempts) — on a numeric
//      mismatch we feed the discrepancy back so the model self-corrects.

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { RECEIPT_SYSTEM_PROMPT } from "@/lib/parse-prompt";
import { ParsedReceiptSchema } from "@/lib/receipt-schema";
import type { ParsedReceipt } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const TOLERANCE = 0.05;
const MAX_ATTEMPTS = 3;

type MathCheck = { ok: boolean; reason: string };

function num(n: number | null | undefined): number {
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

// Verify the printed-math identities (plus a per-item qty×unit check). Returns a
// human-readable reason when something is off, to feed back to the model.
function verifyMath(p: ParsedReceipt): MathCheck {
  // Per-item: unit_price × quantity should equal the row total when a unit
  // price is given. A mismatch usually means a misread digit.
  for (const it of p.items ?? []) {
    if (it.unit_price != null && it.quantity) {
      const expected = it.unit_price * it.quantity;
      if (Math.abs(expected - num(it.line_total)) > TOLERANCE) {
        return {
          ok: false,
          reason: `Item "${it.name}": unit_price ${it.unit_price} × qty ${
            it.quantity
          } = ${expected.toFixed(2)}, but line_total = ${num(it.line_total).toFixed(
            2,
          )}. Re-read that row.`,
        };
      }
    }
  }

  const itemSum = (p.items ?? []).reduce((s, i) => s + num(i.line_total), 0);
  const discountSum = (p.discounts ?? []).reduce((s, d) => s + num(d.amount), 0);
  const computedSubtotal = itemSum - discountSum;

  if (p.printed_subtotal != null) {
    const diff = Math.abs(computedSubtotal - p.printed_subtotal);
    if (diff > TOLERANCE) {
      // Items summing too LOW almost always means a dropped row or two
      // identical rows merged into one — nudge the model to list every line.
      const hint =
        computedSubtotal < p.printed_subtotal
          ? "Items total is too LOW — you likely missed a row or merged repeated identical items. List EVERY printed line as its own item (don't deduplicate)."
          : "Items total is too HIGH — you may have double-counted a line or misread a discount.";
      return {
        ok: false,
        reason: `sum(items)=${itemSum.toFixed(2)} − discounts=${discountSum.toFixed(
          2,
        )} = ${computedSubtotal.toFixed(2)}, but printed_subtotal=${p.printed_subtotal.toFixed(
          2,
        )} (off by ${diff.toFixed(2)}). ${hint}`,
      };
    }
  }

  if (p.printed_total != null) {
    const base = p.printed_subtotal != null ? p.printed_subtotal : computedSubtotal;
    const computedTotal =
      base + num(p.printed_tax) + num(p.printed_service_charge) + num(p.printed_tip);
    const diff = Math.abs(computedTotal - p.printed_total);
    if (diff > TOLERANCE) {
      return {
        ok: false,
        reason: `subtotal+tax+service+tip = ${computedTotal.toFixed(
          2,
        )}, but printed_total=${p.printed_total.toFixed(2)} (off by ${diff.toFixed(
          2,
        )}). Re-check tax/service/tip classification (Gratuity → tip).`,
      };
    }
  }

  return { ok: true, reason: "" };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  let imageDataUrl: string;
  try {
    const body = (await req.json()) as { image?: string };
    if (!body.image || typeof body.image !== "string") {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    imageDataUrl = body.image.startsWith("data:")
      ? body.image
      : `data:image/jpeg;base64,${body.image}`;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });
  const responseFormat = zodResponseFormat(ParsedReceiptSchema, "receipt");

  // Conversation we extend with correction feedback on each retry.
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: RECEIPT_SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        { type: "text", text: "Parse this receipt into the schema." },
        { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } },
      ],
    },
  ];

  let lastErr = "";
  let lastParsed: ParsedReceipt | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let parsed: ParsedReceipt | null;
    try {
      const completion = await openai.chat.completions.parse({
        model: "gpt-4o",
        temperature: 0,
        max_tokens: 2000,
        response_format: responseFormat,
        messages,
      });
      const msg = completion.choices[0]?.message;
      if (msg?.refusal) throw new Error(msg.refusal);
      parsed = msg?.parsed ?? null;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "Vision request failed.";
      messages.push({
        role: "user",
        content: `The previous attempt failed (${lastErr}). Please try again.`,
      });
      continue;
    }

    if (!parsed) {
      lastErr = "Model returned no structured data.";
      continue;
    }

    lastParsed = parsed;
    const check = verifyMath(parsed);
    if (check.ok) {
      return NextResponse.json({ receipt: parsed, attempts: attempt });
    }

    // Math failed — feed the discrepancy back and let the model re-read.
    lastErr = check.reason;
    messages.push({ role: "assistant", content: JSON.stringify(parsed) });
    messages.push({
      role: "user",
      content: `The math does not check out: ${check.reason}\nRe-read the receipt and return corrected values.`,
    });
  }

  // Exhausted. If we have a best-effort parse, flag it for review and return it
  // so the user can fix any small discrepancy by hand on the Review screen.
  if (lastParsed) {
    return NextResponse.json({
      receipt: {
        ...lastParsed,
        needs_review: true,
        review_reason:
          lastParsed.review_reason ??
          `Numbers didn't fully reconcile: ${lastErr}`,
      },
      attempts: MAX_ATTEMPTS,
      mathWarning: lastErr,
    });
  }
  return NextResponse.json(
    {
      error: `Couldn't read the receipt after ${MAX_ATTEMPTS} attempts. ${lastErr}`,
    },
    { status: 422 },
  );
}
