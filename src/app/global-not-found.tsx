// 404 for URLs that match no route. Needed because the app has two root layouts
// ((site) and (admin)), so there's no single layout to build a 404 from.
// Phase 6 adds the SEO Manager redirect lookup before showing this page.
import type { Metadata } from "next";
import Link from "next/link";
import { Outfit } from "next/font/google";
import "./(site)/globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", weight: ["400", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--text-secondary)", letterSpacing: "0.2em" }}>404</p>
          <h1 style={{ fontSize: "2rem", fontWeight: 600 }}>We couldn&apos;t find that page</h1>
          <p style={{ color: "var(--text-secondary)", maxWidth: "28rem" }}>
            It may have moved when our website was updated.
          </p>
          <Link href="/" style={{ textDecoration: "underline" }}>Go to the home page</Link>
        </main>
      </body>
    </html>
  );
}
