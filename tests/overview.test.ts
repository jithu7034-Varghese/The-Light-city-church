import { describe, expect, it } from "vitest";
import { bucketCounts, parseRange } from "@/lib/overview";

const days = (start: string, n: number, total = 1) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { day: d.toISOString().slice(0, 10), total };
  });

describe("parseRange", () => {
  it("accepts 7/30/90 and defaults to 30", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange(90)).toBe(90);
    expect(parseRange("365")).toBe(30);
    expect(parseRange(undefined)).toBe(30);
  });
});

describe("bucketCounts", () => {
  it("keeps one bar per day for 7 and 30 days", () => {
    expect(bucketCounts(days("2026-11-17", 7), 7)).toHaveLength(7);
    expect(bucketCounts(days("2026-10-25", 30), 30)).toHaveLength(30);
  });

  it("groups 90 days into Monday-start weeks without losing counts", () => {
    const input = days("2026-08-26", 90, 2); // starts on a Wednesday
    const weeks = bucketCounts(input, 90);
    expect(weeks.reduce((s, b) => s + b.total, 0)).toBe(180);
    expect(weeks[0]).toEqual({ start: "2026-08-24", end: "2026-08-30", total: 10 }); // Wed–Sun = 5 days
    expect(weeks[1].start).toBe("2026-08-31");
    expect(weeks[1].total).toBe(14);
    expect(weeks.every((w) => new Date(`${w.start}T00:00:00Z`).getUTCDay() === 1)).toBe(true);
  });

  it("sorts unsorted input", () => {
    const b = bucketCounts([{ day: "2026-11-02", total: 1 }, { day: "2026-11-01", total: 3 }], 7);
    expect(b.map((x) => x.start)).toEqual(["2026-11-01", "2026-11-02"]);
  });
});
