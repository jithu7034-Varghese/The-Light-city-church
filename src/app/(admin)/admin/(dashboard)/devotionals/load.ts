import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media/url";
import { seoFromRow } from "@/cms/seo";
import type { PostFormValue } from "@/components/admin/devotionals/post-form";

export async function loadCategories() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("name");
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, slug: String(c.slug) }));
}

export type AdminAuthor = { id: string; name: string; position: string | null; photo: { id: string; url: string; alt: string } | null };

export async function loadAuthors(): Promise<AdminAuthor[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("authors").select("id, name, position, photo:photo_media_id(id, storage_path, alt)").order("name");
  return (data ?? []).map((a) => {
    const photo = a.photo as { id: string; storage_path: string; alt: string } | null;
    return { id: a.id, name: a.name, position: a.position, photo: photo ? { id: photo.id, url: publicMediaUrl(photo.storage_path), alt: photo.alt } : null };
  });
}

/** A post shaped for the editor, read as the user (RLS). */
export async function loadPostForEditor(id: string): Promise<PostFormValue | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content, status, published_at, updated_display_at, author_id, seo_title, seo_description, seo_keywords, seo_image_url, media:featured_media_id(id, storage_path, alt), post_categories(category_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const media = data.media as { id: string; storage_path: string; alt: string } | null;
  return {
    id: data.id,
    title: data.title,
    slug: String(data.slug),
    excerpt: data.excerpt ?? "",
    content: (data.content as PostFormValue["content"]) ?? { type: "doc", content: [] },
    featured: media ? { id: media.id, url: publicMediaUrl(media.storage_path), alt: media.alt } : null,
    categoryIds: ((data.post_categories as { category_id: string }[] | null) ?? []).map((c) => c.category_id),
    authorId: data.author_id,
    status: data.status === "published" ? "published" : "draft",
    publishedAt: data.published_at,
    updatedDisplayAt: data.updated_display_at,
    seo: seoFromRow(data),
  };
}
