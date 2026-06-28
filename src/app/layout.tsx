// src/app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AERO-SHIELD X1 — Breathe Pure in a Polluted World",
  description: "Experience the next generation of personal air purification. Aero-Shield X1 provides a clean breathing zone with state-of-the-art particulate filtering and active ventilation.",
  keywords: ["Aero-Shield", "Air Purifier", "Wearable Tech", "Breathe Pure", "Personal Air Shield"],
  authors: [{ name: "Aero-Shield Tech" }],
  openGraph: {
    title: "AERO-SHIELD X1 — Breathe Pure in a Polluted World",
    description: "Experience the next generation of personal air purification.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

