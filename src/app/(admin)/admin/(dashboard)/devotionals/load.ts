import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media/url";
import type { PostFormValue } from "@/components/admin/devotionals/post-form";

export async function loadCategories() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("categories").select("id, name").order("name");
  return data ?? [];
}

/** A post shaped for the editor, read as the user (RLS). */
export async function loadPostForEditor(id: string): Promise<PostFormValue | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("posts")
    .select("id, title, slug, excerpt, content, status, published_at, media:featured_media_id(id, storage_path, alt), post_categories(category_id)")
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
    categoryId: (data.post_categories as { category_id: string }[] | null)?.[0]?.category_id ?? null,
    status: data.status === "published" ? "published" : "draft",
    publishedAt: data.published_at,
  };
}
