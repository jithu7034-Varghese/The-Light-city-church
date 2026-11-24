// 301s from the old GoDaddy site. Pure (used by next.config.ts and unit-tested).
//
// Old devotional URLs were /dailylightdevotional/f/<old-slug>. 231 of the 239 old slugs equal
// the new slug, so a generic rule covers them. The other 8 (curly apostrophes, "--", and one
// reused title) get exact redirects that MUST come first: e.g. the old /f/gods-mirror is now
// /devotionals/gods-mirror-2, while the new /devotionals/gods-mirror was the old /f/god’s-mirror.

export type LegacyRedirect = { source: string; destination: string; permanent: true };

const PREFIX = "/dailylightdevotional/f/";

export function oldDevotionalSlug(legacyUrl: string | null | undefined): string | null {
  if (!legacyUrl) return null;
  const i = legacyUrl.indexOf(PREFIX);
  if (i === -1) return null;
  const raw = legacyUrl.slice(i + PREFIX.length).split(/[?#/]/)[0];
  try {
    return decodeURIComponent(raw) || null;
  } catch {
    return raw || null;
  }
}

/** Characters path-to-regexp would treat as syntax in a redirect `source`. */
const escapeSource = (s: string) => s.replace(/[()[\]{}?*+:\\]/g, (c) => `\\${c}`);

export function legacyRedirects(
  posts: { slug: string; legacy_url?: string | null }[],
  pageRedirects: { from: string; to: string }[] = [],
): LegacyRedirect[] {
  const exact: LegacyRedirect[] = [];
  const seen = new Set<string>();
  for (const p of posts) {
    const old = oldDevotionalSlug(p.legacy_url);
    if (!old || old === p.slug) continue;
    // Match the path whether the browser sends it percent-encoded or not.
    for (const variant of new Set([old, encodeURIComponent(old)])) {
      const source = `${PREFIX}${escapeSource(variant)}`;
      if (seen.has(source)) continue;
      seen.add(source);
      exact.push({ source, destination: `/devotionals/${p.slug}`, permanent: true });
    }
  }
  const pages = pageRedirects
    .filter((r) => r.from !== `${PREFIX}:slug`)
    .map((r) => ({ source: r.from, destination: r.to, permanent: true as const }));
  return [...exact, { source: `${PREFIX}:slug`, destination: "/devotionals/:slug", permanent: true }, ...pages];
}
