// Public devotional reads. Cookie-less anon client (RLS: published only) inside "use cache",
// tagged so admin saves can refresh them with updateTag (docs/ARCHITECTURE.md §9):
//   "posts"         every list (index, home page, related)
//   "post:<slug>"   one article
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media/url";

export const POSTS_PER_PAGE = 12;

export type PublicPostCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  authorName: string;
  category: string | null;
  image: { url: string; alt: string } | null;
};

export type PostSeo = { title?: string; description?: string; ogImage?: { mediaId?: string } | null };
export type PublicPost = PublicPostCard & { content: unknown; seo: PostSeo };

const CARD_COLUMNS =
  "slug, title, excerpt, published_at, author_name, media:featured_media_id(storage_path, alt), post_categories(categories(name))";

type Row = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  author_name: string;
  media: { storage_path: string; alt: string } | null;
  post_categories: { categories: { name: string } | null }[] | null;
  content?: unknown;
};

function toCard(r: Row): PublicPostCard {
  return {
    slug: String(r.slug),
    title: r.title,
    excerpt: r.excerpt,
    publishedAt: r.published_at ?? new Date(0).toISOString(),
    authorName: r.author_name,
    category: r.post_categories?.[0]?.categories?.name ?? null,
    image: r.media ? { url: publicMediaUrl(r.media.storage_path), alt: r.media.alt } : null,
  };
}

export async function getPublishedPosts(page: number): Promise<{ posts: PublicPostCard[]; total: number }> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const from = (Math.max(1, page) - 1) * POSTS_PER_PAGE;
  const { data, count, error } = await createSupabasePublicClient()
    .from("posts")
    .select(CARD_COLUMNS, { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, from + POSTS_PER_PAGE - 1);
  if (error) {
    console.error("[posts] list failed", error.message);
    return { posts: [], total: 0 };
  }
  return { posts: (data as unknown as Row[]).map(toCard), total: count ?? 0 };
}

export async function getLatestPosts(limit: number): Promise<PublicPostCard[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("posts")
    .select(CARD_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[posts] latest failed", error.message);
    return [];
  }
  return (data as unknown as Row[]).map(toCard);
}

/** Published devotionals for the sitemap. */
export async function getSitemapPosts(): Promise<{ slug: string; lastModified: string }[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("posts")
    .select("slug, published_at, updated_at")
    .order("published_at", { ascending: false })
    .limit(5000);
  if (error) console.error("[posts] sitemap failed", error.message);
  return (data ?? []).map((p) => ({ slug: String(p.slug), lastModified: p.updated_at ?? p.published_at ?? new Date(0).toISOString() }));
}

/** Every published slug (for generateStaticParams). */
export async function getPublishedPostSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient().from("posts").select("slug").order("published_at", { ascending: false }).limit(2000);
  if (error) console.error("[posts] slugs failed", error.message);
  return (data ?? []).map((p) => String(p.slug));
}

export async function getPostBySlug(slug: string): Promise<PublicPost | null> {
  "use cache";
  cacheTag("posts", `post:${slug}`);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("posts")
    .select(`${CARD_COLUMNS}, content, seo`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("[posts] get failed", error.message);
  if (!data) return null;
  const row = data as unknown as Row & { seo: PostSeo | null };
  return { ...toCard(row), content: row.content, seo: row.seo ?? {} };
}
