// Replaces `{ mediaId: "seed:<file>" }` placeholders with real media ids. Pure; unit-tested.
import type { SeedImageFile } from "./helpers";

export function resolveSeedImages(value: unknown, ids: Partial<Record<SeedImageFile, string>>): unknown {
  if (Array.isArray(value)) return value.map((v) => resolveSeedImages(v, ids));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "mediaId" && typeof v === "string" && v.startsWith("seed:")) {
        const id = ids[v.slice(5) as SeedImageFile];
        if (!id) throw new Error(`Unknown seed image "${v.slice(5)}"`);
        out[k] = id;
      } else out[k] = resolveSeedImages(v, ids);
    }
    return out;
  }
  return value;
}
