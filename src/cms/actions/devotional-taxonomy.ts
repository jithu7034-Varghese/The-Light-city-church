"use server";
// Devotional categories and authors. Zod → requireStaff → can(posts, edit|delete) → DB as the
// user (RLS) → updateTag("posts") (every devotional page shows its categories and author).
// categories and authors have DB audit triggers (migration 10), so no logActivity() here.
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify, SLUG_MAX } from "@/lib/slug";

export type TaxonomyResult = { ok: true; id: string; message: string } | { ok: false; error: string };

const fail = (error: string): TaxonomyResult => ({ ok: false, error });

const categorySchema = z.object({ id: z.uuid().optional(), name: z.string().trim().min(1, "Add a name").max(80, "Keep it under 80 characters") });

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<TaxonomyResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid category");
  const user = await requireStaff();
  if (!can(user, "posts", "edit")) return fail("You don't have permission to manage categories.");

  const { id, name } = parsed.data;
  const slug = slugify(name).slice(0, SLUG_MAX);
  if (!slug) return fail("Use some letters or numbers in the name.");
  const supabase = await createSupabaseServerClient();
  // Renaming keeps the slug (so /devotionals?category=… links keep working).
  const { data, error } = id
    ? await supabase.from("categories").update({ name }).eq("id", id).select("id").single()
    : await supabase.from("categories").insert({ name, slug }).select("id").single();
  if (error || !data) {
    if (error?.code === "23505") return fail("A category with that name already exists.");
    console.error("[saveCategory] failed", error?.message);
    return fail("Couldn't save the category. Please try again.");
  }
  updateTag("posts");
  return { ok: true, id: data.id, message: id ? "Category renamed" : "Category added" };
}

export async function deleteCategory(input: { id: string }): Promise<TaxonomyResult> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return fail("Invalid request");
  const user = await requireStaff();
  if (!can(user, "posts", "delete")) return fail("You don't have permission to delete categories.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("categories").delete().eq("id", parsed.data.id).select("id");
  if (error || !data?.length) return fail("Couldn't delete the category. Please try again.");
  updateTag("posts");
  return { ok: true, id: parsed.data.id, message: "Category deleted (devotionals keep their other categories)" };
}

const authorSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Add a name").max(120),
  position: z
    .string()
    .trim()
    .max(120)
    .transform((s) => s || null),
  photoMediaId: z.uuid().nullable(),
});

export async function saveAuthor(input: z.input<typeof authorSchema>): Promise<TaxonomyResult> {
  const parsed = authorSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid author");
  const user = await requireStaff();
  if (!can(user, "posts", "edit")) return fail("You don't have permission to manage authors.");

  const { id, name, position, photoMediaId } = parsed.data;
  const row = { name, position, photo_media_id: photoMediaId };
  const supabase = await createSupabaseServerClient();
  const { data, error } = id
    ? await supabase.from("authors").update(row).eq("id", id).select("id").single()
    : await supabase.from("authors").insert(row).select("id").single();
  if (error || !data) {
    console.error("[saveAuthor] failed", error?.message);
    return fail("Couldn't save the author. Please try again.");
  }
  // Keep the byline text on this author's devotionals in step with a rename.
  if (id) await supabase.from("posts").update({ author_name: name }).eq("author_id", id).neq("author_name", name);
  updateTag("posts");
  return { ok: true, id: data.id, message: id ? "Author updated" : "Author added" };
}

export async function deleteAuthor(input: { id: string }): Promise<TaxonomyResult> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return fail("Invalid request");
  const user = await requireStaff();
  if (!can(user, "posts", "delete")) return fail("You don't have permission to delete authors.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("authors").delete().eq("id", parsed.data.id).select("id");
  if (error || !data?.length) return fail("Couldn't delete the author. Please try again.");
  updateTag("posts");
  return { ok: true, id: parsed.data.id, message: "Author deleted (their devotionals keep the byline name)" };
}
