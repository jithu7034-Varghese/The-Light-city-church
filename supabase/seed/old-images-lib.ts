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

type OldImageEntry = { url: string; page: string };
export type OldImageSource = {
  posts: Record<string, { featured?: string | null; og?: string | null }>;
  gallery: OldImageEntry[];
  page_images: OldImageEntry[];
};

/**
 * One storage path per source image, decided in a fixed order (devotionals in file order, then the
 * gallery, then page images) so it never depends on which steps a run skips. `candidates` lists every
 * path the import may ever have written for a source; any that isn't the canonical path is a duplicate.
 */
export function planImagePaths(src: OldImageSource, slugForLegacy: (legacy: string) => string | undefined, opts: { includeStock?: boolean } = {}) {
  const canonical = new Map<string, string>();
  const candidates: { path: string; source: string }[] = [];
  const claim = (source: string, path: string) => {
    candidates.push({ path, source });
    if (!canonical.has(source)) canonical.set(source, path);
  };
  for (const [legacy, entry] of Object.entries(src.posts)) {
    const slug = slugForLegacy(legacy);
    const source = pickPostImage(entry);
    if (slug && source) claim(source, `devotionals/${slug}.webp`);
  }
  src.gallery.forEach((g, i) => {
    if (opts.includeStock || !isStockImage(g.url)) claim(fullImageUrl(g.url), `gallery/old-site-${i + 1}.webp`);
  });
  src.page_images.forEach((p, i) => {
    if (opts.includeStock || !isStockImage(p.url)) claim(fullImageUrl(p.url), `pages/${p.page}-${i + 1}.webp`);
  });
  return { canonical, candidates };
}

/** Title marking stock-library media rows in the admin, so staff don't reuse them by accident. */
export const STOCK_MEDIA_TITLE = "GoDaddy stock image: licence not confirmed (see docs/stock-images-to-review.md)";

/** Devotionals whose old-site image came from GoDaddy's stock library, in file order. */
export function stockDevotionals(src: OldImageSource, slugForLegacy: (legacy: string) => string | undefined) {
  const out: { legacy: string; slug: string; source: string }[] = [];
  for (const [legacy, entry] of Object.entries(src.posts)) {
    const source = pickPostImage(entry);
    const slug = slugForLegacy(legacy);
    if (source && slug && isStockImage(source)) out.push({ legacy, slug, source });
  }
  return out;
}

/** Gallery entries with repeated photos removed (the old site listed some twice). */
export function uniqueGallery<T extends { url: string }>(entries: T[]): T[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = fullImageUrl(e.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Replace every `{ mediaId: from }` inside a JSON value. Returns the new value and whether anything changed. */
export function replaceMediaIds(value: unknown, map: Map<string, string>): { value: unknown; changed: boolean } {
  let changed = false;
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) {
        if (k === "mediaId" && typeof x === "string" && map.has(x)) {
          out[k] = map.get(x);
          changed = true;
        } else out[k] = walk(x);
      }
      return out;
    }
    return v;
  };
  return { value: walk(value), changed };
}

/** Drop later list items that show the same image as an earlier one. */
export function dedupeByImage<T extends { image?: { mediaId?: string } | null }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    const id = it.image?.mediaId;
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
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
