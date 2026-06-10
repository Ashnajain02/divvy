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
import { CloseIcon, UserPlusIcon } from "@/components/icons";
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
  // Name currently being edited (tap a chip), and the inline add-field draft.
  const [editName, setEditName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const unassignedCount = useMemo(
    () => session.items.filter((i) => i.assignedTo.length === 0).length,
    [session.items],
  );
  const allAssigned = unassignedCount === 0 && session.items.length > 0;

  // ── People ops ─────────────────────────────────────────────────────────────
  // Add one or many names at once: split on commas/new lines, trim, de-dupe
  // (case-insensitive), and append them all in a single update.
  function addPeople(raw: string) {
    const seen = new Set(session.people.map((p) => p.toLowerCase()));
    const toAdd: string[] = [];
    for (const tok of raw.split(/[,\n]+/)) {
      const n = tok.trim();
      if (!n) continue;
      const key = n.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        toAdd.push(n);
      }
    }
    if (toAdd.length) {
      onChange({ ...session, people: [...session.people, ...toAdd] });
    }
  }

  // The inline field commits a name whenever the user types a comma/return; the
  // remainder after the last separator stays in the field for the next name.
  function onDraftChange(v: string) {
    const lastSep = Math.max(v.lastIndexOf(","), v.lastIndexOf("\n"));
    if (lastSep >= 0) {
      addPeople(v.slice(0, lastSep));
      setDraft(v.slice(lastSep + 1).trimStart());
    } else {
      setDraft(v.trimStart());
    }
  }
  function commitDraft() {
    if (draft.trim()) {
      addPeople(draft);
      setDraft("");
    }
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

          {/* Prominent add field — type names, comma/return commits each. */}
          <div className="flex min-h-12 items-center gap-2.5 rounded-[14px] border border-transparent bg-background-deep/60 px-3.5 transition-colors focus-within:border-gold/40 focus-within:bg-background-deep/90">
            <UserPlusIcon className="h-5 w-5 shrink-0 text-text-tertiary" />
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitDraft();
                } else if (
                  e.key === "Backspace" &&
                  draft === "" &&
                  session.people.length > 0
                ) {
                  removePerson(session.people[session.people.length - 1]);
                }
              }}
              onBlur={commitDraft}
              placeholder={session.people.length ? "Add another…" : "Add people…"}
              aria-label="Add people"
              autoFocus={session.people.length === 0}
              autoCapitalize="words"
              autoCorrect="off"
              autoComplete="off"
              enterKeyHint="done"
              className={`min-w-0 flex-1 bg-transparent py-3 ${T.body} text-text-primary outline-none placeholder:text-text-tertiary`}
            />
          </div>

          {/* Added people as avatar chips. */}
          {session.people.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {session.people.map((p) => (
                <span
                  key={p}
                  className="a-pop inline-flex items-center gap-2 rounded-full border border-gold/25 bg-card py-1 pl-1.5 pr-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full font-rounded text-[13px] font-bold"
                    style={{ background: "rgba(46,31,97,0.12)", color: "rgb(46,31,97)" }}
                  >
                    {p.charAt(0).toUpperCase()}
                  </span>
                  <button
                    onClick={() => setEditName(p)}
                    className={`press ${T.label} text-text-primary`}
                  >
                    {p}
                  </button>
                  <button
                    aria-label={`Remove ${p}`}
                    onClick={() => removePerson(p)}
                    className="press flex h-6 w-6 items-center justify-center rounded-full text-text-tertiary hover:text-destructive"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className={`${T.small} mt-2 px-1 text-text-tertiary`}>
              Type a name and press return — or add several at once: “Alex, Sam,
              Jordan”.
            </p>
          )}
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

      {editName !== null && (
        <NameModal
          initial={editName}
          title="Edit name"
          onCancel={() => setEditName(null)}
          onSubmit={(name) => {
            renamePerson(editName, name);
            setEditName(null);
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
