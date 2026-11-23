// URL slugs for devotionals (and later pages). Pure; unit-tested in tests/slug.test.ts.

export const SLUG_MAX = 120;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Known as Father: A 7-Day Devotional!" → "known-as-father-a-7-day-devotional" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents (é → e)
    .replace(/['’`]/g, "") // don't split on apostrophes: "God's" → "gods"
    .replace(/&/g, " and ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= SLUG_MAX && SLUG_PATTERN.test(slug);
}
