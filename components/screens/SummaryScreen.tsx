"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BackButton,
  Button,
  Card,
  GoldButton,
  GoldDivider,
  NavBar,
  Sheet,
  Spinner,
  StickyBar,
  type as T,
} from "@/components/ui";
import {
  AddOnIcon,
  CheckIcon,
  CircleIcon,
  CopyIcon,
  EqualIcon,
  PercentIcon,
  SendIcon,
  ShareIcon,
} from "@/components/icons";
import ReceiptViewer from "@/components/ReceiptViewer";
import {
  computeBreakdown,
  formatMoney,
  grandTotal,
  subtotal,
} from "@/lib/compute";
import { venmoChargeLink } from "@/lib/venmo";
import { track } from "@/lib/track";
import type { SplitSession } from "@/lib/types";

export default function SummaryScreen({
  session,
  onChange,
  onBack,
  mode,
  onSaveDone,
  onSaveVenmo,
}: {
  session: SplitSession;
  onChange: (s: SplitSession) => void;
  onBack: () => void;
  mode: "new" | "history";
  onSaveDone: () => void;
  onSaveVenmo?: (v: string) => void;
}) {
  const breakdown = useMemo(() => computeBreakdown(session), [session]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState<null | "copy" | "share">(null);
  const [copied, setCopied] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Latest session, for use inside the polling closure without re-subscribing.
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Once a split is shared, poll the Upstash record so paid statuses marked by
  // friends on the shared link show up here. Polling-on-view; no WebSockets.
  useEffect(() => {
    if (!session.shared) return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/split/${sessionRef.current.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as { session?: SplitSession };
        const remote = data.session?.paidStatus;
        if (
          active &&
          remote &&
          JSON.stringify(remote) !==
            JSON.stringify(sessionRef.current.paidStatus)
        ) {
          onChange({ ...sessionRef.current, paidStatus: remote });
        }
      } catch {
        // network blip — try again next tick
      }
    };
    poll();
    const id = setInterval(poll, 7000);
    return () => {
      active = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.shared, session.id]);

  function togglePaid(name: string) {
    const next = !session.paidStatus[name];
    if (next) track("marked_paid", { shared: !!session.shared });
    onChange({
      ...session,
      paidStatus: { ...session.paidStatus, [name]: next },
    });
    // Push to the shared record too, so the shareable link stays in sync.
    if (session.shared) {
      fetch(`/api/split/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, paid: next }),
      }).catch(() => {});
    }
  }

  function setEvenSplit(even: boolean) {
    onChange({ ...session, splitTaxTipEvenly: even });
  }

  const dateLabel = (() => {
    try {
      return new Date(session.createdAt).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  })();

  // ── Share: persist the split to Upstash and return its public URL ────────────
  async function createLink(): Promise<string> {
    // Don't ship the (large, ephemeral) receipt photo to the share store.
    const { receiptImageData: _omit, ...slim } = session;
    const res = await fetch("/api/split", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slim),
    });
    const data = (await res.json()) as { id?: string; error?: string };
    if (!res.ok || !data.id) throw new Error(data.error || "Could not create link.");
    // Remember it's shared so the Summary starts syncing paid statuses.
    if (!session.shared) onChange({ ...session, shared: true });
    return `${window.location.origin}/s/${data.id}`;
  }

  async function copyLink() {
    setShareBusy("copy");
    setShareMsg(null);
    try {
      await navigator.clipboard.writeText(await createLink());
      track("link_copied");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      setShareMsg(e instanceof Error ? e.message : "Couldn't copy the link.");
    } finally {
      setShareBusy(null);
    }
  }

  async function shareLink() {
    setShareBusy("share");
    setShareMsg(null);
    try {
      const url = await createLink();
      track("link_shared");
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (nav.share) {
        await nav.share({ title: "Divvy split", url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setShareMsg(e.message);
    } finally {
      setShareBusy(null);
    }
  }

  return (
    <main className="min-h-full">
      <NavBar
        title="Summary"
        left={<BackButton onClick={onBack} />}
        right={
          <button
            aria-label="Share"
            onClick={() => {
              setShareMsg(null);
              setShareOpen(true);
            }}
            className="press -mr-2 flex h-11 w-11 items-center justify-center rounded-full text-primary hover:bg-background-deep"
          >
            <ShareIcon />
          </button>
        }
      />

      <div className="mx-auto max-w-3xl space-y-5 px-6 pb-28 pt-5">
        {/* Header card */}
        <Card className="text-center">
          <h2 className={`${T.headline} text-text-primary`}>
            {session.restaurantName || "Untitled receipt"}
          </h2>
          <p className={`${T.caption} text-text-secondary`}>{dateLabel}</p>
          <div className="mt-3 flex flex-wrap items-start justify-center gap-x-5 gap-y-2">
            <Stat label="Subtotal" value={formatMoney(subtotal(session))} />
            {session.discount > 0 && (
              <Stat label="Discount" value={`-${formatMoney(session.discount)}`} />
            )}
            <Stat label="Tax" value={formatMoney(session.tax)} />
            {session.serviceCharge > 0 && (
              <Stat label="Service" value={formatMoney(session.serviceCharge)} />
            )}
            {session.tip > 0 && <Stat label="Tip" value={formatMoney(session.tip)} />}
          </div>
          <div className="mt-4">
            <span className={`${T.small} block text-text-tertiary`}>Total</span>
            <span className="font-serif text-[32px] font-bold text-primary">
              {formatMoney(grandTotal(session))}
            </span>
          </div>
        </Card>

        <ReceiptViewer image={session.receiptImageData} />

        {/* Tax & Tip split toggle */}
        <Card className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 shrink-0 text-gold">
              {session.splitTaxTipEvenly ? (
                <EqualIcon className="h-5 w-5" />
              ) : (
                <PercentIcon className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0">
              <p className={`${T.title} text-text-primary`}>Tax &amp; Tip Split</p>
              <p className={`${T.caption} text-text-secondary`}>
                {session.splitTaxTipEvenly
                  ? "Split evenly among everyone"
                  : "Proportional to each order"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 rounded-full border border-gold/30 bg-background-deep p-0.5">
            <TogglePill
              active={session.splitTaxTipEvenly}
              onClick={() => setEvenSplit(true)}
            >
              Even
            </TogglePill>
            <TogglePill
              active={!session.splitTaxTipEvenly}
              onClick={() => setEvenSplit(false)}
            >
              Proportional
            </TogglePill>
          </div>
        </Card>

        {/* Per-person cards */}
        <div className="space-y-3">
          {breakdown.map((p) => (
            <Card
              key={p.name}
              className="transition-opacity"
              style={{ opacity: p.paid ? 0.7 : 1 }}
            >
              {/* Top row */}
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-rounded font-bold"
                  style={{
                    background: p.paid
                      ? "rgba(64,158,122,0.18)"
                      : "rgba(46,31,97,0.12)",
                    color: p.paid ? "rgb(64,158,122)" : "rgb(46,31,97)",
                  }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <p
                  className={`${T.title} min-w-0 flex-1 truncate ${
                    p.paid ? "text-text-secondary line-through" : "text-text-primary"
                  }`}
                >
                  {p.name}
                </p>
                <span
                  className={`${T.priceLarge} ${
                    p.paid ? "text-success line-through" : "text-primary"
                  }`}
                >
                  {formatMoney(p.total)}
                </span>
              </div>

              <div className="my-3">
                <GoldDivider />
              </div>

              {/* Items they're paying for */}
              <ul className="space-y-1.5">
                {p.items.map(({ item, share, ways }) => (
                  <li key={item.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`${T.body} min-w-0 truncate text-text-primary`}>
                        {item.name}
                        {ways > 1 && (
                          <span className={`${T.small} ml-1 text-gold`}>
                            ({ways}-way)
                          </span>
                        )}
                      </span>
                      <span className={`${T.price} shrink-0 text-text-secondary`}>
                        {formatMoney(share)}
                      </span>
                    </div>
                    {item.addOns.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-1.5 pl-3 pt-0.5"
                      >
                        <AddOnIcon className="h-3.5 w-3.5 text-gold" />
                        <span className={`${T.caption} text-text-secondary`}>
                          {a.name}
                        </span>
                      </div>
                    ))}
                  </li>
                ))}
                <li className="flex items-center justify-between gap-2 pt-1">
                  <span className={`${T.body} text-text-secondary`}>
                    Tax, Charges &amp; Tip
                  </span>
                  <span className={`${T.price} text-text-secondary`}>
                    {formatMoney(p.extras)}
                  </span>
                </li>
              </ul>

              <div className="my-3">
                <GoldDivider />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => togglePaid(p.name)}
                  className={`press inline-flex min-h-10 items-center gap-1.5 ${T.label} ${
                    p.paid ? "text-success" : "text-text-secondary"
                  }`}
                >
                  {p.paid ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <CircleIcon className="h-4 w-4" />
                  )}
                  {p.paid ? "Paid" : "Mark as Paid"}
                </button>
                {p.name !== "Me" && !p.paid && (
                  <a
                    href={venmoChargeLink(p.total, session.restaurantName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                    onClick={() => track("venmo_request_clicked")}
                  >
                    <GoldButton>
                      <SendIcon className="h-4 w-4" /> Request
                    </GoldButton>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sticky save (new splits only) */}
      {mode === "new" && (
        <StickyBar>
          <Button onClick={onSaveDone}>
            <CheckIcon /> Save &amp; Done
          </Button>
        </StickyBar>
      )}

      {/* Share sheet */}
      {shareOpen && (
        <Sheet onClose={() => setShareOpen(false)} labelledBy="share-title">
          <h2 id="share-title" className={`${T.headline} mb-4 text-text-primary`}>
            Share split
          </h2>

          {/* Your Venmo — so friends opening the link can pay you back. The "@"
              is a fixed prefix; type only the username. */}
          <div className="mb-4">
            <label className={`${T.small} mb-1 block px-1 text-text-secondary`}>
              Your Venmo (so friends can pay you back)
            </label>
            <div className="flex min-h-11 items-center rounded-[10px] bg-background-deep/40 px-3">
              <span className={`${T.body} text-text-tertiary`}>@</span>
              <input
                type="text"
                value={session.payerVenmo ?? ""}
                onChange={(e) => {
                  const v = e.target.value.replace(/^@+/, "");
                  onChange({ ...session, payerVenmo: v });
                  onSaveVenmo?.(v); // remember it for next time
                }}
                aria-label="Your Venmo username"
                placeholder="username"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className={`ml-0.5 min-w-0 flex-1 bg-transparent ${T.body} text-text-primary outline-none placeholder:text-text-tertiary`}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={copyLink} disabled={shareBusy !== null}>
              {shareBusy === "copy" ? (
                <Spinner className="h-5 w-5" />
              ) : copied ? (
                <>
                  <CheckIcon /> Copied!
                </>
              ) : (
                <>
                  <CopyIcon /> Copy link
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={shareLink}
              disabled={shareBusy !== null}
            >
              {shareBusy === "share" ? (
                <Spinner className="h-5 w-5" />
              ) : (
                <>
                  <ShareIcon /> Share
                </>
              )}
            </Button>
          </div>
          {shareMsg && (
            <p className={`${T.caption} mt-3 text-center text-destructive`}>
              {shareMsg}
            </p>
          )}
          <button
            onClick={() => setShareOpen(false)}
            className={`${T.label} mt-4 min-h-10 w-full pb-2 text-center text-text-tertiary`}
          >
            Close
          </button>
        </Sheet>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <span className={`${T.small} block text-text-tertiary`}>{label}</span>
      <span className={`${T.price} text-text-primary`}>{value}</span>
    </div>
  );
}

function TogglePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 ${T.small} transition-colors ${
        active ? "bg-primary text-white" : "text-text-secondary"
      }`}
    >
      {children}
    </button>
  );
}
