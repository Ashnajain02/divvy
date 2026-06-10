// Dynamic Open Graph image for a shared split — this is what unfurls in
// iMessage / WhatsApp / Slack. An "invitation card": Divvy logo + the
// restaurant, the total, and a prompt to tap. Generated per split via Satori.
//
// Assets are fetched over HTTPS at request time (fonts from a CDN, the logo
// from our own origin) rather than read from disk — colocated-file reads aren't
// reliably bundled into the serverless function under Turbopack.

import { headers } from "next/headers";
import { ImageResponse } from "next/og";
import { getSharedSplit } from "@/lib/redis";

export const runtime = "nodejs";
export const alt = "Your Divvy split";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FRAUNCES_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5/files/fraunces-latin-700-normal.woff";
const INTER_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-500-normal.woff";

const BG =
  "radial-gradient(60% 50% at 12% 4%, rgba(199,166,97,0.22), transparent 70%), linear-gradient(150deg, #281B56 0%, #2E1F61 50%, #3F2A78 100%)";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Just the restaurant name — no total/count on the card (keeps the bill
  // amount out of the chat preview). null = no/expired split → generic card.
  let restaurant: string | null = null;
  try {
    const s = await getSharedSplit(id);
    if (s) restaurant = s.restaurantName?.trim() || "Your split";
  } catch {
    // generic branded card
  }

  // Origin (for the logo) from the incoming request — works on any domain.
  const host = (await headers()).get("host") ?? "div-vy.vercel.app";
  const origin = `${host.includes("localhost") ? "http" : "https"}://${host}`;

  const [frauncesData, interData, logoBuf] = await Promise.all([
    fetch(FRAUNCES_URL).then((r) => r.arrayBuffer()),
    fetch(INTER_URL).then((r) => r.arrayBuffer()),
    fetch(`${origin}/divvy-logo.png`).then((r) => r.arrayBuffer()),
  ]);
  const logoSrc = `data:image/png;base64,${Buffer.from(logoBuf).toString("base64")}`;

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

        {/* Center: restaurant name + tap prompt */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: 88,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
            }}
          >
            {restaurant ?? "Split the bill, not the friendship"}
          </div>
          {restaurant && (
            <div style={{ display: "flex", fontSize: 40, color: "#E6D194", marginTop: 28 }}>
              Tap to see what you owe  →
            </div>
          )}
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
