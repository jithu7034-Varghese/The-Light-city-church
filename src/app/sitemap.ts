// /sitemap.xml: every published CMS page and devotional (cached reads, tags "pages"/"posts").
import type { MetadataRoute } from "next";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { cacheLife, cacheTag } from "next/cache";
import { getSitemapPosts } from "@/lib/posts/public";
import { absoluteUrl } from "@/lib/seo/site";
import { isValidSlug } from "@/lib/slug";

async function getSitemapPages(): Promise<{ slug: string; lastModified: string | null }[]> {
  "use cache";
  cacheTag("pages");
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient().from("pages").select("slug, published_at").eq("status", "published");
  if (error) console.error("[sitemap] pages failed", error.message);
  return (data ?? []).map((p) => ({ slug: String(p.slug), lastModified: p.published_at }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, posts] = await Promise.all([getSitemapPages(), getSitemapPosts()]);
  const pageEntries: MetadataRoute.Sitemap = pages
    .filter((p) => p.slug === "home" || isValidSlug(p.slug))
    .map((p) => ({
      url: absoluteUrl(p.slug === "home" ? "/" : `/${p.slug}`),
      ...(p.lastModified && { lastModified: p.lastModified }),
      changeFrequency: p.slug === "home" ? "weekly" : "monthly",
      priority: p.slug === "home" ? 1 : 0.7,
    }));
  const latest = posts[0]?.lastModified;
  return [
    ...pageEntries,
    { url: absoluteUrl("/devotionals"), ...(latest && { lastModified: latest }), changeFrequency: "daily", priority: 0.8 },
    ...posts.filter((p) => isValidSlug(p.slug)).map((p) => ({ url: absoluteUrl(`/devotionals/${p.slug}`), lastModified: p.lastModified, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
