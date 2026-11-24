// Renders a published page: every visible section, upgraded + validated through the registry.
// A section whose data no longer parses is skipped (and logged) instead of breaking the page.
import "server-only";
import type { Metadata } from "next";
import { getSectionDef } from "./registry";
import { collectMediaIds, type ImageRef } from "./fields";
import { getGlobal, getMediaByIds, type PublishedPage } from "./queries";
import type { SectionCtx } from "./define";
import { splitKeywords } from "./seo";

export async function PageSections({ page }: { page: PublishedPage }) {
  const visible = page.sections.filter((s) => s.visible !== false);
  const [media, site] = await Promise.all([getMediaByIds([...collectMediaIds(visible)].sort()), getGlobal("site")]);
  const ctx: SectionCtx = {
    pageSlug: page.slug,
    site,
    image: (ref: ImageRef | undefined) => (ref?.mediaId ? (media[ref.mediaId] ?? null) : null),
  };

  return (
    <>
      {visible.map((section) => {
        const def = getSectionDef(section.type);
        const data = def?.parse(section.data, section.schema_version);
        if (!def || !data) {
          console.error(`[cms] skipped section ${section.type} on /${page.slug}`);
          return null;
        }
        const Component = def.Component;
        return <Component key={section.id} data={data} ctx={ctx} />;
      })}
    </>
  );
}

/** Metadata from the page's SEO fields, falling back to Site settings (name, tagline). */
export async function pageMetadata(page: PublishedPage | null, path: string): Promise<Metadata> {
  if (!page) return { title: "Page not found", robots: { index: false } };
  const site = await getGlobal("site");
  const siteName = site.name || "The Light City Church";
  const title = page.seo.title || (page.slug === "home" ? siteName : `${page.title} | ${siteName}`);
  const description = page.seo.description || site.tagline || undefined;
  // Share image: the page's SEO image, else the first image on the page (e.g. its hero).
  const firstImage = page.seo.image ? undefined : [...collectMediaIds(page.sections.filter((s) => s.visible !== false))][0];
  const image = page.seo.image ? { url: page.seo.image, alt: page.title } : firstImage ? (await getMediaByIds([firstImage]))[firstImage] : undefined;
  return {
    title,
    description,
    keywords: splitKeywords(page.seo.keywords),
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", url: path, siteName, ...(image && { images: [{ url: image.url, alt: image.alt }] }) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}
