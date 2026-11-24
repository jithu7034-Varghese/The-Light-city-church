import { describe, expect, it } from "vitest";
import posts from "../supabase/seed/posts.json";
import images from "../supabase/seed/raw/old-site-images.json";
import {
  fileNameOf, fullImageUrl, isReplaceable, isStockImage, legacySlugOf, normalizeSlug, pickPostImage, runPool,
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
