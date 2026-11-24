// Pure seed logic: turns supabase/seed/posts.json into rows for posts, categories and
// post_categories. No I/O, so it's unit-tested (tests/seed.test.ts); supabase/seed.ts writes it.
import { z } from "zod";
import { isValidSlug, slugify } from "../../src/lib/slug";
import type { Json } from "../../src/lib/supabase/database.types";

const tiptapDoc = z.looseObject({ type: z.literal("doc"), content: z.array(z.unknown()) });

export const seedPostSchema = z.object({
  slug: z.string().refine(isValidSlug, "invalid slug"),
  title: z.string().trim().min(1).max(300),
  published_at: z.iso.datetime({ offset: true }),
  author_name: z.string().trim().min(1).max(120).optional(),
  excerpt: z.string().max(2000).nullish(),
  categories: z.array(z.string().trim().min(1).max(80)).default([]),
  content: tiptapDoc,
  legacy_url: z.string().max(500).nullish(),
});
export type SeedPost = z.infer<typeof seedPostSchema>;

export type SeedPlan = {
  categories: { name: string; slug: string }[];
  posts: {
    slug: string;
    title: string;
    excerpt: string | null;
    content: NonNullable<Json>;
    author_name: string;
    published_at: string;
    legacy_url: string | null;
    status: "published";
  }[];
  links: { post_slug: string; category_slug: string }[];
};

export function buildSeed(input: unknown): SeedPlan {
  const parsed = z.array(seedPostSchema).safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`posts.json is invalid at [${issue.path.join(".")}]: ${issue.message}`);
  }

  const seen = new Set<string>();
  const categories = new Map<string, string>(); // slug → name (first spelling wins)
  const plan: SeedPlan = { categories: [], posts: [], links: [] };

  for (const p of parsed.data) {
    if (seen.has(p.slug)) throw new Error(`Duplicate slug in posts.json: ${p.slug}`);
    seen.add(p.slug);

    plan.posts.push({
      slug: p.slug,
      title: p.title.trim(),
      excerpt: p.excerpt?.trim() || null,
      content: p.content as NonNullable<Json>,
      author_name: p.author_name ?? "Pastor Ronnie Dube",
      published_at: new Date(p.published_at).toISOString(),
      legacy_url: p.legacy_url ?? null,
      status: "published",
    });

    for (const name of new Set(p.categories)) {
      const slug = slugify(name);
      if (!slug) continue;
      if (!categories.has(slug)) categories.set(slug, name);
      if (!plan.links.some((l) => l.post_slug === p.slug && l.category_slug === slug)) {
        plan.links.push({ post_slug: p.slug, category_slug: slug });
      }
    }
  }

  plan.categories = [...categories].map(([slug, name]) => ({ slug, name }));
  return plan;
}

/**
 * seed.ts is a first-load tool: on a database that already has devotionals it stops, because
 * the live posts are now edited in the admin. --force runs anyway and overwrites matching posts.
 * Returns the reason to refuse, or null to go ahead.
 */
export function seedRefusal(existingPosts: number, force: boolean): string | null {
  if (force || existingPosts === 0) return null;
  return (
    `This database already has ${existingPosts} devotional${existingPosts === 1 ? "" : "s"}, so the posts seed won't run.\n` +
    "posts.json is a legacy one-time import that has already been applied; edit devotionals in the admin.\n" +
    "Only if you really mean to reload it, rerun with --force: posts with the same slug are OVERWRITTEN\n" +
    "with posts.json (staff edits to them are lost) and missing ones are added."
  );
}

/** Split into batches (PostgREST request size). */
export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
