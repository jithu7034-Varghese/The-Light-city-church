import { describe, expect, it } from "vitest";
import { sanitizeDoc } from "@/lib/tiptap/sanitize";
import { seoSchema, splitKeywords } from "@/cms/seo";

const text = (t: string, marks?: unknown[]) => ({ type: "text", text: t, ...(marks && { marks }) });
const para = (...content: unknown[]) => ({ type: "paragraph", content });

describe("sanitizeDoc", () => {
  it("keeps everything the editor produces", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [text("Title")] },
        para(text("bold", [{ type: "bold" }]), text(" and "), text("italic", [{ type: "italic" }]), { type: "hardBreak" }),
        { type: "bulletList", content: [{ type: "listItem", content: [para(text("one"))] }] },
        { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [para(text("three"))] }] },
        { type: "blockquote", content: [para(text("John 3:16"))] },
        para(text("site", [{ type: "link", attrs: { href: "/about", target: null } }])),
        para(text("away", [{ type: "link", attrs: { href: "https://example.org/", target: "_blank" } }])),
      ],
    };
    expect(sanitizeDoc(doc)).toEqual(doc);
  });

  it("drops unsafe links, unknown nodes, marks and attributes", () => {
    const dirty = {
      type: "doc",
      content: [
        para(text("x", [{ type: "link", attrs: { href: "javascript:alert(1)", target: "_blank" } }])),
        para(text("y", [{ type: "link", attrs: { href: "https://ok.org", target: "_top", class: "evil", onclick: "x" } }])),
        { type: "image", attrs: { src: "https://tracker.example/p.gif" } },
        { type: "iframe", content: [text("nope")] },
        { type: "heading", attrs: { level: 1, style: "color:red" }, content: [text("H")] },
        para(text("z", [{ type: "textStyle", attrs: { color: "red" } }, { type: "bold" }, { type: "bold" }])),
        { type: "paragraph", attrs: { class: "x" }, content: [text("")] },
      ],
    };
    expect(sanitizeDoc(dirty)).toEqual({
      type: "doc",
      content: [
        para(text("x")),
        para(text("y", [{ type: "link", attrs: { href: "https://ok.org/", target: null } }])),
        { type: "heading", attrs: { level: 3 }, content: [text("H")] },
        para(text("z", [{ type: "bold" }])),
        { type: "paragraph" },
      ],
    });
  });

  it("returns an empty doc for garbage", () => {
    expect(sanitizeDoc(null)).toEqual({ type: "doc", content: [] });
    expect(sanitizeDoc({ type: "doc", content: "<script>" })).toEqual({ type: "doc", content: [] });
  });
});

describe("seoSchema", () => {
  it("turns blanks into null and tidies keywords", () => {
    expect(seoSchema.parse({ title: "  ", description: "", keywords: " grace ,faith,, prayer ", imageUrl: "" })).toEqual({
      title: null,
      description: null,
      keywords: "grace, faith, prayer",
      imageUrl: null,
    });
  });

  it("only accepts web or site image URLs", () => {
    expect(seoSchema.safeParse({ title: "", description: "", keywords: "", imageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(seoSchema.safeParse({ title: "", description: "", keywords: "", imageUrl: "//evil.example/x.jpg" }).success).toBe(false);
    expect(seoSchema.parse({ title: "", description: "", keywords: "", imageUrl: "https://x.supabase.co/a.jpg" }).imageUrl).toBe("https://x.supabase.co/a.jpg");
  });

  it("splits keywords for metadata", () => {
    expect(splitKeywords("a, b ,c")).toEqual(["a", "b", "c"]);
    expect(splitKeywords(null)).toBeUndefined();
  });
});
