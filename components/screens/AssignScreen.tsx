"use client";

import { useMemo, useState } from "react";
import {
  BackButton,
  Button,
  Card,
  Chip,
  GoldDivider,
  NavBar,
  SectionHeader,
  Sheet,
  StickyBar,
  type as T,
} from "@/components/ui";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { TextField } from "@/components/inputs";
import { formatMoney, itemTotal } from "@/lib/compute";
import { displayName } from "@/lib/session";
import type { LineItem, SplitSession } from "@/lib/types";

export default function AssignScreen({
  session,
  onChange,
  onBack,
  onContinue,
}: {
  session: SplitSession;
  onChange: (s: SplitSession) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [modal, setModal] = useState<
    { mode: "add" } | { mode: "edit"; name: string } | null
  >(null);

  const unassignedCount = useMemo(
    () => session.items.filter((i) => i.assignedTo.length === 0).length,
    [session.items],
  );
  const allAssigned = unassignedCount === 0 && session.items.length > 0;

  // ── People ops ─────────────────────────────────────────────────────────────
  function addPerson(name: string) {
    const n = name.trim();
    if (!n) return;
    if (session.people.some((p) => p.toLowerCase() === n.toLowerCase())) return;
    onChange({ ...session, people: [...session.people, n] });
  }
  function removePerson(name: string) {
    onChange({
      ...session,
      people: session.people.filter((p) => p !== name),
      items: session.items.map((i) => ({
        ...i,
        assignedTo: i.assignedTo.filter((p) => p !== name),
      })),
      paidStatus: omitKey(session.paidStatus, name),
    });
  }
  function renamePerson(oldName: string, next: string) {
    const n = next.trim();
    if (!n || n === oldName) return;
    onChange({
      ...session,
      people: session.people.map((p) => (p === oldName ? n : p)),
      items: session.items.map((i) => ({
        ...i,
        assignedTo: i.assignedTo.map((p) => (p === oldName ? n : p)),
      })),
      paidStatus: renameKey(session.paidStatus, oldName, n),
    });
  }

  function toggleAssign(item: LineItem, person: string) {
    const has = item.assignedTo.includes(person);
    const assignedTo = has
      ? item.assignedTo.filter((p) => p !== person)
      : [...item.assignedTo, person];
    onChange({
      ...session,
      items: session.items.map((i) =>
        i.id === item.id ? { ...i, assignedTo } : i,
      ),
    });
  }

  return (
    <main className="min-h-full">
      <NavBar title="Assign" left={<BackButton onClick={onBack} />} />

      <div className="mx-auto max-w-3xl space-y-5 px-6 pb-28 pt-5">
        {/* People */}
        <section>
          <SectionHeader>People</SectionHeader>
          <div className="flex flex-wrap gap-2">
            {session.people.map((p) => (
              <span
                key={p}
                className={`inline-flex items-center overflow-hidden rounded-full border border-gold/30 bg-background-deep ${T.label} text-text-primary`}
              >
                <button
                  onClick={() => setModal({ mode: "edit", name: p })}
                  className="press min-h-10 py-1.5 pl-3.5 pr-1.5"
                >
                  {p}
                </button>
                <button
                  aria-label={`Remove ${p}`}
                  onClick={() => removePerson(p)}
                  className="press flex h-10 w-9 items-center justify-center text-text-tertiary hover:text-destructive"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setModal({ mode: "add" })}
              className={`press inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed border-primary-light/50 px-3.5 py-1.5 ${T.label} text-primary-light`}
            >
              <PlusIcon className="h-4 w-4" /> Add
            </button>
          </div>
        </section>

        <GoldDivider />

        {/* Items */}
        <section>
          <SectionHeader>Items</SectionHeader>
          {session.people.length === 0 && (
            <p className={`${T.caption} mb-2 px-1 text-text-secondary`}>
              Add people above, then tap their chips to assign each item.
            </p>
          )}
          <ul className="space-y-3">
            {session.items.map((item) => {
              const ways = item.assignedTo.length;
              return (
                <li key={item.id}>
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`${T.title} text-text-primary`}>
                          {displayName(item) || "Item"}
                        </p>
                        {item.addOns.map((a) => (
                          <p
                            key={a.id}
                            className={`${T.caption} text-text-secondary`}
                          >
                            + {a.name}
                          </p>
                        ))}
                      </div>
                      <span className={`${T.price} shrink-0 text-primary`}>
                        {formatMoney(itemTotal(item))}
                      </span>
                    </div>

                    {session.people.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {session.people.map((p) => (
                          <Chip
                            key={p}
                            selected={item.assignedTo.includes(p)}
                            onClick={() => toggleAssign(item, p)}
                          >
                            {p}
                          </Chip>
                        ))}
                      </div>
                    )}

                    <p
                      className={`${T.small} mt-2 ${
                        ways === 0 ? "text-destructive" : "text-gold"
                      }`}
                    >
                      {ways === 0
                        ? "Not assigned"
                        : ways === 1
                          ? `Assigned to ${item.assignedTo[0]}`
                          : `Split ${ways} ways — ${formatMoney(
                              itemTotal(item) / ways,
                            )} each`}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <StickyBar>
        <Button onClick={onContinue} disabled={!allAssigned}>
          See Summary
        </Button>
        {unassignedCount > 0 && (
          <p className={`${T.caption} pb-1 text-center text-text-secondary`}>
            {unassignedCount} item{unassignedCount === 1 ? "" : "s"} still
            unassigned
          </p>
        )}
      </StickyBar>

      {modal && (
        <NameModal
          initial={modal.mode === "edit" ? modal.name : ""}
          title={modal.mode === "edit" ? "Edit name" : "Add person"}
          onCancel={() => setModal(null)}
          onSubmit={(name) => {
            if (modal.mode === "edit") renamePerson(modal.name, name);
            else addPerson(name);
            setModal(null);
          }}
        />
      )}
    </main>
  );
}

function NameModal({
  initial,
  title,
  onSubmit,
  onCancel,
}: {
  initial: string;
  title: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const submit = () => value.trim() && onSubmit(value);
  return (
    <Sheet onClose={onCancel} labelledBy="name-modal-title">
      <h2 id="name-modal-title" className={`${T.headline} mb-3 text-text-primary`}>
        {title}
      </h2>
      <TextField
        value={value}
        onChange={setValue}
        ariaLabel="Person name"
        placeholder="Name"
        autoFocus
        onEnter={submit}
      />
      <div className="mt-4 flex gap-3 pb-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!value.trim()}>
          Save
        </Button>
      </div>
    </Sheet>
  );
}

function omitKey(
  obj: Record<string, boolean>,
  key: string,
): Record<string, boolean> {
  const { [key]: _omit, ...rest } = obj;
  return rest;
}
function renameKey(
  obj: Record<string, boolean>,
  oldKey: string,
  newKey: string,
): Record<string, boolean> {
  if (!(oldKey in obj)) return obj;
  const { [oldKey]: val, ...rest } = obj;
  return { ...rest, [newKey]: val };
}
