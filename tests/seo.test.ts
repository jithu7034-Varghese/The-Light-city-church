import { describe, expect, it } from "vitest";
import posts from "../supabase/seed/posts.json";
import oldSite from "../supabase/seed/old-site-content.json";
import { legacyRedirects, oldDevotionalSlug } from "@/lib/seo/legacy-redirects";
import { articleJsonLd, churchJsonLd, serializeJsonLd } from "@/lib/seo/jsonld";
import { GLOBALS, type SiteData } from "@/cms/globals";

const rules = legacyRedirects(posts, oldSite.redirects);
const destinationFor = (path: string) => {
  // Same order Next uses: first matching rule wins.
  for (const r of rules) {
    if (r.source === path) return r.destination;
    if (r.source.endsWith("/:slug") && path.startsWith(r.source.slice(0, -":slug".length))) {
      return r.destination.replace(":slug", path.slice(r.source.length - ":slug".length));
    }
  }
  return null;
};

describe("legacy redirects", () => {
  it("covers the old page URLs", () => {
    expect(destinationFor("/contact-us")).toBe("/contact");
    expect(destinationFor("/partner-with-us")).toBe("/give");
    expect(destinationFor("/partner-with-tlcc")).toBe("/give");
    expect(destinationFor("/dailylightdevotional")).toBe("/devotionals");
  });

  it("sends unchanged devotional slugs through the generic rule", () => {
    expect(destinationFor("/dailylightdevotional/f/stay-connected")).toBe("/devotionals/stay-connected");
  });

  it("sends the 8 changed slugs to the right post, before the generic rule", () => {
    expect(destinationFor("/dailylightdevotional/f/gods-mirror")).toBe("/devotionals/gods-mirror-2");
    expect(destinationFor("/dailylightdevotional/f/god’s-mirror")).toBe("/devotionals/gods-mirror");
    expect(destinationFor(`/dailylightdevotional/f/${encodeURIComponent("god’s-mirror")}`)).toBe("/devotionals/gods-mirror");
    expect(destinationFor("/dailylightdevotional/f/co--labourers-with-god")).toBe("/devotionals/co-labourers-with-god");
    const generic = rules.findIndex((r) => r.source === "/dailylightdevotional/f/:slug");
    const exact = rules.findIndex((r) => r.source === "/dailylightdevotional/f/gods-mirror");
    expect(exact).toBeGreaterThanOrEqual(0);
    expect(exact).toBeLessThan(generic);
  });

  it("every old devotional URL lands on an existing post", () => {
    const slugs = new Set(posts.map((p) => p.slug));
    for (const p of posts) {
      const old = oldDevotionalSlug(p.legacy_url);
      if (!old) continue;
      expect(destinationFor(`/dailylightdevotional/f/${old}`)).toBe(`/devotionals/${p.slug}`);
      expect(slugs.has(p.slug)).toBe(true);
    }
  });

  it("all redirects are permanent (301/308)", () => {
    expect(rules.every((r) => r.permanent)).toBe(true);
  });
});

const site: SiteData = {
  name: "The Light City Church",
  tagline: "Christ in you the hope of glory!",
  serviceTimes: [{ id: "s", day: "Sunday", time: "10:30am", venue: "The Motorpoint Arena", address: "Bolero Square, Nottingham, NG1 1LA" }],
  email: "",
  phone: "",
  whatsapp: "https://wa.me/447878393146",
  paypal: { business: "", itemName: "", currency: "GBP" },
  socials: [{ id: "f", network: "facebook", url: "https://www.facebook.com/102820662239782" }, { id: "bad", network: "x", url: "javascript:alert(1)" }],
  sectionBackground: null,
  devotionals: GLOBALS.site.parse({}).devotionals,
};

describe("JSON-LD", () => {
  it("describes the church from site settings", () => {
    const ld = churchJsonLd(site);
    expect(ld["@type"]).toBe("Church");
    expect(ld.address).toMatchObject({ streetAddress: "The Motorpoint Arena, Bolero Square, Nottingham, NG1 1LA", addressCountry: "GB" });
    expect(ld.sameAs).toEqual(["https://www.facebook.com/102820662239782"]);
    expect(ld).not.toHaveProperty("email");
  });

  it("describes a devotional as an Article", () => {
    const ld = articleJsonLd(
      { slug: "stay-connected", title: "Stay connected!", excerpt: null, publishedAt: "2025-02-05T10:00:00.000Z", authorName: "Pastor Ronnie Dube", image: null },
      site,
      "A devotional",
    );
    expect(ld).toMatchObject({ "@type": "Article", headline: "Stay connected!", datePublished: "2025-02-05T10:00:00.000Z", author: { name: "Pastor Ronnie Dube" } });
    expect(String(ld.url)).toMatch(/\/devotionals\/stay-connected$/);
  });

  it("can't be broken out of the <script> tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("</script>");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
