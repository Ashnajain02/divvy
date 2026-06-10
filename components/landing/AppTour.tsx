"use client";

// Scroll-scrubbed, pinned tour of the actual app. A phone mockup slides through
// the four screens (Capture → Review → Assign → Summary) as you scroll. The
// screens are rebuilt from the REAL app primitives (Card, Chip, Button, NavBar,
// the `type` scale, icons, GoldDivider) with mock data, so the preview is
// pixel-consistent with the product. The whole phone is aria-hidden +
// pointer-events-none — it's a decorative demo; the real app lives at /app.

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Chip,
  GoldButton,
  GoldDivider,
  NavBar,
  SectionHeader,
  type as T,
} from "@/components/ui";
import {
  CameraIcon,
  ChevronLeftIcon,
  CircleIcon,
  FolderIcon,
  MoreIcon,
  PercentIcon,
  PhotosIcon,
  PlusIcon,
  ScanIcon,
  SendIcon,
  ShareIcon,
} from "@/components/icons";

const STEPS = [
  "Snap the receipt",
  "Review the items",
  "Assign to everyone",
  "Settle up",
];

// Screens are authored at a real phone's logical width, then the whole screen is
// scaled down to fit the mockup — so the UI is proportioned exactly like a real
// device, just smaller.
const DESIGN_W = 390;

export default function AppTour() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepRef = useRef(0);
  const metrics = useRef({ top: 0, range: 1 });
  const [reduced, setReduced] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setReduced(
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
  }, []);

  useEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    if (!section) return;
    const measure = () => {
      metrics.current = {
        top: section.getBoundingClientRect().top + window.scrollY,
        range: Math.max(section.offsetHeight - window.innerHeight, 1),
      };
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      const { top, range } = metrics.current;
      const p = Math.min(Math.max((window.scrollY - top) / range, 0), 1);
      // Which of the four screens is showing. Capture/Review/Assign get shorter
      // windows; the Summary (the payoff) holds for the whole back third.
      const s = p < 0.22 ? 0 : p < 0.43 ? 1 : p < 0.64 ? 2 : 3;
      if (s !== stepRef.current) {
        stepRef.current = s;
        setStep(s);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const active = reduced ? 3 : step;
  const inner = (
    <>
      <Eyebrow />
      <Phone active={active} reduced={reduced} />
      <Caption step={active} />
      {!reduced && <Dots step={step} />}
    </>
  );

  if (reduced) {
    return (
      <section
        id="tour"
        className="flex min-h-[85vh] flex-col items-center justify-center gap-5 bg-background px-6 py-20"
      >
        {inner}
      </section>
    );
  }

  return (
    <section id="tour" ref={sectionRef} className="relative h-[320vh] bg-background">
      <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center gap-4 overflow-hidden px-6">
        {inner}
      </div>
    </section>
  );
}

function Eyebrow() {
  return (
    <div className="text-center">
      <p className={`${T.sectionHeader} text-gold`}>See it in action</p>
      <h2 className="mt-1 font-serif text-[26px] font-bold leading-tight text-text-primary">
        From photo to paid
      </h2>
    </div>
  );
}

function Caption({ step }: { step: number }) {
  return (
    <p className={`${T.label} text-text-secondary`}>
      <span className="text-gold">{step + 1}</span> &middot; {STEPS[step]}
    </p>
  );
}

function Dots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === step ? "w-5 bg-primary" : "w-1.5 bg-gold/40"
          }`}
        />
      ))}
    </div>
  );
}

// ── Phone frame ──────────────────────────────────────────────────────────────
const SCREENS = [ScreenCapture, ScreenReview, ScreenAssign, ScreenSummary];

function Phone({ active, reduced }: { active: number; reduced?: boolean }) {
  const screenRef = useRef<HTMLDivElement>(null);
  // scale = how much to shrink the 390px-wide design to fit the actual screen;
  // h = the screen's height expressed in pre-scale (logical) pixels.
  const [dim, setDim] = useState({ scale: 0.64, h: 760 });

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (!r.width) return;
      const scale = r.width / DESIGN_W;
      setDim({ scale, h: r.height / scale });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      aria-hidden
      className="relative shrink-0 select-none"
      style={{ width: "min(280px, 78vw)", pointerEvents: "none" }}
    >
      <div
        className="relative aspect-[9/18.5] rounded-[40px] p-[10px] shadow-[0_30px_70px_rgba(46,31,97,0.28)]"
        style={{ background: "rgb(28,23,18)" }}
      >
        <div
          ref={screenRef}
          className="relative h-full w-full overflow-hidden rounded-[32px]"
          style={{ background: "rgb(247,242,232)" }}
        >
          {/* Logical 390px-wide canvas, scaled to fit the screen. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: DESIGN_W,
              height: dim.h,
              transform: `scale(${dim.scale})`,
              transformOrigin: "top left",
            }}
          >
            {/* The four screens, stacked; the active one cross-fades in. */}
            <div className="absolute inset-0">
              {SCREENS.map((Screen, i) => (
                <div
                  key={i}
                  className="absolute inset-0"
                  style={{
                    opacity: active === i ? 1 : 0,
                    zIndex: active === i ? 20 : 10,
                    transition: reduced ? undefined : "opacity 350ms ease",
                  }}
                >
                  <Screen />
                </div>
              ))}
            </div>

            {/* Status bar + dynamic island (always on top) */}
            <div className="absolute inset-x-0 top-0 z-30 flex h-9 items-center justify-between px-6 pt-2">
              <span className="font-rounded text-[13px] font-semibold text-text-primary">
                9:41
              </span>
              <span className="block h-2.5 w-5 rounded-[3px] border border-text-secondary/60" />
            </div>
            <div
              className="absolute left-1/2 top-2.5 z-40 h-5 w-20 -translate-x-1/2 rounded-full"
              style={{ background: "rgb(28,23,18)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared screen shell: status spacer + app NavBar + body.
function Panel({
  title,
  back,
  right,
  children,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden pt-10">
      <NavBar
        title={title}
        left={
          back ? (
            <span className="flex h-11 w-11 items-center justify-center text-text-secondary">
              <ChevronLeftIcon className="h-5 w-5" />
            </span>
          ) : undefined
        }
        right={right}
      />
      <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">{children}</div>
    </div>
  );
}

// Read-only stand-in for an editable field, styled exactly like the app's.
function Field({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-11 items-center rounded-[10px] bg-background-deep/40 px-3 ${T.body} text-text-primary ${className}`}
    >
      {children}
    </div>
  );
}

// ── Screen 1: Capture ────────────────────────────────────────────────────────
function ScreenCapture() {
  return (
    <Panel title="Scan Receipt" back>
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/12">
            <ScanIcon className="h-8 w-8 text-gold" />
          </div>
          <p className={`${T.title} mt-4 text-text-primary`}>
            Capture your receipt
          </p>
          <p className={`${T.caption} mt-1 text-text-secondary`}>
            Take a photo or choose a file
          </p>
        </div>
        <div className="space-y-3">
          <Button>
            <CameraIcon /> Take Photo
          </Button>
          <Button variant="secondary">
            <PhotosIcon /> Photo Library
          </Button>
          <Button variant="secondary">
            <FolderIcon /> Browse Files
          </Button>
        </div>
      </div>
    </Panel>
  );
}

// ── Screen 2: Review ─────────────────────────────────────────────────────────
function ScreenReview() {
  const items = [
    ["Cheeseburger", "16.00"],
    ["Caesar Salad", "10.00"],
    ["Iced Tea", "4.00"],
  ];
  return (
    <Panel title="Review Items" back>
      <div className="space-y-3">
        <SectionHeader>Items</SectionHeader>
        {items.map(([name, price]) => (
          <Card key={name} className="flex items-center gap-2">
            <Field className="flex-1">{name}</Field>
            <Field className="w-24 justify-end gap-0.5">
              <span className={`${T.price} text-text-secondary`}>$</span>
              <span className={`${T.price} text-text-primary`}>{price}</span>
            </Field>
            <span className="flex h-10 w-10 items-center justify-center text-text-secondary">
              <MoreIcon />
            </span>
          </Card>
        ))}
        <SectionHeader>Totals</SectionHeader>
        <Card className="space-y-1">
          <Row label="Subtotal" value="$30.00" />
          <Row label="Tax" value="$2.40" />
          <Row label="Tip" value="$6.00" />
          <div className="flex items-center justify-between pt-1">
            <span className={`${T.title} text-text-primary`}>Total</span>
            <span className={`${T.priceLarge} text-primary`}>$38.40</span>
          </div>
        </Card>
      </div>
    </Panel>
  );
}

// ── Screen 3: Assign ─────────────────────────────────────────────────────────
function ScreenAssign() {
  return (
    <Panel title="Assign" back>
      <div className="space-y-3">
        <SectionHeader>People</SectionHeader>
        <div className="flex flex-wrap gap-2">
          {["Alex", "Sam"].map((p) => (
            <span
              key={p}
              className={`inline-flex min-h-9 items-center rounded-full border border-gold/30 bg-background-deep px-3 py-1.5 ${T.label} text-text-primary`}
            >
              {p}
            </span>
          ))}
          <span
            className={`inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-primary-light/50 px-3 py-1.5 ${T.label} text-primary-light`}
          >
            <PlusIcon className="h-4 w-4" /> Add
          </span>
        </div>
        <GoldDivider />
        <SectionHeader>Items</SectionHeader>
        <AssignItem
          name="Cheeseburger"
          price="$16.00"
          alex
          sam
          status="Split 2 ways — $8.00 each"
        />
        <AssignItem
          name="Caesar Salad"
          price="$10.00"
          alex
          status="Assigned to Alex"
        />
        <AssignItem
          name="Iced Tea"
          price="$4.00"
          sam
          status="Assigned to Sam"
        />
      </div>
    </Panel>
  );
}

// ── Screen 4: Summary ────────────────────────────────────────────────────────
function ScreenSummary() {
  return (
    <Panel
      title="Summary"
      back
      right={
        <span className="flex h-11 w-11 items-center justify-center text-primary">
          <ShareIcon className="h-5 w-5" />
        </span>
      }
    >
      <div className="space-y-3">
        <Card className="text-center">
          <h2 className={`${T.headline} text-text-primary`}>The Corner Table</h2>
          <p className={`${T.caption} text-text-secondary`}>Today</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
            <Stat label="Subtotal" value="$30.00" />
            <Stat label="Tax" value="$2.40" />
            <Stat label="Tip" value="$6.00" />
          </div>
          <div className="mt-3">
            <span className={`${T.small} block text-text-tertiary`}>Total</span>
            <span className="font-serif text-[32px] font-bold text-primary">
              $38.40
            </span>
          </div>
        </Card>

        {/* Tax & Tip split toggle — set to Proportional for the demo. */}
        <Card className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 shrink-0 text-gold">
              <PercentIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className={`${T.title} text-text-primary`}>Tax &amp; Tip Split</p>
              <p className={`${T.caption} text-text-secondary`}>
                Proportional to each order
              </p>
            </div>
          </div>
          <div className="flex shrink-0 rounded-full border border-gold/30 bg-background-deep p-0.5">
            <TogglePill active={false}>Even</TogglePill>
            <TogglePill active>Proportional</TogglePill>
          </div>
        </Card>

        <PersonCard
          initial="A"
          name="Alex"
          amount="$23.04"
          lines={[
            ["Cheeseburger", "(2-way)", "$8.00"],
            ["Caesar Salad", "", "$10.00"],
            ["Tax, Charges & Tip", "", "$5.04"],
          ]}
          request
        />
        <PersonCard
          initial="S"
          name="Sam"
          amount="$15.36"
          lines={[
            ["Cheeseburger", "(2-way)", "$8.00"],
            ["Iced Tea", "", "$4.00"],
            ["Tax, Charges & Tip", "", "$3.36"],
          ]}
          request
        />
      </div>
    </Panel>
  );
}

function PersonCard({
  initial,
  name,
  amount,
  lines,
  request,
}: {
  initial: string;
  name: string;
  amount: string;
  lines: [string, string, string][];
  request?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full font-rounded font-bold"
          style={{ background: "rgba(46,31,97,0.12)", color: "rgb(46,31,97)" }}
        >
          {initial}
        </div>
        <p className={`${T.title} flex-1 text-text-primary`}>{name}</p>
        <span className={`${T.priceLarge} text-primary`}>{amount}</span>
      </div>
      <div className="my-2.5">
        <GoldDivider />
      </div>
      <ul className="space-y-1">
        {lines.map(([n, badge, v]) => (
          <li key={n} className="flex items-center justify-between gap-2">
            <span className={`${T.body} truncate text-text-primary`}>
              {n}
              {badge && <span className={`${T.small} ml-1 text-gold`}>{badge}</span>}
            </span>
            <span className={`${T.price} text-text-secondary`}>{v}</span>
          </li>
        ))}
      </ul>
      <div className="my-2.5">
        <GoldDivider />
      </div>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 ${T.label} text-text-secondary`}>
          <CircleIcon className="h-4 w-4" /> Mark as Paid
        </span>
        {request && (
          <GoldButton>
            <SendIcon className="h-4 w-4" /> Request
          </GoldButton>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${T.body} text-text-secondary`}>{label}</span>
      <span className={`${T.price} text-text-primary`}>{value}</span>
    </div>
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
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 ${T.small} ${
        active ? "bg-primary text-white" : "text-text-secondary"
      }`}
    >
      {children}
    </span>
  );
}

function AssignItem({
  name,
  price,
  alex,
  sam,
  status,
}: {
  name: string;
  price: string;
  alex?: boolean;
  sam?: boolean;
  status: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className={`${T.title} text-text-primary`}>{name}</p>
        <span className={`${T.price} text-primary`}>{price}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Chip selected={!!alex}>Alex</Chip>
        <Chip selected={!!sam}>Sam</Chip>
      </div>
      <p className={`${T.small} mt-2 text-gold`}>{status}</p>
    </Card>
  );
}
