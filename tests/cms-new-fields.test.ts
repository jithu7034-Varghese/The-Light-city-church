// The fields added to match the redesign must default to what the live site shows today, so
// published pages (saved before these fields existed) render exactly as before until edited.
import { describe, expect, it } from "vitest";
import { REGISTRY } from "@/cms/registry";
import { GLOBALS } from "@/cms/globals";

const parse = (type: string, data: Record<string, unknown> = {}) => {
  const out = REGISTRY[type]?.parse(data, 1);
  if (!out) throw new Error(`${type} did not parse`);
  return out as Record<string, unknown>;
};
const EMPTY_LINK = { label: "", href: "" };

describe("new section fields default to today's output", () => {
  it.each([
    ["scripture", { image: null }],
    ["cta", { eyebrow: "", image: null }],
    ["page_hero", { image: null }],
    ["service_times", { tag: "", image: null }],
    ["giving", { tag: "", note: "", notReadyText: "Online giving is being set up. Please speak to us on Sunday." }],
    ["newsletter", { tag: "", emailPlaceholder: "Email", sendingLabel: "Signing up…" }],
    ["directions", { tag: "", mapEmbedUrl: "" }],
    ["home_hero", { showServiceCard: true, serviceCardLabel: "", serviceCardLink: EMPTY_LINK }],
    ["home_services", { tag: "", buttonLabel: "", buttonLink: EMPTY_LINK }],
    ["home_gallery", { tag: "" }],
    ["home_blog", { readLabel: "", fallbackCategory: "Devotional" }],
    ["home_prayer", { eyebrow: "", image: null }],
    ["ministries_grid", { tag: "" }],
    ["ministries_cta", { image: null }],
    ["gallery_grid", { tag: "" }],
    ["contact_map_hero", { image: null }],
  ] as const)("%s", (type, expected) => {
    expect(parse(type)).toMatchObject(expected);
  });

  it("keeps existing values when old data is parsed", () => {
    const hero = parse("home_hero", { eyebrow: "WHAT WE DO", heading: "Welcome", buttons: [] });
    expect(hero).toMatchObject({ eyebrow: "WHAT WE DO", heading: "Welcome", showServiceCard: true });
  });

  it("only accepts Google Maps embed links for the directions map", () => {
    expect(REGISTRY.directions.validate({ mapEmbedUrl: "https://www.google.com/maps/embed?pb=abc" }).ok).toBe(true);
    expect(REGISTRY.directions.validate({ mapEmbedUrl: "https://evil.example/embed" }).ok).toBe(false);
  });
});

describe("new global fields default to today's output", () => {
  it("footer", () => {
    expect(GLOBALS.footer.parse({})).toMatchObject({
      taglineAccent: "",
      tagline: "",
      socialsHeading: "",
      visitHeading: "",
      whatsappLabel: "WhatsApp",
      sceneImage: null,
      brandText: "LIGHT CITY",
    });
  });

  it("site → devotionals pages use the wording that was hard-coded", () => {
    expect(GLOBALS.site.parse({}).devotionals).toEqual({
      heroEyebrow: "",
      heroTitle: "Daily Light Devotionals",
      heroText: "Grow in the accurate teaching of the Gospel of grace. Read, reflect and pray with Pastor Ronnie Dube.",
      allLabel: "All",
      loadingText: "Loading devotionals…",
      emptyText: "New devotionals are coming soon.",
      unknownCategoryText: "That category doesn't exist.",
      seeAllLabel: "See all devotionals",
      emptyPageText: "No devotionals on this page.",
      backToLatestLabel: "Back to the latest",
      newerLabel: "← Newer",
      olderLabel: "Older →",
      pageStatus: "Page {page} of {pages}",
      fallbackCategory: "Devotional",
      backLabel: "← All devotionals",
      relatedHeading: "More devotionals",
      heroImage: null,
    });
  });

  it("an existing site global without the devotionals group still parses (no data loss)", () => {
    const site = GLOBALS.site.parse({ name: "The Light City Church", email: "x@example.com" });
    expect(site.name).toBe("The Light City Church");
    expect(site.email).toBe("x@example.com");
    expect(site.devotionals.heroTitle).toBe("Daily Light Devotionals");
  });
});
