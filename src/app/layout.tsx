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
  title: "The Light City Church — Nottingham",
  description: "Without miracles Christianity is reduced to philosophy. Christ in you the hope of Glory! Believe in God in you! Send your prayer request, or join us in person.",
  keywords: ["The Light City Church", "Lightcity", "Nottingham Church", "Ronnie Dube", "Annalene Dube", "Prayer for Healing", "Daily Light Devotional", "Motorpoint Arena Nottingham"],
  authors: [{ name: "The Light City Church" }],
  openGraph: {
    title: "Welcome to The Light City Church",
    description: "We are passionate about empowering every man, woman, and child to live in the fulness of their inheritance in Christ.",
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

