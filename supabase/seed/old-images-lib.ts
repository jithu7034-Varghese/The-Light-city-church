// Pure helpers for import-old-images.ts (unit-tested in tests/old-images.test.ts).

/** GoDaddy image URLs can end in "/:/rs=w:1280,…" (resize instructions). Drop it for the full image. */
export function fullImageUrl(url: string): string {
  const u = url.trim().startsWith("//") ? `https:${url.trim()}` : url.trim();
  const i = u.indexOf("/:/");
  return i === -1 ? u : u.slice(0, i);
}

/** GoDaddy stock library photos (not the church's own pictures). */
export function isStockImage(url: string): boolean {
  return /\/isteam\/stock\//.test(url);
}

/** Old-site devotional slug from a post's legacy_url, decoded (e.g. "god’s-mirror"). */
export function legacySlugOf(legacyUrl: string | null | undefined): string | null {
  const m = legacyUrl ? /\/dailylightdevotional\/f\/([^/?#]+)/.exec(legacyUrl) : null;
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export function normalizeSlug(s: string): string {
  try {
    return decodeURIComponent(s).normalize("NFC");
  } catch {
    return s.normalize("NFC");
  }
}

/** The image to use for a devotional: featured, else the og image. */
export function pickPostImage(entry: { featured?: string | null; og?: string | null } | undefined): string | null {
  const raw = entry?.featured || entry?.og;
  return raw ? fullImageUrl(raw) : null;
}

/** Original file name from a URL, for the media library ("RONNIE (21).JPG"). */
export function fileNameOf(url: string): string {
  const last = fullImageUrl(url).split("?")[0].split("/").pop() ?? "image";
  try {
    return decodeURIComponent(last).slice(0, 200) || "image";
  } catch {
    return last.slice(0, 200) || "image";
  }
}

/**
 * Placeholder images the seed put in while real photos were missing: these may be replaced.
 * Real church photos (the pastors) and anything staff uploaded are never replaced.
 */
export const PLACEHOLDER_PATHS = new Set(["seed/citylights.jpeg", "seed/thecitylight.webp", "seed/logo1.png"]);

export function isReplaceable(ref: { mediaId?: string } | null | undefined, storagePathOf: (id: string) => string | undefined): boolean {
  if (!ref?.mediaId) return true; // empty field
  const path = storagePathOf(ref.mediaId);
  return path === undefined || PLACEHOLDER_PATHS.has(path); // deleted media, or a placeholder
}

/** Alt text for an image shared by several devotionals (one post's title would mislabel the others). */
export const SHARED_DEVOTIONAL_ALT = "Daily Light devotional illustration";

/**
 * Alt text per devotional image: a single post's title when one post uses it, the neutral
 * description when several do. Images no post uses are left out.
 */
export function devotionalAltPlan(posts: { title: string; featured_media_id: string | null }[]): Map<string, string> {
  const users = new Map<string, string[]>();
  for (const p of posts) {
    if (!p.featured_media_id) continue;
    users.set(p.featured_media_id, [...(users.get(p.featured_media_id) ?? []), p.title]);
  }
  return new Map([...users].map(([id, titles]) => [id, titles.length > 1 ? SHARED_DEVOTIONAL_ALT : titles[0].trim()]));
}

/** Run tasks with limited concurrency; each task is retried once on failure. */
export async function runPool<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<({ ok: true; item: T; value: R } | { ok: false; item: T; error: string })[]> {
  const results: ({ ok: true; item: T; value: R } | { ok: false; item: T; error: string })[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const item = items[i];
      try {
        results[i] = { ok: true, item, value: await task(item) };
      } catch {
        try {
          results[i] = { ok: true, item, value: await task(item) }; // one retry
        } catch (e) {
          results[i] = { ok: false, item, error: e instanceof Error ? e.message : String(e) };
        }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
