// Public CMS reads: cookie-less anon client (RLS: published only) inside "use cache", tagged
// so admin saves refresh them with updateTag (docs/ARCHITECTURE.md §9):
//   "page:<slug>", "pages", "global:<key>", "media", "forms"
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createSupabasePublicClient } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media/url";
import { GLOBALS, type GlobalKey } from "./globals";
import type { MediaInfo } from "./define";

export type PublishedSection = { id: string; type: string; schema_version: number; visible: boolean; data: unknown };
export type PublishedPage = { slug: string; title: string; seo: { title?: string; description?: string; keywords?: string; image?: string }; sections: PublishedSection[] };

export async function getPublishedPage(slug: string): Promise<PublishedPage | null> {
  "use cache";
  cacheTag(`page:${slug}`, "pages");
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient()
    .from("pages")
    .select("slug, title, page_versions!inner(snapshot)")
    .eq("slug", slug)
    .eq("page_versions.is_published", true)
    .maybeSingle();
  if (error) console.error("[cms] page read failed", slug, error.message);
  const snapshot = (data?.page_versions as unknown as { snapshot: Record<string, unknown> }[] | undefined)?.[0]?.snapshot;
  if (!data || !snapshot) return null;
  return {
    slug: String(data.slug),
    title: String(snapshot.title ?? data.title),
    seo: (snapshot.seo as PublishedPage["seo"]) ?? {},
    sections: Array.isArray(snapshot.sections) ? (snapshot.sections as PublishedSection[]) : [],
  };
}

export async function getPublishedPageSlugs(): Promise<string[]> {
  "use cache";
  cacheTag("pages");
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient().from("pages").select("slug");
  if (error) console.error("[cms] slugs read failed", error.message);
  return (data ?? []).map((p) => String(p.slug));
}

export async function getGlobal<K extends GlobalKey>(key: K): Promise<ReturnType<(typeof GLOBALS)[K]["parse"]>> {
  "use cache";
  cacheTag(`global:${key}`);
  cacheLife("hours");
  const { data, error } = await createSupabasePublicClient().from("globals").select("published").eq("key", key).maybeSingle();
  if (error) console.error("[cms] global read failed", key, error.message);
  return GLOBALS[key].parse(data?.published) as ReturnType<(typeof GLOBALS)[K]["parse"]>;
}

/** Media for a set of ids (pass them sorted so equal sets share a cache entry). */
export async function getMediaByIds(ids: string[]): Promise<Record<string, MediaInfo>> {
  "use cache";
  cacheTag("media");
  cacheLife("hours");
  if (ids.length === 0) return {};
  const { data, error } = await createSupabasePublicClient()
    .from("media")
    .select("id, storage_path, alt, width, height")
    .in("id", ids.slice(0, 500));
  if (error) console.error("[cms] media read failed", error.message);
  return Object.fromEntries(
    (data ?? []).map((m) => [m.id, { id: m.id, url: publicMediaUrl(m.storage_path), alt: m.alt, width: m.width, height: m.height }]),
  );
}

export type PublicFormField = { key: string; type: string; label: string; required: boolean; placeholder?: string; options?: { value: string; label: string }[] };

/** Public half of a form (anon can read id/slug/name/fields of active forms). */
export async function getPublicForm(slug: string): Promise<{ slug: string; name: string; fields: PublicFormField[] } | null> {
  "use cache";
  cacheTag("forms");
  cacheLife("hours");
  const { data } = await createSupabasePublicClient().from("forms").select("slug, name, fields").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (!data) return null;
  return { slug: String(data.slug), name: data.name, fields: (Array.isArray(data.fields) ? data.fields : []) as PublicFormField[] };
}
