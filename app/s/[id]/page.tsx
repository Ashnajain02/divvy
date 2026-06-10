// Shared split page. Server component fetches the session from Upstash by id
// (the link is the secret) and hands it to the interactive client view. In
// Next.js 16 `params` is a Promise and must be awaited.

import Link from "next/link";
import SharedView from "@/components/SharedView";
import { BackgroundFlourish, type as T } from "@/components/ui";
import { ReceiptIcon } from "@/components/icons";
import { getSharedSplit } from "@/lib/redis";

// Always fetch fresh so a friend's "mark paid" shows up on refresh.
export const dynamic = "force-dynamic";

export default async function SharedSplitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session = null;
  let failed = false;
  try {
    session = await getSharedSplit(id);
  } catch {
    failed = true;
  }

  if (!session) {
    return (
      <main className="relative flex min-h-full items-center justify-center px-6 text-center">
        <BackgroundFlourish />
        <div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/12">
            <ReceiptIcon className="h-8 w-8 text-gold" />
          </div>
          <h1 className={`${T.headline} mt-4 text-text-primary`}>
            {failed ? "Couldn't load this split" : "Split not found"}
          </h1>
          <p className={`${T.body} mt-1 text-text-secondary`}>
            {failed
              ? "Please try again in a moment."
              : "This link may have expired or never existed."}
          </p>
          <Link
            href="/"
            className={`${T.label} mt-4 inline-block text-primary-light underline`}
          >
            Open Divvy
          </Link>
        </div>
      </main>
    );
  }

  return <SharedView initial={session} />;
}
