// Dynamic Open Graph image for a shared split — this is what unfurls in
// iMessage / WhatsApp / Slack. An "invitation card": Divvy logo + the
// restaurant, the total, and a prompt to tap. Generated per split via Satori.

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { ImageResponse } from "next/og";
import { getSharedSplit } from "@/lib/redis";
import { formatMoney, grandTotal } from "@/lib/compute";

export const runtime = "nodejs";
export const alt = "Your Divvy split";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read the bundled font/logo assets from disk (the fetch(new URL()) pattern
// isn't supported in this runtime). Loaded once at module init.
const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)));
const frauncesData = read("./Fraunces.woff");
const interData = read("./Inter.woff");
const logoSrc = `data:image/png;base64,${read("./og-logo.png").toString("base64")}`;

const BG =
  "radial-gradient(60% 50% at 12% 4%, rgba(199,166,97,0.22), transparent 70%), linear-gradient(150deg, #281B56 0%, #2E1F61 50%, #3F2A78 100%)";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let restaurant = "Divvy";
  let total: string | null = null;
  let peopleLine = "Split the bill, not the friendship";
  try {
    const s = await getSharedSplit(id);
    if (s) {
      restaurant = s.restaurantName?.trim() || "Your split";
      total = formatMoney(grandTotal(s));
      const n = s.people.length;
      peopleLine = n > 0 ? `Split ${n} ${n === 1 ? "way" : "ways"}` : "Tap to split up";
    }
  } catch {
    // fall through to the generic branded card
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "60px 72px",
          color: "#FDFAF2",
          background: BG,
          fontFamily: "Inter",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={88} height={88} style={{ borderRadius: 22 }} alt="" />
          <div
            style={{
              display: "flex",
              marginLeft: 20,
              fontFamily: "Fraunces",
              fontSize: 48,
              fontWeight: 700,
              color: "#ffffff",
            }}
          >
            Divvy
          </div>
        </div>

        {/* Center */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 32, color: "#E6D194", marginBottom: 4 }}>
            {restaurant}
          </div>
          {total ? (
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: 150,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1,
              }}
            >
              {total}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                fontFamily: "Fraunces",
                fontSize: 84,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.05,
              }}
            >
              Split any bill from a photo
            </div>
          )}
          <div style={{ display: "flex", fontSize: 36, color: "#E6D194", marginTop: 16 }}>
            {peopleLine}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.85)" }}>
            Tap to see what you owe  →
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 24,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            divvy
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: frauncesData, weight: 700, style: "normal" },
        { name: "Inter", data: interData, weight: 500, style: "normal" },
      ],
    },
  );
}
