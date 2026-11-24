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
  category: string | null; // first category (cards)
  categories: PublicCategory[];
  image: { url: string; alt: string } | null;
};

export type PublicCategory = { name: string; slug: string };
export type PostSeo = { title: string | null; description: string | null; keywords: string | null; imageUrl: string | null };
export type PublicAuthor = { name: string; position: string | null; photo: { url: string; alt: string } | null };
export type PublicPost = PublicPostCard & { content: unknown; seo: PostSeo; author: PublicAuthor | null; updatedDisplayAt: string | null };

const CARD_COLUMNS =
  "slug, title, excerpt, published_at, author_name, media:featured_media_id(storage_path, alt), post_categories(categories(name, slug))";
const POST_COLUMNS = `${CARD_COLUMNS}, content, updated_display_at, seo_title, seo_description, seo_keywords, seo_image_url, author:author_id(name, position, photo:photo_media_id(storage_path, alt))`;

type Row = {
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  author_name: string;
  media: { storage_path: string; alt: string } | null;
  post_categories: { categories: { name: string; slug: string } | null }[] | null;
};

type PostRow = Row & {
  content: unknown;
  updated_display_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  seo_image_url: string | null;
  author: { name: string; position: string | null; photo: { storage_path: string; alt: string } | null } | null;
};

function toCard(r: Row): PublicPostCard {
  const categories = (r.post_categories ?? [])
    .map((pc) => pc.categories)
    .filter((c): c is { name: string; slug: string } => Boolean(c))
    .map((c) => ({ name: c.name, slug: String(c.slug) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    slug: String(r.slug),
    title: r.title,
    excerpt: r.excerpt,
    publishedAt: r.published_at ?? new Date(0).toISOString(),
    authorName: r.author_name,
    category: categories[0]?.name ?? null,
    categories,
    image: r.media ? { url: publicMediaUrl(r.media.storage_path), alt: r.media.alt } : null,
  };
}

/** Categories for the /devotionals filter (only ones with a published devotional). */
export async function getPostCategories(): Promise<(PublicCategory & { id: string })[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  // The inner join runs through posts' RLS, so only categories on live devotionals come back.
  const { data, error } = await createSupabasePublicClient()
    .from("categories")
    .select("id, name, slug, post_categories!inner(posts!inner(id))")
    .order("name");
  if (error) console.error("[posts] categories failed", error.message);
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: String(c.slug) }));
}

/** One page of published devotionals, optionally only those in a category (by id). */
export async function getPublishedPosts(page: number, categoryId: string | null = null): Promise<{ posts: PublicPostCard[]; total: number }> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");
  const from = (Math.max(1, page) - 1) * POSTS_PER_PAGE;
  // A second, aliased embed filters by category without trimming the category chips.
  let query = createSupabasePublicClient()
    .from("posts")
    .select(categoryId ? `${CARD_COLUMNS}, in_category:post_categories!inner(category_id)` : CARD_COLUMNS, { count: "exact" });
  if (categoryId) query = query.eq("in_category.category_id", categoryId);
  const { data, count, error } = await query
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
    .select(POST_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) console.error("[posts] get failed", error.message);
  if (!data) return null;
  const row = data as unknown as PostRow;
  return {
    ...toCard(row),
    content: row.content,
    updatedDisplayAt: row.updated_display_at,
    seo: { title: row.seo_title, description: row.seo_description, keywords: row.seo_keywords, imageUrl: row.seo_image_url },
    author: row.author
      ? {
          name: row.author.name,
          position: row.author.position,
          photo: row.author.photo ? { url: publicMediaUrl(row.author.photo.storage_path), alt: row.author.photo.alt } : null,
        }
      : null,
  };
}
