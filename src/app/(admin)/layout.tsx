// Root layout #2: the admin dashboard. Separate <html> from the public site, so the
// Tailwind CSS here never loads on public pages (moving between them is a full page load).
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "@/components/admin/ui/toaster";
import { THEME_COOKIE, parseTheme } from "@/components/admin/theme";
import "./admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Light City Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en-GB" data-theme={theme} className={inter.variable}>
      <body className="min-h-dvh">
        {children}
        <Toaster theme={theme} />
      </body>
    </html>
  );
}
