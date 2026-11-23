// Root layout #1: the public website (CSS Modules only, no Tailwind). Header, footer,
// announcement bar and default metadata all come from the published CMS globals (cached).
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteChrome";
import { AnnouncementBar, SiteFooter } from "@/components/site/SiteFooter";
import { getGlobal, getMediaByIds } from "@/cms/queries";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getGlobal("site");
  const name = site.name || "The Light City Church";
  return {
    title: { default: name, template: `%s` },
    description: site.tagline || undefined,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    openGraph: { siteName: name, type: "website", locale: "en_GB" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [navbar, footer, site, announcement] = await Promise.all([
    getGlobal("navbar"),
    getGlobal("footer"),
    getGlobal("site"),
    getGlobal("announcement"),
  ]);
  const logoMedia = navbar.logoImage ? (await getMediaByIds([navbar.logoImage.mediaId]))[navbar.logoImage.mediaId] : undefined;

  return (
    <html lang="en-GB" className={outfit.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AnnouncementBar data={announcement} />
        <SiteHeader
          logoText={navbar.logoText}
          logoAccent={navbar.logoAccent}
          logo={logoMedia ? { url: logoMedia.url, alt: logoMedia.alt } : null}
          items={navbar.items}
          cta={navbar.cta}
        />
        {children}
        <SiteFooter footer={footer} site={site} />
      </body>
    </html>
  );
}
