// POST /api/split — persist a session to Upstash so it can be shared by URL.
// Returns { id }. The id is the secret; there is no auth in v1.

import { NextRequest, NextResponse } from "next/server";
import { putSharedSplit } from "@/lib/redis";
import type { SplitSession } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let session: SplitSession;
  try {
    session = (await req.json()) as SplitSession;
    if (!session || typeof session.id !== "string" || !Array.isArray(session.items)) {
      return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    // Strip the ephemeral receipt image before it ever reaches the store.
    const { receiptImageData: _omit, ...slim } = session;
    await putSharedSplit(slim as SplitSession);
    return NextResponse.json({ id: session.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to save split.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
