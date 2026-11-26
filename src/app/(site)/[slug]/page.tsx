// Every CMS page except home: /about, /contact, /give, /freedom-from-religion, …
// `ensureStatic = "navigation"`: an unknown slug's first request waits for the complete page
// (no streamed App Shell), so a missing page returns a real 404 status.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import s from "@/cms/sections/shared/shared.module.css";
import { getPublishedPage, getPublishedPageSlugs } from "@/cms/queries";
import { PageSections, pageMetadata } from "@/cms/render";
import { isValidSlug } from "@/lib/slug";

export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const slugs = (await getPublishedPageSlugs()).filter((s) => s !== "home" && isValidSlug(s));
  // Cache Components needs at least one param; the placeholder simply 404s.
  return (slugs.length ? slugs : ["__placeholder__"]).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = isValidSlug(slug) && slug !== "home" ? await getPublishedPage(slug) : null;
  return pageMetadata(page, `/${slug}`);
}

export default async function CmsPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  if (!isValidSlug(slug) || slug === "home") notFound();
  const page = await getPublishedPage(slug);
  if (!page) notFound();
  return (
    <div className={s.page}>
      <PageSections page={page} />
    </div>
  );
}
