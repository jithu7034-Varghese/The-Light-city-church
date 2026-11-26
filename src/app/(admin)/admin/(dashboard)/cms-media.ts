import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicMediaUrl } from "@/lib/media/url";
import { collectMediaIds } from "@/cms/fields";
import type { MediaMap } from "@/components/admin/cms/fields-editor";

/** Thumbnails for every image referenced in some CMS data (read as the user). */
export async function loadMediaMap(value: unknown): Promise<MediaMap> {
  const ids = [...collectMediaIds(value)];
  if (!ids.length) return {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("media").select("id, storage_path, alt").in("id", ids);
  return Object.fromEntries((data ?? []).map((m) => [m.id, { url: publicMediaUrl(m.storage_path), alt: m.alt }]));
}
