import { describe, expect, it } from "vitest";
import { dateBounds, filtersToQuery, parseFilters } from "@/lib/enquiries/filters";

const uuid = "3f9c2b1e-8a4d-4c6b-9e2f-1a2b3c4d5e6f";

describe("parseFilters", () => {
  it("parses valid params", () => {
    expect(parseFilters({ q: " jane ", status: "follow_up", form: uuid, assignee: "me", from: "2026-11-01", to: "2026-11-30", page: "3" })).toEqual({
      q: "jane",
      status: "follow_up",
      form: uuid,
      assignee: "me",
      from: "2026-11-01",
      to: "2026-11-30",
      page: 3,
    });
  });

  it("ignores invalid values instead of failing", () => {
    expect(parseFilters({ status: "deleted", form: "1 or 1=1", assignee: "someone", from: "yesterday", page: "-2" })).toEqual({ page: 1 });
  });

  it("takes the first value of repeated params and accepts URLSearchParams", () => {
    expect(parseFilters({ status: ["read", "closed"] }).status).toBe("read");
    expect(parseFilters(new URLSearchParams("assignee=none&q=prayer")).assignee).toBe("none");
  });
});

describe("filtersToQuery", () => {
  it("round-trips through parseFilters", () => {
    const f = parseFilters({ q: "jane smith", status: "unread", assignee: uuid });
    expect(parseFilters(new URLSearchParams(filtersToQuery(f)))).toEqual(f);
  });

  it("omits page unless asked", () => {
    expect(filtersToQuery({ status: "read", page: 4 })).toBe("status=read");
    expect(filtersToQuery({ status: "read", page: 4 }, { includePage: true })).toBe("status=read&page=4");
    expect(filtersToQuery({ page: 1 }, { includePage: true })).toBe("");
  });
});

describe("dateBounds", () => {
  it("makes the end date inclusive", () => {
    expect(dateBounds({ from: "2026-11-01", to: "2026-11-30" })).toEqual({
      start: "2026-11-01T00:00:00.000Z",
      end: "2026-12-01T00:00:00.000Z",
    });
  });
});
