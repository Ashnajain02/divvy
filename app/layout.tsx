import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import "./globals.css";

// Serif display face for the Divvy wordmark, headlines and summary totals.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Divvy — Split the bill, not the friendship",
  description:
    "Snap a receipt, split it fairly, and settle up. Divvy turns a photo into a per-person total in seconds.",
  // Favicon uses a small copy of the brand asset; Apple touch icon uses the
  // larger one.
  icons: { icon: "/divvy-icon.png", apple: "/divvy-logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Intentionally allow pinch-zoom — capping maximum-scale harms accessibility.
  // viewport-fit=cover lets us paint into the safe-area insets ourselves.
  viewportFit: "cover",
  themeColor: "#2E1F61",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
