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

/** Site settings → "Devotionals pages": wording plus the list's heading photo (its own photo, else
 *  the Section background image). */
export async function getDevotionalsSettings() {
  const site = await getGlobal("site");
  const cfg = site.devotionals;
  const ids = [cfg.heroImage?.mediaId, site.sectionBackground?.mediaId].filter((id): id is string => Boolean(id)).sort();
  const media = ids.length ? await getMediaByIds(ids) : {};
  const heroImage =
    (cfg.heroImage ? media[cfg.heroImage.mediaId] : undefined) ??
    (site.sectionBackground ? media[site.sectionBackground.mediaId] : undefined) ??
    null;
  const background = (site.sectionBackground ? media[site.sectionBackground.mediaId] : undefined) ?? null;
  return { site, cfg, heroImage, background };
}
