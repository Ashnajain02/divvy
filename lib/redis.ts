// Upstash Redis access for shareable links. The client is instantiated INSIDE
// each helper (never at module load) so `next build` doesn't fail when env vars
// are absent at build time.

import { Redis } from "@upstash/redis";
import type { SplitSession } from "./types";

function getClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  return new Redis({ url, token });
}

const keyFor = (id: string) => `split:${id}`;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

export async function putSharedSplit(session: SplitSession): Promise<void> {
  const redis = getClient();
  // Never persist the receipt image to the shared store.
  const { receiptImageData: _omit, ...slim } = session;
  await redis.set(keyFor(session.id), slim, { ex: TTL_SECONDS });
}

export async function getSharedSplit(id: string): Promise<SplitSession | null> {
  const redis = getClient();
  const data = await redis.get<SplitSession>(keyFor(id));
  return data ?? null;
}

// Patch only the paid-status map for a single person, then re-stamp the TTL.
export async function setPaidStatus(
  id: string,
  name: string,
  paid: boolean,
): Promise<SplitSession | null> {
  const redis = getClient();
  const session = await redis.get<SplitSession>(keyFor(id));
  if (!session) return null;
  session.paidStatus = { ...session.paidStatus, [name]: paid };
  await redis.set(keyFor(id), session, { ex: TTL_SECONDS });
  return session;
}
