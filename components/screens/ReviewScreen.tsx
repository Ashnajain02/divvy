"use client";

import { useState } from "react";
import {
  BackButton,
  Button,
  Card,
  NavBar,
  SectionHeader,
  Sheet,
  Spinner,
  StickyBar,
  type as T,
} from "@/components/ui";
import {
  AddOnIcon,
  AlertIcon,
  GroupIcon,
  MinusIcon,
  MoreIcon,
  PlusIcon,
  ReceiptIcon,
  SplitIcon,
  TrashIcon,
  UngroupIcon,
} from "@/components/icons";
import { MoneyInput, TextField } from "@/components/inputs";
import ReceiptViewer from "@/components/ReceiptViewer";
import {
  formatMoney,
  grandTotal,
  itemsTotal,
  itemTotal,
  subtotal,
} from "@/lib/compute";
import {
  groupInto,
  newItem,
  splitItem as splitItemTransform,
  ungroupAddOn,
} from "@/lib/session";
import type { LineItem, SplitSession } from "@/lib/types";

type Props = {
  status: "loading" | "error" | "ready";
  error?: string;
  session: SplitSession | null;
  image?: string;
  reviewNote?: { reason?: string } | null;
  onChange: (s: SplitSession) => void;
  onBack: () => void;
  onContinue: () => void;
  onRetry: () => void;
};

// Which bottom sheet (if any) is open, and for which item.
type SheetState =
  | { type: "actions"; itemId: string }
  | { type: "group"; itemId: string }
  | null;

export default function ReviewScreen(props: Props) {
  const { status, session, onChange } = props;
  const [sheet, setSheet] = useState<SheetState>(null);
  // Newly added rows autofocus their name field so the keyboard opens at once.
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <main className="min-h-full">
        <NavBar title="Review Items" left={<BackButton onClick={props.onBack} />} />
        <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 text-center">
          <Spinner className="h-9 w-9" />
          <p className={`${T.headline} mt-4 text-text-primary`}>
            Reading your receipt
          </p>
          <p className={`${T.body} mt-1 text-text-secondary`}>
            This may take a moment…
          </p>
        </div>
      </main>
    );
  }

  if (status === "error" || !session) {
    return (
      <main className="min-h-full">
        <NavBar title="Review Items" left={<BackButton onClick={props.onBack} />} />
        <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col items-center justify-center px-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <ReceiptIcon className="h-9 w-9 text-destructive" />
          </div>
          <p className={`${T.headline} mt-4 text-text-primary`}>
            Couldn&apos;t read receipt
          </p>
          <p className={`${T.body} mt-1 max-w-sm text-text-secondary`}>
            {props.error || "Something went wrong while parsing the photo."}
          </p>
          <div className="mt-6 w-full max-w-xs">
            <Button onClick={props.onRetry}>Try Again</Button>
          </div>
        </div>
      </main>
    );
  }

  // ── Mutators ───────────────────────────────────────────────────────────────
  const setItems = (items: LineItem[]) => onChange({ ...session, items });
  const patch = (p: Partial<SplitSession>) => onChange({ ...session, ...p });

  const updateItem = (id: string, p: Partial<LineItem>) =>
    setItems(session.items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const deleteItem = (id: string) =>
    setItems(session.items.filter((i) => i.id !== id));
  const addItem = () => {
    const item = newItem("", 0);
    setItems([...session.items, item]);
    setAutoFocusId(item.id);
  };
  const doSplit = (id: string) => setItems(splitItemTransform(session.items, id));
  const doGroup = (sourceId: string, targetId: string) =>
    setItems(groupInto(session.items, sourceId, targetId));
  const doUngroup = (parentId: string, addOnId: string) =>
    setItems(ungroupAddOn(session.items, parentId, addOnId));

  const sheetItem =
    sheet && session.items.find((i) => i.id === sheet.itemId);

  return (
    <main className="min-h-full">
      <NavBar title="Review Items" left={<BackButton onClick={props.onBack} />} />

      <div className="mx-auto max-w-3xl space-y-6 px-6 pb-28 pt-5">
        {props.reviewNote && (
          <div className="flex items-start gap-3 rounded-[14px] border border-gold/40 bg-gold/10 p-3.5">
            <span className="mt-0.5 shrink-0 text-gold">
              <AlertIcon className="h-5 w-5" />
            </span>
            <div>
              <p className={`${T.label} text-text-primary`}>
                Double-check these numbers
              </p>
              <p className={`${T.caption} text-text-secondary`}>
                {props.reviewNote.reason ||
                  "The receipt was hard to read — confirm the items and totals below."}
              </p>
            </div>
          </div>
        )}

        {props.image && <ReceiptViewer image={props.image} />}

        {/* Restaurant */}
        <section>
          <SectionHeader>Restaurant</SectionHeader>
          <Card>
            <TextField
              value={session.restaurantName}
              onChange={(v) => patch({ restaurantName: v })}
              ariaLabel="Restaurant name"
              placeholder="Restaurant name"
            />
          </Card>
        </section>

        {/* Items */}
        <section>
          <SectionHeader>Items</SectionHeader>
          <ul className="space-y-3">
            {session.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                autoFocus={autoFocusId === item.id}
                onChangeName={(name) => updateItem(item.id, { name })}
                onChangePrice={(basePrice) => updateItem(item.id, { basePrice })}
                onChangeQty={(quantity) => updateItem(item.id, { quantity })}
                onOpenActions={() => setSheet({ type: "actions", itemId: item.id })}
                onUngroup={(addOnId) => doUngroup(item.id, addOnId)}
              />
            ))}
          </ul>
          <button
            onClick={addItem}
            className={`press mt-3 inline-flex items-center gap-1.5 px-1 ${T.label} text-primary-light`}
          >
            <PlusIcon className="h-4 w-4" /> Add item
          </button>
        </section>

        {/* Totals */}
        <section>
          <SectionHeader>Totals</SectionHeader>
          <Card className="space-y-1">
            <TotalRow label="Items" value={formatMoney(itemsTotal(session.items))} />
            <EditableTotalRow
              label="Discount"
              value={session.discount}
              onChange={(discount) => patch({ discount })}
              tone="success"
              prefix="-"
            />
            <TotalRow label="Subtotal" value={formatMoney(subtotal(session))} />
            <EditableTotalRow
              label="Tax"
              value={session.tax}
              onChange={(tax) => patch({ tax })}
            />
            {session.serviceCharge > 0 && (
              <EditableTotalRow
                label="Service Charge"
                value={session.serviceCharge}
                onChange={(serviceCharge) => patch({ serviceCharge })}
              />
            )}
            <EditableTotalRow
              label="Tip"
              value={session.tip}
              onChange={(tip) => patch({ tip })}
            />
            <div className="flex items-center justify-between pt-1">
              <span className={`${T.title} text-text-primary`}>Total</span>
              <span className={`${T.priceLarge} text-primary`}>
                {formatMoney(grandTotal(session))}
              </span>
            </div>
          </Card>
        </section>
      </div>

      <StickyBar>
        <Button onClick={props.onContinue} disabled={session.items.length === 0}>
          Continue
        </Button>
      </StickyBar>

      {/* Item actions sheet */}
      {sheet?.type === "actions" && sheetItem && (
        <Sheet onClose={() => setSheet(null)} labelledBy="item-actions-title">
          <h2
            id="item-actions-title"
            className={`${T.headline} px-1 pb-2 text-text-primary`}
          >
            {sheetItem.name || "Item"}
          </h2>
          <div className="pb-2">
            <SheetAction
              icon={<SplitIcon />}
              label="Split into two"
              hint="Halve the price across two rows"
              onClick={() => {
                doSplit(sheetItem.id);
                setSheet(null);
              }}
            />
            <SheetAction
              icon={<GroupIcon />}
              label="Group under another item"
              hint={
                session.items.length < 2
                  ? "Add another item first"
                  : "Make this an add-on of another item"
              }
              disabled={session.items.length < 2}
              onClick={() => setSheet({ type: "group", itemId: sheetItem.id })}
            />
            <SheetAction
              icon={<TrashIcon />}
              label="Delete"
              tone="destructive"
              onClick={() => {
                deleteItem(sheetItem.id);
                setSheet(null);
              }}
            />
          </div>
        </Sheet>
      )}

      {/* Group-target picker sheet */}
      {sheet?.type === "group" && sheetItem && (
        <Sheet onClose={() => setSheet(null)} labelledBy="group-title">
          <h2 id="group-title" className={`${T.headline} px-1 text-text-primary`}>
            Group under…
          </h2>
          <p className={`${T.caption} px-1 pb-2 text-text-secondary`}>
            “{sheetItem.name || "This item"}” becomes an add-on of:
          </p>
          <ul className="pb-2">
            {session.items
              .filter((i) => i.id !== sheetItem.id)
              .map((target) => (
                <li key={target.id}>
                  <button
                    onClick={() => {
                      doGroup(sheetItem.id, target.id);
                      setSheet(null);
                    }}
                    className="press flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-background-deep"
                  >
                    <span className={`${T.body} min-w-0 truncate text-text-primary`}>
                      {target.name || "Item"}
                    </span>
                    <span className={`${T.price} shrink-0 text-text-secondary`}>
                      {formatMoney(itemTotal(target))}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </Sheet>
      )}
    </main>
  );
}

// ── Item card ─────────────────────────────────────────────────────────────────
function ItemCard({
  item,
  autoFocus,
  onChangeName,
  onChangePrice,
  onChangeQty,
  onOpenActions,
  onUngroup,
}: {
  item: LineItem;
  autoFocus: boolean;
  onChangeName: (v: string) => void;
  onChangePrice: (v: number) => void;
  onChangeQty: (q: number) => void;
  onOpenActions: () => void;
  onUngroup: (addOnId: string) => void;
}) {
  const multi = item.quantity > 1;
  const showFooter = multi || item.addOns.length > 0;
  return (
    <li>
      <Card>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              value={item.name}
              onChange={onChangeName}
              ariaLabel="Item name"
              placeholder="Item name"
              autoFocus={autoFocus}
            />
          </div>
          <div className="w-24 shrink-0">
            <MoneyInput
              value={item.basePrice}
              onChange={onChangePrice}
              ariaLabel={multi ? "Unit price" : "Item price"}
            />
          </div>
          <button
            aria-label="Item actions"
            onClick={onOpenActions}
            className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-background-deep"
          >
            <MoreIcon />
          </button>
        </div>

        {showFooter && (
          <div className="mt-2 space-y-1.5 border-t border-gold/15 pt-2 pl-1">
            {/* Quantity stepper (only for multi-quantity rows) */}
            {multi && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`${T.small} text-text-secondary`}>Qty</span>
                  <div className="flex items-center gap-1">
                    <QtyButton
                      label="Decrease quantity"
                      onClick={() => onChangeQty(Math.max(1, item.quantity - 1))}
                    >
                      <MinusIcon className="h-3.5 w-3.5" />
                    </QtyButton>
                    <span className={`${T.label} w-5 text-center tabular text-text-primary`}>
                      {item.quantity}
                    </span>
                    <QtyButton
                      label="Increase quantity"
                      onClick={() => onChangeQty(item.quantity + 1)}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </QtyButton>
                  </div>
                </div>
                <span className={`${T.small} text-text-tertiary`}>
                  {formatMoney(item.basePrice)} each
                </span>
              </div>
            )}

            {/* Add-ons */}
            {item.addOns.map((a) => (
              <div key={a.id} className="flex items-center gap-2">
                <AddOnIcon className="h-4 w-4 shrink-0 text-gold" />
                <span className={`${T.body} min-w-0 flex-1 truncate text-text-secondary`}>
                  {a.name}
                </span>
                <span className={`${T.price} shrink-0 text-text-secondary`}>
                  +{formatMoney(a.price)}
                </span>
                <button
                  aria-label={`Ungroup ${a.name}`}
                  onClick={() => onUngroup(a.id)}
                  className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-light hover:bg-background-deep"
                  title="Ungroup"
                >
                  <UngroupIcon className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="flex justify-end pt-0.5">
              <span className={`${T.price} text-text-primary`}>
                Total {formatMoney(itemTotal(item))}
              </span>
            </div>
          </div>
        )}
      </Card>
    </li>
  );
}

function QtyButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="press flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-background-deep text-text-primary"
    >
      {children}
    </button>
  );
}

function SheetAction({
  icon,
  label,
  hint,
  onClick,
  tone,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: "destructive";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`press flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-background-deep disabled:opacity-40 ${
        tone === "destructive" ? "text-destructive" : "text-text-primary"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className={`block ${T.label}`}>{label}</span>
        {hint && (
          <span className={`block ${T.small} text-text-tertiary`}>{hint}</span>
        )}
      </span>
    </button>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`${T.body} text-text-secondary`}>{label}</span>
      <span className={`${T.price} text-text-primary`}>{value}</span>
    </div>
  );
}

function EditableTotalRow({
  label,
  value,
  onChange,
  tone,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  tone?: "success";
  prefix?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={`${T.body} text-text-secondary`}>{label}</span>
      <div className="flex items-center gap-1">
        {prefix && value > 0 && (
          <span
            className={`${T.price} ${tone === "success" ? "text-success" : "text-text-secondary"}`}
          >
            {prefix}
          </span>
        )}
        <div className="w-24">
          <MoneyInput value={value} onChange={onChange} ariaLabel={label} />
        </div>
      </div>
    </div>
  );
}
