// Root layout #1: the public website (CSS Modules only, no Tailwind). Header, footer,
// announcement bar and default metadata all come from the published CMS globals (cached).
import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteChrome";
import { LiquidGlassDefs } from "@/components/site/LiquidGlass";
import { AnnouncementBar, SiteFooter } from "@/components/site/SiteFooter";
import { getGlobal, getMediaByIds } from "@/cms/queries";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Accent word at the end of main headings (Playfair Display Italic).
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["italic"],
  weight: ["400", "500"],
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
  const imageIds = [navbar.logoImage?.mediaId, site.sectionBackground?.mediaId, footer.sceneImage?.mediaId]
    .filter((id): id is string => Boolean(id))
    .sort();
  const media = await getMediaByIds(imageIds);
  const logoMedia = navbar.logoImage ? media[navbar.logoImage.mediaId] : undefined;
  const logo = logoMedia ? { url: logoMedia.url, alt: logoMedia.alt } : null;
  // Footer scene: Footer → scene photo, else Site settings → "Section background image" (which is
  // also the fallback photo for sections, through ctx.background).
  const sceneMedia =
    (footer.sceneImage ? media[footer.sceneImage.mediaId] : undefined) ??
    (site.sectionBackground ? media[site.sectionBackground.mediaId] : undefined);

  return (
    <html lang="en-GB" className={`${outfit.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <LiquidGlassDefs />
        <AnnouncementBar data={announcement} />
        <SiteHeader
          logoText={navbar.logoText}
          logoAccent={navbar.logoAccent}
          logo={logo}
          items={navbar.items}
          cta={navbar.cta}
        />
        <main id="main" className="site-main">{children}</main>
        <SiteFooter
          footer={footer}
          site={site}
          brand={{ logoText: navbar.logoText, logoAccent: navbar.logoAccent, logo }}
          background={sceneMedia ? { url: sceneMedia.url } : null}
        />
      </body>
    </html>
  );
}
