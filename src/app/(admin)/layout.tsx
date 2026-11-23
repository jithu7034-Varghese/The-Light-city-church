// Root layout #2: the admin dashboard. Separate <html> from the public site, so the
// Tailwind CSS here never loads on public pages (moving between them is a full page load).
//
// Cache Components: everything in the admin reads cookies (session, theme), so the whole
// admin renders at request time inside this <Suspense>. The theme is applied before first
// paint by a tiny inline script (no cookie read outside Suspense, and no colour flash).
import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/admin/ui/toaster";
import { THEME_COOKIE } from "@/components/admin/theme";
import "./admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Light City Admin" },
  robots: { index: false, follow: false },
};

// Static string (no user input): reads the theme cookie and sets <html data-theme>.
const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=(light|dark|system)/);document.documentElement.dataset.theme=m?m[1]:"system"}catch(e){}})()`;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" data-theme="system" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Suspense fallback={null}>{children}</Suspense>
        <Toaster />
      </body>
    </html>
  );
}
