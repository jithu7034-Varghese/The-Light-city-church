import { describe, expect, it } from "vitest";
import posts from "../supabase/seed/posts.json";
import images from "../supabase/seed/raw/old-site-images.json";
import {
  dedupeByImage, devotionalAltPlan, fileNameOf, fullImageUrl, isReplaceable, isStockImage, legacySlugOf, normalizeSlug, pickPostImage,
  planImagePaths, replaceMediaIds, runPool, SHARED_DEVOTIONAL_ALT, stockDevotionals, uniqueGallery,
} from "../supabase/seed/old-images-lib";

describe("fullImageUrl", () => {
  it("strips GoDaddy resize suffixes", () => {
    expect(fullImageUrl("https://img1.wsimg.com/isteam/ip/x/a.jpg/:/cr=t:0%25,l:0%25/rs=w:1280")).toBe("https://img1.wsimg.com/isteam/ip/x/a.jpg");
    expect(fullImageUrl("https://img1.wsimg.com/isteam/ip/x/a.jpg")).toBe("https://img1.wsimg.com/isteam/ip/x/a.jpg");
    expect(fullImageUrl("//img1.wsimg.com/a.png/:/rs=w:600")).toBe("https://img1.wsimg.com/a.png");
  });
});

describe("pickPostImage", () => {
  it("prefers featured, falls back to og", () => {
    expect(pickPostImage({ featured: "https://x/f.jpg", og: "https://x/o.jpg" })).toBe("https://x/f.jpg");
    expect(pickPostImage({ featured: "", og: "https://x/o.jpg/:/rs=w:1200" })).toBe("https://x/o.jpg");
    expect(pickPostImage({})).toBeNull();
    expect(pickPostImage(undefined)).toBeNull();
  });
});

describe("matching old images to posts", () => {
  it("matches every legacy slug in the image file to a post by its legacy_url", () => {
    const byLegacy = new Map(posts.map((p) => [normalizeSlug(legacySlugOf(p.legacy_url) ?? ""), p.slug]));
    const keys = Object.keys(images.posts);
    const unmatched = keys.filter((k) => !byLegacy.has(normalizeSlug(k)));
    expect(unmatched).toEqual([]);
    expect(keys.length).toBe(239);
  });
});

describe("planImagePaths (stable across runs)", () => {
  const byLegacy = new Map(posts.map((p) => [normalizeSlug(legacySlugOf(p.legacy_url) ?? ""), p.slug]));
  const plan = planImagePaths(images, (l) => byLegacy.get(normalizeSlug(l)));

  it("gives a gallery photo that is also a devotional image the devotional's path", () => {
    const g1 = fullImageUrl(images.gallery[0].url);
    expect(plan.canonical.get(g1)).toMatch(/^devotionals\//);
    expect(plan.candidates.some((c) => c.path === "gallery/old-site-1.webp" && c.source === g1)).toBe(true);
  });

  it("is the same whatever a run skips (it depends only on the file)", () => {
    const again = planImagePaths(images, (l) => byLegacy.get(normalizeSlug(l)));
    expect([...again.canonical]).toEqual([...plan.canonical]);
  });

  it("skips the stock photo on the Home page unless asked (devotional illustrations are kept)", () => {
    const pageStock = images.page_images.find((p) => p.url.includes("/isteam/stock/"))!;
    expect(plan.candidates.some((c) => c.source === fullImageUrl(pageStock.url))).toBe(false);
    const withStock = planImagePaths(images, (l) => byLegacy.get(normalizeSlug(l)), { includeStock: true });
    expect(withStock.candidates.some((c) => c.source === fullImageUrl(pageStock.url))).toBe(true);
  });

  it("finds the duplicated photos in the old gallery list", () => {
    expect(images.gallery.length).toBe(9);
    expect(uniqueGallery(images.gallery).length).toBe(7);
  });
});

describe("stockDevotionals", () => {
  it("finds the 57 devotionals whose old image is from GoDaddy's stock library", () => {
    const byLegacy = new Map(posts.map((p) => [normalizeSlug(legacySlugOf(p.legacy_url) ?? ""), p.slug]));
    const list = stockDevotionals(images, (l) => byLegacy.get(normalizeSlug(l)));
    expect(list).toHaveLength(57);
    expect(new Set(list.map((s) => s.source)).size).toBe(49);
    expect(list.every((s) => isStockImage(s.source))).toBe(true);
    expect(list.map((s) => s.slug)).toContain("divine-strength");
  });
});

describe("replaceMediaIds / dedupeByImage", () => {
  it("repoints references deep inside page data", () => {
    const r = replaceMediaIds({ items: [{ id: "a", image: { mediaId: "dup" } }, { id: "b", image: { mediaId: "keep" } }] }, new Map([["dup", "orig"]]));
    expect(r.changed).toBe(true);
    expect(JSON.stringify(r.value)).toBe('{"items":[{"id":"a","image":{"mediaId":"orig"}},{"id":"b","image":{"mediaId":"keep"}}]}');
    expect(replaceMediaIds({ a: 1 }, new Map([["x", "y"]])).changed).toBe(false);
  });

  it("drops repeated images but keeps items without one", () => {
    const out = dedupeByImage([{ id: "1", image: { mediaId: "a" } }, { id: "2", image: null }, { id: "3", image: { mediaId: "a" } }, { id: "4", image: { mediaId: "b" } }]);
    expect(out.map((x) => x.id)).toEqual(["1", "2", "4"]);
  });
});

describe("devotionalAltPlan", () => {
  it("uses the post title for single-use images and a neutral description for shared ones", () => {
    const plan = devotionalAltPlan([
      { title: "Peace with God", featured_media_id: "shared" },
      { title: "Stay connected!", featured_media_id: "shared" },
      { title: " Divine Authority ", featured_media_id: "solo" },
      { title: "No image", featured_media_id: null },
    ]);
    expect(plan.get("shared")).toBe(SHARED_DEVOTIONAL_ALT);
    expect(plan.get("solo")).toBe("Divine Authority");
    expect(plan.size).toBe(2);
  });
});

describe("helpers", () => {
  it("detects GoDaddy stock photos", () => {
    expect(isStockImage("https://img1.wsimg.com/isteam/stock/R434oPV")).toBe(true);
    expect(isStockImage("https://img1.wsimg.com/isteam/ip/abc/photo.jpg")).toBe(false);
  });

  it("gets a readable file name", () => {
    expect(fileNameOf("https://img1.wsimg.com/isteam/ip/x/RONNIE%20(21).JPG")).toBe("RONNIE (21).JPG");
  });

  it("only replaces empty, deleted or placeholder images", () => {
    const paths: Record<string, string> = { a: "seed/citylights.jpeg", b: "seed/pastorronny.jpeg", c: "uploads/2026/11/x.webp" };
    const of = (id: string) => paths[id];
    expect(isReplaceable(null, of)).toBe(true);
    expect(isReplaceable({ mediaId: "a" }, of)).toBe(true);
    expect(isReplaceable({ mediaId: "gone" }, of)).toBe(true);
    expect(isReplaceable({ mediaId: "b" }, of)).toBe(false); // real church photo
    expect(isReplaceable({ mediaId: "c" }, of)).toBe(false); // uploaded by staff
  });

  it("runs with limited concurrency and retries a failure once", async () => {
    let active = 0;
    let peak = 0;
    const attempts: Record<number, number> = {};
    const results = await runPool([1, 2, 3, 4, 5, 6, 7, 8], 4, async (n) => {
      attempts[n] = (attempts[n] ?? 0) + 1;
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      if (n === 3 && attempts[n] === 1) throw new Error("flaky");
      if (n === 7) throw new Error("always fails");
      return n * 10;
    });
    expect(peak).toBeLessThanOrEqual(4);
    expect(attempts[3]).toBe(2);
    expect(results[2]).toMatchObject({ ok: true, value: 30 });
    expect(attempts[7]).toBe(2);
    expect(results[6]).toMatchObject({ ok: false, error: "always fails" });
  });
});
