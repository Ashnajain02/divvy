"use client";

import { useState } from "react";
import {
  BackgroundFlourish,
  Button,
  Card,
  SectionHeader,
  StickyBar,
  type as T,
} from "@/components/ui";
import { CameraIcon, ReceiptIcon } from "@/components/icons";
import Logo from "@/components/Logo";
import { formatMoney, grandTotal } from "@/lib/compute";
import type { SplitSession } from "@/lib/types";

function formatDate(ms: number): string {
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function HomeScreen({
  sessions,
  venmo,
  onChangeVenmo,
  onScan,
  onOpen,
  onDelete,
}: {
  sessions: SplitSession[];
  venmo: string;
  onChangeVenmo: (v: string) => void;
  onScan: () => void;
  onOpen: (s: SplitSession) => void;
  onDelete: (id: string) => void;
}) {
  const [menuFor, setMenuFor] = useState<string | null>(null);

  return (
    <main className="relative min-h-full">
      <BackgroundFlourish />
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-6 pb-32 pt-12">
        {/* Header */}
        <header className="mb-8 flex items-center gap-3">
          <Logo className="h-12 w-12 shrink-0 rounded-[14px] shadow-[0_3px_8px_rgba(46,31,97,0.2)]" />
          <div>
            <h1 className={`${T.display} leading-none text-primary`}>Divvy</h1>
            <p className={`${T.caption} mt-1 text-text-secondary`}>
              Split the bill, not the friendship
            </p>
          </div>
        </header>

        {/* Your Venmo — saved once, auto-fills every shareable link. The "@" is
            a fixed prefix; the user types only their username. */}
        <Card className="mb-7 flex items-center gap-2.5">
          <label htmlFor="venmo-handle" className={`${T.label} shrink-0 text-text-secondary`}>
            Your Venmo
          </label>
          <span className={`${T.body} text-text-tertiary`}>@</span>
          <input
            id="venmo-handle"
            type="text"
            value={venmo}
            onChange={(e) => onChangeVenmo(e.target.value.replace(/^@+/, ""))}
            placeholder="username"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={`-ml-1 min-w-0 flex-1 bg-transparent ${T.body} text-text-primary outline-none placeholder:text-text-tertiary`}
          />
        </Card>

        {/* Body */}
        {sessions.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/12">
              <ReceiptIcon className="h-9 w-9 text-gold" />
            </div>
            <p className={`${T.headline} mt-5 text-text-primary`}>No splits yet</p>
            <p className={`${T.body} mt-1 text-text-secondary`}>
              Scan a receipt to get started
            </p>
          </div>
        ) : (
          <section>
            <SectionHeader>Recent splits</SectionHeader>
            <ul className="space-y-3">
              {sessions.map((s) => (
                <li key={s.id} className="relative">
                  <button
                    onClick={() => onOpen(s)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenuFor((m) => (m === s.id ? null : s.id));
                    }}
                    className="press w-full text-left focus-visible:outline-none"
                  >
                    <Card className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gold/15">
                        <ReceiptIcon className="h-6 w-6 text-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`${T.title} truncate text-text-primary`}>
                          {s.restaurantName || "Untitled receipt"}
                        </p>
                        <p className={`${T.caption} text-text-secondary`}>
                          {formatDate(s.createdAt)} · {s.people.length}{" "}
                          {s.people.length === 1 ? "person" : "people"}
                        </p>
                      </div>
                      <span className={`${T.priceLarge} shrink-0 text-primary`}>
                        {formatMoney(grandTotal(s))}
                      </span>
                    </Card>
                  </button>

                  {menuFor === s.id && (
                    <div className="absolute right-2 top-2 z-10">
                      <button
                        onClick={() => {
                          onDelete(s.id);
                          setMenuFor(null);
                        }}
                        className={`${T.label} rounded-[10px] bg-card px-3 py-2 text-destructive shadow-[0_3px_8px_rgba(0,0,0,0.15)]`}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <p className={`${T.small} mt-3 px-1 text-text-tertiary`}>
              Tip: long-press a split to delete it.
            </p>
          </section>
        )}
      </div>

      <StickyBar>
        <Button onClick={onScan}>
          <CameraIcon /> Scan Receipt
        </Button>
      </StickyBar>
    </main>
  );
}
