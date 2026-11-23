// Public URLs for files in the Storage "media" bucket (public read).
export const MEDIA_BUCKET = "media";

export function publicMediaUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const clean = storagePath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${clean}`;
}
