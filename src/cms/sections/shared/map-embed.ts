// Google Maps embed link field, shared by the Contact hero and the Directions section.
import { f } from "@/cms/fields";

/** Only Google's own embed pages may be framed. */
export const MAP_EMBED = /^https:\/\/www\.google\.com\/maps\/embed\?[^\s"'<>]*$/;

export const mapEmbedField = (() => {
  const base = f.text("Google Maps embed link (optional)", {
    max: 2000,
    help: "In Google Maps: Share → Embed a map → copy only the https://www.google.com/maps/embed?… address from the code.",
  });
  return { ...base, zod: base.zod.refine((v) => v === "" || MAP_EMBED.test(v), "Paste a https://www.google.com/maps/embed?… link") };
})();

/** The embed URL if it is a valid Google Maps embed link, else "". */
export const safeMapEmbed = (url: string) => (MAP_EMBED.test(url) ? url : "");
