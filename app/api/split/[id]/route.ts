// GET  /api/split/[id]        — fetch a shared split (read-only view data)
// PATCH /api/split/[id]        — toggle one person's paid status
//
// Note: in Next.js 16 the route context `params` is a Promise and must be
// awaited.

import { NextRequest, NextResponse } from "next/server";
import { getSharedSplit, setPaidStatus } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    const session = await getSharedSplit(id);
    if (!session) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ session });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load split.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  let name: string;
  let paid: boolean;
  try {
    const body = (await req.json()) as { name?: string; paid?: boolean };
    if (typeof body.name !== "string" || typeof body.paid !== "boolean") {
      return NextResponse.json(
        { error: "Expected { name, paid }." },
        { status: 400 },
      );
    }
    name = body.name;
    paid = body.paid;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const updated = await setPaidStatus(id, name, paid);
    if (!updated) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ session: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
