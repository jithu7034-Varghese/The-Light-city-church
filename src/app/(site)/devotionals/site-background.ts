import "server-only";
import { getGlobal, getMediaByIds } from "@/cms/queries";
import type { MediaInfo } from "@/cms/define";

/** Site settings "Section background image" (the nature photo behind photo heroes), or null. */
export async function getSiteBackground(): Promise<MediaInfo | null> {
  const site = await getGlobal("site");
  const id = site.sectionBackground?.mediaId;
  if (!id) return null;
  return (await getMediaByIds([id]))[id] ?? null;
}
