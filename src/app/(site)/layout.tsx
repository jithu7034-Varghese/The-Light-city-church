// Root layout #1: the public website (CSS Modules only, no Tailwind). Header, footer,
// announcement bar and default metadata all come from the published CMS globals (cached).
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteChrome";
import { AnnouncementBar, SiteFooter } from "@/components/site/SiteFooter";
import { getGlobal, getMediaByIds } from "@/cms/queries";
import { cssImageUrl } from "@/lib/media/url";
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
  const imageIds = [navbar.logoImage?.mediaId, site.sectionBackground?.mediaId].filter((id): id is string => Boolean(id)).sort();
  const media = await getMediaByIds(imageIds);
  const logoMedia = navbar.logoImage ? media[navbar.logoImage.mediaId] : undefined;
  // Site settings → "Section background image": used by globals.css / page.module.css through
  // --section-bg-image, over a dark gradient that also stands alone when no image is chosen.
  const sectionBg = cssImageUrl(site.sectionBackground ? media[site.sectionBackground.mediaId]?.url : null);
  const htmlStyle = sectionBg ? ({ "--section-bg-image": sectionBg } as React.CSSProperties) : undefined;

  return (
    <html lang="en-GB" className={outfit.variable} style={htmlStyle}>
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
