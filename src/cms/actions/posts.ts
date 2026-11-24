"use server";
// Devotionals (posts). Zod → requireStaff → can() (edit, plus publish when the post is or
// becomes published) → DB as the user (RLS) → updateTag so the public pages refresh at once.
// posts has a DB audit trigger, so only post_categories changes (no trigger) call logActivity().
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidSlug, SLUG_MAX } from "@/lib/slug";
import { sanitizeDoc } from "@/lib/tiptap/sanitize";
import { seoSchema } from "@/cms/seo";
import type { Json } from "@/lib/supabase/database.types";

export type PostResult = { ok: true; id: string; message: string } | { ok: false; error: string; field?: string };

const tiptapDoc = z
  .looseObject({ type: z.literal("doc"), content: z.array(z.unknown()) })
  .refine((d) => JSON.stringify(d).length <= 500_000, "This devotional is too long to save");

const postSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Add a title").max(300),
  slug: z.string().trim().max(SLUG_MAX).refine(isValidSlug, "Use lowercase letters, numbers and single dashes (e.g. known-as-father)"),
  excerpt: z.string().trim().max(500, "Keep the excerpt under 500 characters").optional(),
  content: tiptapDoc,
  featuredMediaId: z.uuid().nullable(),
  categoryIds: z.array(z.uuid()).max(20, "Choose up to 20 categories").transform((ids) => [...new Set(ids)]),
  authorId: z.uuid().nullable(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedDisplayAt: z.iso.datetime({ offset: true }).nullable(),
  seo: seoSchema,
});
export type PostInput = z.input<typeof postSchema>;

function refreshPublic(...slugs: (string | null | undefined)[]) {
  updateTag("posts");
  for (const s of new Set(slugs.filter(Boolean))) updateTag(`post:${s}`);
}

export async function savePost(input: PostInput): Promise<PostResult> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check the form", field: issue?.path.map(String).join(".") };
  }
  const p = parsed.data;
  const user = await requireStaff();
  if (!can(user, "posts", "edit")) return { ok: false, error: "You don't have permission to edit devotionals." };

  const supabase = await createSupabaseServerClient();
  let previous: { slug: string; status: string } | null = null;
  if (p.id) {
    const { data } = await supabase.from("posts").select("slug, status").eq("id", p.id).maybeSingle();
    if (!data) return { ok: false, error: "That devotional no longer exists." };
    previous = { slug: String(data.slug), status: data.status };
  }
  // Changing what's live (publishing, or editing a published post) needs `publish`.
  const touchesLive = p.status === "published" || previous?.status === "published";
  if (touchesLive && !can(user, "posts", "publish")) {
    return { ok: false, error: "You can save drafts, but publishing needs an Editor or Admin." };
  }

  // The byline text is kept in step with the chosen author (cards, RSS-style fallbacks).
  let authorName: string | undefined;
  if (p.authorId) {
    const { data: author } = await supabase.from("authors").select("name").eq("id", p.authorId).maybeSingle();
    if (!author) return { ok: false, error: "That author no longer exists. Choose another.", field: "authorId" };
    authorName = author.name;
  }

  const row = {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || null,
    content: sanitizeDoc(p.content) as unknown as NonNullable<Json>,
    featured_media_id: p.featuredMediaId,
    author_id: p.authorId,
    ...(authorName && { author_name: authorName }),
    status: p.status,
    published_at: p.status === "published" ? (p.publishedAt ?? new Date().toISOString()) : p.publishedAt,
    updated_display_at: p.updatedDisplayAt,
    seo_title: p.seo.title,
    seo_description: p.seo.description,
    seo_keywords: p.seo.keywords,
    seo_image_url: p.seo.imageUrl,
  };

  const write = p.id
    ? supabase.from("posts").update(row).eq("id", p.id).select("id").single()
    : supabase.from("posts").insert({ ...row, created_by: user.id }).select("id").single();
  const { data: saved, error } = await write;
  if (error || !saved) {
    if (error?.code === "23505") return { ok: false, error: "Another devotional already uses this URL. Change the slug.", field: "slug" };
    console.error("[savePost] failed", error?.message);
    return { ok: false, error: "Couldn't save. Please try again." };
  }

  // Categories (many per post). post_categories has no audit trigger, so log the change.
  const { data: current } = await supabase.from("post_categories").select("category_id").eq("post_id", saved.id);
  const currentIds = new Set((current ?? []).map((c) => c.category_id));
  const wanted = new Set(p.categoryIds);
  const toRemove = [...currentIds].filter((id) => !wanted.has(id));
  const toAdd = [...wanted].filter((id) => !currentIds.has(id));
  if (toRemove.length || toAdd.length) {
    if (toRemove.length) {
      const { error: delError } = await supabase.from("post_categories").delete().eq("post_id", saved.id).in("category_id", toRemove);
      if (delError) return { ok: false, error: "Saved, but the categories couldn't be updated. Try again." };
    }
    if (toAdd.length) {
      const { error: catError } = await supabase.from("post_categories").insert(toAdd.map((category_id) => ({ post_id: saved.id, category_id })));
      if (catError) return { ok: false, error: "Saved, but the categories couldn't be updated. Try again." };
    }
    await logActivity({
      actorId: user.id,
      action: "update",
      module: "posts",
      entityType: "post_categories",
      entityId: saved.id,
      summary: `Changed categories of "${p.title}" (+${toAdd.length} / -${toRemove.length})`,
    });
  }

  refreshPublic(p.slug, previous?.slug);
  return { ok: true, id: saved.id, message: p.status === "published" ? "Saved and published" : "Draft saved" };
}

export async function deletePost(input: { id: string }): Promise<PostResult> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const user = await requireStaff();
  if (!can(user, "posts", "delete")) return { ok: false, error: "You don't have permission to delete devotionals." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("posts").delete().eq("id", parsed.data.id).select("id, slug");
  if (error || !data?.length) return { ok: false, error: "Couldn't delete it. Please try again." };
  refreshPublic(String(data[0].slug)); // audited by the posts trigger
  return { ok: true, id: data[0].id, message: "Devotional deleted" };
}
