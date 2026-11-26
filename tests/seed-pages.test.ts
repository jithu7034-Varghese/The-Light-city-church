import { describe, expect, it } from "vitest";
import { SEED_PAGES } from "../supabase/seed/pages";
import { GLOBAL_SEED } from "../supabase/seed/pages/globals";
import { markdown, SEED_IMAGES, type SeedImageFile } from "../supabase/seed/pages/helpers";
import { resolveSeedImages } from "../supabase/seed/pages/resolve";
import { REGISTRY } from "@/cms/registry";
import { GLOBALS } from "@/cms/globals";
import { collectMediaIds } from "@/cms/fields";
import { isValidSlug } from "@/lib/slug";

// Fake media ids so seed data validates like it will after the images are uploaded.
const fakeIds = Object.fromEntries(
  (Object.keys(SEED_IMAGES) as SeedImageFile[]).map((f, i) => [f, `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`]),
) as Record<SeedImageFile, string>;

describe("page seed", () => {
  it("has the nine website pages with unique, valid slugs", () => {
    const slugs = SEED_PAGES.map((p) => p.slug);
    expect(slugs).toEqual(["home", "about", "ministries", "gallery", "contact", "freedom-from-religion", "the-loved-circle", "give", "privacy-policy"]);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every(isValidSlug)).toBe(true);
  });

  describe.each(SEED_PAGES.map((p) => [p.slug, p] as const))("%s", (_slug, page) => {
    it("uses only registered section types", () => {
      for (const s of page.sections) expect(REGISTRY[s.type], `unknown section type ${s.type}`).toBeDefined();
    });

    it("validates every section against its schema (after images resolve)", () => {
      for (const s of page.sections) {
        const result = REGISTRY[s.type].validate(resolveSeedImages(s.data, fakeIds));
        expect(result, `${page.slug} → ${s.type}: ${result.ok ? "" : result.error}`).toMatchObject({ ok: true });
      }
    });

    it("only references the real church images", () => {
      const json = JSON.stringify(page.sections);
      for (const banned of ["unsplash.com", "hero_portrait", "pastor_portrait", "avatar_ryan", "feature_sculpture"]) {
        expect(json).not.toContain(banned);
      }
    });

    it("has unique list item ids within each list", () => {
      const walk = (v: unknown) => {
        if (Array.isArray(v)) {
          const ids = v.map((x) => (x && typeof x === "object" ? (x as { id?: unknown }).id : undefined)).filter((x) => x !== undefined);
          expect(new Set(ids).size, `duplicate ids in ${page.slug}: ${ids.join(",")}`).toBe(ids.length);
          v.forEach(walk);
        } else if (v && typeof v === "object") Object.values(v).forEach(walk);
      };
      walk(page.sections.map((s) => s.data));
    });
  });

  it("does not contain the made-up testimonies", () => {
    const json = JSON.stringify(SEED_PAGES);
    for (const fake of ["Sarah Jenkins", "Marcus Chen", "Elijah Brooks", "99% Friendly", "+44 115"]) expect(json).not.toContain(fake);
  });

  it("uses the old site's wording on the new pages", () => {
    const json = JSON.stringify(SEED_PAGES);
    expect(json).toContain("Be free from religion!");
    expect(json).toContain("Extravagant Love");
    expect(json).toContain("WHY BECOME A MONTHLY PARTNER");
    expect(json).toContain("Welcome to The Light City Church");
  });
});

describe("globals seed", () => {
  it.each(Object.keys(GLOBAL_SEED) as (keyof typeof GLOBAL_SEED)[])("%s validates", (key) => {
    const result = GLOBALS[key].validate(resolveSeedImages(GLOBAL_SEED[key], fakeIds));
    expect(result, result.ok ? "" : result.error).toMatchObject({ ok: true });
  });

  it("carries the real service time and WhatsApp link", () => {
    expect(GLOBAL_SEED.site.serviceTimes[0]).toMatchObject({ day: "Sunday", time: "10:30am", venue: "The Motorpoint Arena" });
    expect(GLOBAL_SEED.site.whatsapp).toBe("https://wa.me/447878393146");
  });
});

describe("resolveSeedImages", () => {
  it("swaps seed placeholders for media ids, deep inside lists", () => {
    const out = resolveSeedImages({ a: { mediaId: "seed:pastorronny.jpeg" }, list: [{ id: "x", image: { mediaId: "seed:logo1.png" } }] }, fakeIds);
    expect([...collectMediaIds(out)].sort()).toEqual([fakeIds["logo1.png"], fakeIds["pastorronny.jpeg"]].sort());
  });

  it("rejects unknown seed images", () => {
    expect(() => resolveSeedImages({ mediaId: "seed:hero_portrait.png" }, fakeIds)).toThrow(/Unknown seed image/);
  });
});

describe("markdown → Tiptap", () => {
  it("converts headings, paragraphs, lists, bold and links", () => {
    const doc = markdown("## Who we are\n\nWe are **the church**.\n\n- one\n- [ICO](https://ico.org.uk)\n\n1. first");
    expect(doc.content.map((b) => b.type)).toEqual(["heading", "paragraph", "bulletList", "orderedList"]);
    expect(JSON.stringify(doc)).toContain('"marks":[{"type":"bold"}]');
    expect(JSON.stringify(doc)).toContain('"href":"https://ico.org.uk"');
  });

  it("turns tables into bullet points and drops HTML comments", () => {
    const doc = markdown("<!-- note -->\n| Info | How long |\n|---|---|\n| Prayer | 12 months |\n| Newsletter | Until you unsubscribe |");
    expect(doc.content).toHaveLength(1);
    expect(doc.content[0].type).toBe("bulletList");
    expect(JSON.stringify(doc)).toContain("Prayer — How long: 12 months");
    expect(JSON.stringify(doc)).not.toContain("note");
  });
});
