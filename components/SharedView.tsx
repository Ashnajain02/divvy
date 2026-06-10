"use client";

// Read-only-ish shared split view at /s/[id]. Anyone with the link can open it
// and toggle their own paid status, which is written back to Upstash via PATCH.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BackgroundFlourish,
  Card,
  GoldButton,
  GoldDivider,
  type as T,
} from "@/components/ui";
import {
  AddOnIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  SendIcon,
} from "@/components/icons";
import Logo from "@/components/Logo";
import {
  computeBreakdown,
  formatMoney,
  grandTotal,
  itemTotal,
  subtotal,
} from "@/lib/compute";
import { displayName } from "@/lib/session";
import { venmoPayLink } from "@/lib/venmo";
import type { SplitSession } from "@/lib/types";

export default function SharedView({ initial }: { initial: SplitSession }) {
  const [session, setSession] = useState<SplitSession>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  // Poll so everyone viewing the link sees updates as others mark themselves
  // paid (or the bill-payer marks them paid in the app). Skipped while this
  // viewer has a toggle in flight, to avoid clobbering the optimistic update.
  const pendingRef = useRef<string | null>(pending);
  pendingRef.current = pending;
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (pendingRef.current) return;
      try {
        const res = await fetch(`/api/split/${initial.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as { session?: SplitSession };
        const remote = data.session?.paidStatus;
        if (active && remote) {
          setSession((s) =>
            JSON.stringify(remote) === JSON.stringify(s.paidStatus)
              ? s
              : { ...s, paidStatus: remote },
          );
        }
      } catch {
        // ignore transient errors
      }
    };
    const id = setInterval(poll, 7000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [initial.id]);

  const breakdown = useMemo(() => computeBreakdown(session), [session]);
  const total = grandTotal(session);
  const paidTotal = breakdown.reduce((s, p) => (p.paid ? s + p.total : s), 0);
  const outstanding = total - paidTotal;

  async function togglePaid(name: string, next: boolean) {
    setPending(name);
    setError(null);
    // Optimistic update.
    const prev = session;
    setSession({
      ...session,
      paidStatus: { ...session.paidStatus, [name]: next },
    });
    try {
      const res = await fetch(`/api/split/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, paid: next }),
      });
      const data = (await res.json()) as { session?: SplitSession; error?: string };
      if (!res.ok || !data.session) throw new Error(data.error || "Update failed.");
      setSession(data.session);
    } catch (e) {
      setSession(prev); // roll back
      setError(e instanceof Error ? e.message : "Couldn't update. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="relative min-h-full">
      <BackgroundFlourish />
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-6">
        {/* Header */}
        <header className="mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="press flex items-center gap-2" aria-label="Divvy home">
            <Logo className="h-8 w-8 rounded-[9px]" />
            <span className="font-serif text-[24px] font-bold text-primary">
              Divvy
            </span>
          </Link>
          <span className={`${T.title} min-w-0 truncate text-text-secondary`}>
            {session.restaurantName || "Untitled receipt"}
          </span>
        </header>

        {/* Totals summary */}
        <Card className="mb-5 text-center">
          <p className={`${T.body} text-text-primary`}>
            <span className="font-rounded font-bold tabular text-primary">
              {formatMoney(total)}
            </span>{" "}
            total ·{" "}
            <span className="font-rounded font-bold tabular text-success">
              {formatMoney(paidTotal)}
            </span>{" "}
            paid ·{" "}
            <span className="font-rounded font-bold tabular text-text-secondary">
              {formatMoney(outstanding)}
            </span>{" "}
            outstanding
          </p>
        </Card>

        {error && (
          <p className={`${T.caption} mb-3 text-center text-destructive`}>{error}</p>
        )}

        {/* People */}
        <ul className="space-y-3">
          {breakdown.map((p) => {
            const isOpen = !!open[p.name];
            const isMe = p.name.trim().toLowerCase() === "me";
            const showPay = !isMe && !p.paid && p.total > 0.005;
            return (
              <li key={p.name}>
                <Card style={{ opacity: p.paid ? 0.75 : 1 }}>
                  {/* Header — tap to expand the breakdown */}
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [p.name]: !o[p.name] }))}
                    aria-expanded={isOpen}
                    className="press flex w-full items-center gap-3 text-left focus-visible:outline-none"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-rounded font-bold"
                      style={{
                        background: p.paid
                          ? "rgba(64,158,122,0.18)"
                          : "rgba(46,31,97,0.12)",
                        color: p.paid ? "rgb(64,158,122)" : "rgb(46,31,97)",
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span
                      className={`${T.title} min-w-0 flex-1 truncate ${
                        p.paid
                          ? "text-text-secondary line-through"
                          : "text-text-primary"
                      }`}
                    >
                      {p.name}
                    </span>
                    <span
                      className={`${T.priceLarge} ${
                        p.paid ? "text-success line-through" : "text-primary"
                      }`}
                    >
                      {formatMoney(p.total)}
                    </span>
                    <ChevronDownIcon
                      className={`h-5 w-5 shrink-0 text-text-tertiary transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Itemized breakdown */}
                  {isOpen && (
                    <div className="mt-3">
                      <GoldDivider />
                      <ul className="mt-3 space-y-1.5">
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
                              <div key={a.id} className="flex items-center gap-1.5 pl-3 pt-0.5">
                                <AddOnIcon className="h-3.5 w-3.5 text-gold" />
                                <span className={`${T.caption} text-text-secondary`}>
                                  {a.name}
                                </span>
                              </div>
                            ))}
                          </li>
                        ))}
                        <li className="flex items-center justify-between gap-2 pt-0.5">
                          <span className={`${T.body} text-text-secondary`}>
                            Tax, Charges &amp; Tip
                          </span>
                          <span className={`${T.price} text-text-secondary`}>
                            {formatMoney(p.extras)}
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => togglePaid(p.name, !p.paid)}
                      disabled={pending === p.name}
                      className={`press inline-flex min-h-10 items-center gap-1.5 ${T.label} disabled:opacity-50 ${
                        p.paid ? "text-success" : "text-text-secondary"
                      }`}
                    >
                      {p.paid ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <CircleIcon className="h-4 w-4" />
                      )}
                      {p.paid ? "Paid" : "Mark as paid"}
                    </button>
                    {showPay && (
                      <a
                        href={venmoPayLink(
                          p.total,
                          session.restaurantName,
                          session.payerVenmo,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <GoldButton>
                          <SendIcon className="h-4 w-4" /> Venmo
                        </GoldButton>
                      </a>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        {/* Receipt disclosure */}
        <div className="mt-5">
          <button
            onClick={() => setReceiptOpen((v) => !v)}
            aria-expanded={receiptOpen}
            className={`${T.label} text-primary-light`}
          >
            {receiptOpen ? "Hide the receipt" : "See the receipt"}
          </button>
          {receiptOpen && (
            <Card className="mt-3 space-y-1">
              {session.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2 py-0.5">
                  <span className={`${T.body} min-w-0 truncate text-text-primary`}>
                    {displayName(item)}
                  </span>
                  <span className={`${T.price} text-text-secondary`}>
                    {formatMoney(itemTotal(item))}
                  </span>
                </div>
              ))}
              <div className="my-2">
                <GoldDivider />
              </div>
              <Row label="Subtotal" value={formatMoney(subtotal(session))} />
              {session.discount > 0 && (
                <Row label="Discount" value={`-${formatMoney(session.discount)}`} />
              )}
              {session.tax > 0 && <Row label="Tax" value={formatMoney(session.tax)} />}
              {session.serviceCharge > 0 && (
                <Row label="Service" value={formatMoney(session.serviceCharge)} />
              )}
              {session.tip > 0 && <Row label="Tip" value={formatMoney(session.tip)} />}
              <Row label="Total" value={formatMoney(total)} bold />
            </Card>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <a href="/" className={`${T.caption} text-text-tertiary underline`}>
            Try Divvy — split the bill, not the friendship
          </a>
        </footer>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={`${bold ? T.title : T.body} text-text-secondary`}>
        {label}
      </span>
      <span className={`${bold ? T.priceLarge + " text-primary" : T.price + " text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
