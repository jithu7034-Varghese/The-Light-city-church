import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSeed, chunk, seedRefusal } from "../supabase/seed/build-seed";
import { isValidSlug } from "@/lib/slug";

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hi" }] }] };
const post = (over: Record<string, unknown> = {}) => ({
  slug: "stay-connected",
  title: " Stay connected! ",
  published_at: "2025-02-05T10:00:00Z",
  excerpt: "  Short. ",
  categories: ["Daily Light"],
  content: doc,
  ...over,
});

describe("buildSeed", () => {
  it("maps posts to published rows with defaults", () => {
    const plan = buildSeed([post()]);
    expect(plan.posts).toEqual([
      {
        slug: "stay-connected",
        title: "Stay connected!",
        excerpt: "Short.",
        content: doc,
        author_name: "Pastor Ronnie Dube",
        published_at: "2025-02-05T10:00:00.000Z",
        legacy_url: null,
        status: "published",
      },
    ]);
  });

  it("collects unique categories by slug and links each post once", () => {
    const plan = buildSeed([
      post({ slug: "a", categories: ["Daily Light", "Daily Light", "My Daily Light"] }),
      post({ slug: "b", categories: ["daily light"] }),
      post({ slug: "c", categories: [] }),
    ]);
    expect(plan.categories).toEqual([
      { slug: "daily-light", name: "Daily Light" },
      { slug: "my-daily-light", name: "My Daily Light" },
    ]);
    expect(plan.links).toEqual([
      { post_slug: "a", category_slug: "daily-light" },
      { post_slug: "a", category_slug: "my-daily-light" },
      { post_slug: "b", category_slug: "daily-light" },
    ]);
  });

  it("treats a blank excerpt as null", () => {
    expect(buildSeed([post({ excerpt: "   " })]).posts[0].excerpt).toBeNull();
  });

  it.each([
    ["duplicate slugs", [post(), post()], /Duplicate slug/],
    ["an invalid slug", [post({ slug: "Bad Slug" })], /invalid slug/],
    ["a missing title", [post({ title: "" })], /title/],
    ["a bad date", [post({ published_at: "yesterday" })], /published_at/],
    ["non-Tiptap content", [post({ content: [{ tag: "p", text: "old format" }] })], /content/],
  ])("rejects %s", (_name, input, message) => {
    expect(() => buildSeed(input)).toThrow(message);
  });

  it("accepts the real supabase/seed/posts.json (239 posts)", () => {
    const raw = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../supabase/seed/posts.json"), "utf8"));
    const plan = buildSeed(raw);
    expect(plan.posts).toHaveLength(239);
    expect(plan.posts.every((p) => p.status === "published" && isValidSlug(p.slug))).toBe(true);
    expect(plan.categories.map((c) => c.name).sort()).toEqual(["Daily Light", "My Daily Light"]);
    expect(plan.links).toHaveLength(239);
  });
});

describe("seedRefusal", () => {
  it("runs on an empty database", () => {
    expect(seedRefusal(0, false)).toBeNull();
  });

  it("refuses when posts already exist, unless --force", () => {
    expect(seedRefusal(239, false)).toMatch(/already has 239 devotionals/);
    expect(seedRefusal(1, false)).toMatch(/already has 1 devotional,/);
    expect(seedRefusal(239, false)).toMatch(/--force/);
    expect(seedRefusal(239, true)).toBeNull();
  });
});

describe("chunk", () => {
  it("splits into batches", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 50)).toEqual([]);
  });
});
