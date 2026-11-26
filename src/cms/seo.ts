// Per-item SEO fields (posts.seo_* and pages.seo_*), shared by the admin forms and actions.
import { z } from "zod";

const optional = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((s) => s || null);

export const seoSchema = z.object({
  title: optional(70, "Keep the search title under 70 characters"),
  description: optional(170, "Keep the search description under 170 characters"),
  keywords: optional(300, "Keep the keywords under 300 characters").transform((s) =>
    s ? s.split(",").map((k) => k.trim()).filter(Boolean).join(", ") || null : null,
  ),
  imageUrl: z
    .string()
    .trim()
    .max(1000)
    .refine((u) => u === "" || /^https?:\/\//.test(u) || (u.startsWith("/") && !u.startsWith("//")), "Use an image from the media library")
    .transform((s) => s || null),
});

export type SeoValue = { title: string; description: string; keywords: string; imageUrl: string };
export const emptySeo: SeoValue = { title: "", description: "", keywords: "", imageUrl: "" };

/** Row columns → editor value. */
export function seoFromRow(r: { seo_title?: string | null; seo_description?: string | null; seo_keywords?: string | null; seo_image_url?: string | null }): SeoValue {
  return { title: r.seo_title ?? "", description: r.seo_description ?? "", keywords: r.seo_keywords ?? "", imageUrl: r.seo_image_url ?? "" };
}

/** "a, b, c" → ["a","b","c"] for Metadata.keywords. */
export function splitKeywords(s: string | null | undefined): string[] | undefined {
  const list = (s ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  return list.length ? list : undefined;
}
