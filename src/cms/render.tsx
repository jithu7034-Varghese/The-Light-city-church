// Renders a published page: every visible section, upgraded + validated through the registry.
// A section whose data no longer parses is skipped (and logged) instead of breaking the page.
import "server-only";
import type { Metadata } from "next";
import { getSectionDef } from "./registry";
import { collectMediaIds, type ImageRef } from "./fields";
import { getGlobal, getMediaByIds, type PublishedPage } from "./queries";
import type { SectionCtx } from "./define";

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

export function pageMetadata(page: PublishedPage | null, path: string): Metadata {
  if (!page) return { title: "Page not found" };
  const title = page.seo.title || `${page.title} | The Light City Church`;
  return {
    title,
    description: page.seo.description || undefined,
    alternates: { canonical: path },
    openGraph: { title, description: page.seo.description || undefined, type: "website" },
  };
}
