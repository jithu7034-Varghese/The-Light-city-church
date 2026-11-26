"use server";
// Page CMS lite: Save = publish. Zod (each section validated by its registry schema) →
// can(pages, edit + publish) → update draft sections as the user (RLS) → publish_page()
// (snapshot) → updateTag("page:<slug>"). Rejects stale saves (someone else saved meanwhile).
// page_sections has no audit trigger, so this calls logActivity(); publish_page also updates
// `pages`, which the audit trigger records.
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSectionDef } from "@/cms/registry";
import { seoSchema } from "@/cms/seo";
import type { Json } from "@/lib/supabase/database.types";

export type SavePageResult = { ok: true; message: string; updatedAt: string } | { ok: false; error: string; sectionId?: string };

const inputSchema = z.object({
  pageId: z.uuid(),
  expectedUpdatedAt: z.string().max(64),
  seo: seoSchema,
  sections: z.array(z.object({ id: z.uuid(), visible: z.boolean(), data: z.unknown() })).max(60),
});

export async function savePage(input: z.input<typeof inputSchema>): Promise<SavePageResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid page" };
  const user = await requireStaff();
  if (!can(user, "pages", "edit") || !can(user, "pages", "publish")) {
    return { ok: false, error: "You don't have permission to publish pages." };
  }
  const { pageId, expectedUpdatedAt, seo, sections } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const [{ data: page }, { data: existing }] = await Promise.all([
    supabase.from("pages").select("id, slug, title, updated_at").eq("id", pageId).maybeSingle(),
    supabase.from("page_sections").select("id, type, schema_version").eq("page_id", pageId),
  ]);
  if (!page) return { ok: false, error: "That page no longer exists." };
  if (new Date(page.updated_at).getTime() !== new Date(expectedUpdatedAt).getTime()) {
    return { ok: false, error: "Someone else saved this page while you were editing. Reload to see the latest changes, then make your edits again." };
  }

  const byId = new Map((existing ?? []).map((s) => [s.id, s]));
  const updates: { id: string; visible: boolean; data: NonNullable<Json>; schema_version: number }[] = [];
  for (const s of sections) {
    const current = byId.get(s.id);
    if (!current) return { ok: false, error: "This page's sections changed. Reload and try again." };
    const def = getSectionDef(current.type);
    if (!def) return { ok: false, error: `Unknown section type "${current.type}".`, sectionId: s.id };
    const v = def.validate(s.data);
    if (!v.ok) return { ok: false, error: `${def.label}: ${v.error}`, sectionId: s.id };
    updates.push({ id: s.id, visible: s.visible, data: v.data as NonNullable<Json>, schema_version: def.schemaVersion });
  }

  // Draft first (as the user, so RLS applies), then snapshot it.
  for (const u of updates) {
    const { error } = await supabase.from("page_sections").update({ visible: u.visible, data: u.data, schema_version: u.schema_version }).eq("id", u.id).eq("page_id", pageId);
    if (error) return { ok: false, error: "Couldn't save a section. Please try again.", sectionId: u.id };
  }
  // SEO columns go live with the snapshot publish_page() builds from them.
  const { error: seoError } = await supabase
    .from("pages")
    .update({ seo_title: seo.title, seo_description: seo.description, seo_keywords: seo.keywords, seo_image_url: seo.imageUrl, updated_by: user.id })
    .eq("id", pageId);
  if (seoError) return { ok: false, error: "Couldn't save the page settings." };

  const { error: publishError } = await supabase.rpc("publish_page", { p_page_id: pageId, p_note: `Published by ${user.fullName || user.email}` });
  if (publishError) {
    console.error("[savePage] publish failed", publishError.message);
    return { ok: false, error: "Saved, but publishing failed. Please try again." };
  }

  const { data: after } = await supabase.from("pages").select("updated_at").eq("id", pageId).single();
  await logActivity({ actorId: user.id, action: "publish", module: "pages", entityType: "pages", entityId: pageId, summary: `Published page "${page.title}"` });
  updateTag(`page:${page.slug}`);
  updateTag("pages");
  return { ok: true, message: "Published", updatedAt: after?.updated_at ?? new Date().toISOString() };
}
