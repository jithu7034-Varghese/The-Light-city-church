// Public URLs for files in the Storage "media" bucket (public read).
export const MEDIA_BUCKET = "media";

/**
 * A CSS `url("…")` value for an image, or null if the URL isn't a plain http(s) or site path.
 * Quotes, backslashes and line breaks are percent-encoded so the value can't break out of the
 * declaration it's placed in.
 */
export function cssImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!/^(https?:\/\/|\/(?!\/))/.test(url)) return null;
  const safe = url.replace(/["'\\()\s<>]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
  return `url("${safe}")`;
}

export function publicMediaUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const clean = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${clean}`;
}
