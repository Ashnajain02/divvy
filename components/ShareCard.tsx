"use client";

// Vertical "share card" rendered to PNG via html2canvas. Uses inline rgb styles
// (NOT Tailwind utility classes) so the rasterizer reliably resolves every
// color — html2canvas does not handle CSS custom properties or oklch well.

import { forwardRef } from "react";
import { colors } from "@/lib/theme";
import { formatMoney, grandTotal } from "@/lib/compute";
import type { PersonBreakdown } from "@/lib/compute";
import type { SplitSession } from "@/lib/types";

const ShareCard = forwardRef<
  HTMLDivElement,
  { session: SplitSession; breakdown: PersonBreakdown[] }
>(function ShareCard({ session, breakdown }, ref) {
  const date = (() => {
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

  return (
    <div
      ref={ref}
      style={{
        width: 380,
        padding: 28,
        background: colors.cardBg,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: colors.textPrimary,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26,
            fontWeight: 700,
            color: colors.primary,
          }}
        >
          {session.restaurantName || "Untitled receipt"}
        </div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
          {date}
        </div>
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 30,
            fontWeight: 700,
            color: colors.primary,
            marginTop: 10,
          }}
        >
          {formatMoney(grandTotal(session))}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: colors.gold,
          opacity: 0.5,
          marginBottom: 14,
        }}
      />

      {/* Per-person rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {breakdown.map((p) => (
          <div
            key={p.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  background: p.paid ? "rgba(64,158,122,0.18)" : "rgba(46,31,97,0.12)",
                  color: p.paid ? colors.success : colors.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  textDecoration: p.paid ? "line-through" : "none",
                  color: p.paid ? colors.textSecondary : colors.textPrimary,
                }}
              >
                {p.name}
              </span>
            </div>
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: p.paid ? colors.success : colors.primary,
                textDecoration: p.paid ? "line-through" : "none",
              }}
            >
              {formatMoney(p.total)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: 12,
          color: colors.textTertiary,
        }}
      >
        Split with Divvy · split the bill, not the friendship
      </div>
    </div>
  );
});

export default ShareCard;
