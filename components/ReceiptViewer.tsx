"use client";

import { useState } from "react";
import { Card, type as T } from "@/components/ui";
import { ChevronDownIcon } from "@/components/icons";

// Collapsible inline viewer for the original receipt photo. Default collapsed.
// Renders nothing when there's no image (photos are ephemeral; history sessions
// won't carry one).
export default function ReceiptViewer({
  image,
  label = "Receipt",
}: {
  image?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!image) return null;

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-[14px] py-3 text-left"
      >
        <span className={`${T.title} text-text-primary`}>{label}</span>
        <ChevronDownIcon
          className={`h-5 w-5 text-text-secondary transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-[14px] pb-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="Original receipt"
            className="w-full rounded-[10px] shadow-[0_3px_8px_rgba(0,0,0,0.12)]"
          />
        </div>
      )}
    </Card>
  );
}
