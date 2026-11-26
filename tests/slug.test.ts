import { describe, expect, it } from "vitest";
import { isValidSlug, SLUG_MAX, slugify } from "@/lib/slug";

describe("slugify", () => {
  it.each([
    ["Known as Father: A 7-Day Devotional", "known-as-father-a-7-day-devotional"],
    ["  Stay connected!  ", "stay-connected"],
    ["God's Love & Grace", "gods-love-and-grace"],
    ["God’s word (KJV)", "gods-word-kjv"],
    ["Café — crème brûlée", "cafe-creme-brulee"],
    ["Psalm 23:1-6", "psalm-23-1-6"],
    ["---Already--dashed---", "already-dashed"],
    ["", ""],
    ["!!!", ""],
  ])("%j → %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("caps length without leaving a trailing dash", () => {
    const s = slugify("word ".repeat(60));
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(s.endsWith("-")).toBe(false);
  });

  it("always produces a valid slug for non-empty results", () => {
    for (const t of ["Hello World", "A/B testing", "Ünïcödé Tïtle", "1 John 3:1"]) expect(isValidSlug(slugify(t))).toBe(true);
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase words joined by single dashes", () => {
    expect(isValidSlug("known-as-father")).toBe(true);
    expect(isValidSlug("day-1")).toBe(true);
  });

  it.each(["", "Has-Caps", "double--dash", "-leading", "trailing-", "has space", "slash/es", "x".repeat(SLUG_MAX + 1)])(
    "rejects %j",
    (s) => expect(isValidSlug(s)).toBe(false),
  );
});
