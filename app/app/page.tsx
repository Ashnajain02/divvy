"use client";

// Divvy single-page wizard. Home → Capture → Review → Assign → Summary all live
// here as client-side screen state (localStorage history; no routing between
// steps). The only separate route is the shareable /s/[id] view.

import { useCallback, useEffect, useState } from "react";
import HomeScreen from "@/components/screens/HomeScreen";
import CaptureScreen from "@/components/screens/CaptureScreen";
import ReviewScreen from "@/components/screens/ReviewScreen";
import AssignScreen from "@/components/screens/AssignScreen";
import SummaryScreen from "@/components/screens/SummaryScreen";
import {
  deleteSession,
  loadSessions,
  loadVenmo,
  saveSession,
  saveVenmo,
} from "@/lib/local-storage";
import { emptySession, sessionFromParsed } from "@/lib/session";
import type { ParsedReceipt, SplitSession } from "@/lib/types";

type Screen = "home" | "capture" | "review" | "assign" | "summary";
type ParseState = { status: "loading" | "error" | "ready"; error?: string };

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [sessions, setSessions] = useState<SplitSession[]>([]);
  const [draft, setDraft] = useState<SplitSession | null>(null);
  const [mode, setMode] = useState<"new" | "history">("new");
  const [captureImage, setCaptureImage] = useState<string | null>(null);
  const [parse, setParse] = useState<ParseState>({ status: "ready" });
  // Set when the parser flags the result as needing a human check.
  const [reviewNote, setReviewNote] = useState<{ reason?: string } | null>(null);
  // The user's saved Venmo handle, remembered across splits.
  const [venmo, setVenmoState] = useState("");

  // Load history + saved Venmo once on mount (localStorage is client-only).
  useEffect(() => {
    setSessions(loadSessions());
    setVenmoState(loadVenmo());
  }, []);

  const onChangeVenmo = useCallback((v: string) => {
    setVenmoState(v);
    saveVenmo(v);
  }, []);

  const refreshSessions = useCallback(() => setSessions(loadSessions()), []);

  // ── Parse ──────────────────────────────────────────────────────────────────
  const runParse = useCallback(async (image: string) => {
    setParse({ status: "loading" });
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const data = (await res.json()) as {
        receipt?: ParsedReceipt;
        error?: string;
      };
      if (!res.ok || !data.receipt) {
        throw new Error(data.error || "Couldn't read the receipt.");
      }
      const built = sessionFromParsed(data.receipt);
      built.receiptImageData = image;
      built.payerVenmo = venmo || undefined; // default from the saved handle
      setDraft(built);
      setReviewNote(
        data.receipt.needs_review
          ? { reason: data.receipt.review_reason ?? undefined }
          : null,
      );
      setParse({ status: "ready" });
    } catch (e) {
      setParse({
        status: "error",
        error: e instanceof Error ? e.message : "Couldn't read the receipt.",
      });
    }
  }, [venmo]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  function startScan() {
    setDraft(emptySession());
    setCaptureImage(null);
    setMode("new");
    setParse({ status: "ready" });
    setReviewNote(null);
    setScreen("capture");
  }

  function onReadReceipt(image: string) {
    setCaptureImage(image);
    setScreen("review");
    void runParse(image);
  }

  function openHistory(s: SplitSession) {
    setDraft(s);
    setMode("history");
    setScreen("summary");
  }

  // Central draft updater. In history mode, persist edits (e.g. paid toggles)
  // back to localStorage immediately.
  const updateDraft = useCallback(
    (s: SplitSession) => {
      setDraft(s);
      if (mode === "history") saveSession(s);
    },
    [mode],
  );

  function saveAndDone() {
    if (draft) {
      saveSession(draft);
      refreshSessions();
    }
    setScreen("home");
    setMode("new");
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  switch (screen) {
    case "capture":
      return (
        <CaptureScreen onBack={() => setScreen("home")} onReadReceipt={onReadReceipt} />
      );

    case "review":
      return (
        <ReviewScreen
          status={parse.status}
          error={parse.error}
          session={parse.status === "ready" ? draft : null}
          image={captureImage ?? undefined}
          reviewNote={reviewNote}
          onChange={updateDraft}
          onBack={() => setScreen("capture")}
          onContinue={() => setScreen("assign")}
          onRetry={() => captureImage && runParse(captureImage)}
        />
      );

    case "assign":
      return draft ? (
        <AssignScreen
          session={draft}
          onChange={updateDraft}
          onBack={() => setScreen("review")}
          onContinue={() => setScreen("summary")}
        />
      ) : null;

    case "summary":
      return draft ? (
        <SummaryScreen
          session={draft}
          onChange={updateDraft}
          mode={mode}
          onBack={() => setScreen(mode === "history" ? "home" : "assign")}
          onSaveDone={saveAndDone}
          onSaveVenmo={onChangeVenmo}
        />
      ) : null;

    case "home":
    default:
      return (
        <HomeScreen
          sessions={sessions}
          venmo={venmo}
          onChangeVenmo={onChangeVenmo}
          onScan={startScan}
          onOpen={openHistory}
          onDelete={(id) => {
            deleteSession(id);
            refreshSessions();
          }}
        />
      );
  }
}
