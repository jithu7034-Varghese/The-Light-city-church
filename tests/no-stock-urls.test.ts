import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cssImageUrl } from "@/lib/media/url";
import { GLOBALS } from "@/cms/globals";

const root = path.resolve(__dirname, "..");
const STOCK_HOST = /images\.unsplash\.com|unsplash\.com/i;

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.(css|tsx?|mjs|json)$/.test(e.name) ? [p] : [];
  });
}

describe("no stock-photo hosts", () => {
  it("has no Unsplash URLs anywhere in src/ or next.config.ts", () => {
    const offenders = [...files(path.join(root, "src")), path.join(root, "next.config.ts")]
      .filter((f) => STOCK_HOST.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f));
    expect(offenders).toEqual([]);
  });
});

describe("cssImageUrl", () => {
  it("wraps a media URL for use in CSS", () => {
    expect(cssImageUrl("https://x.supabase.co/storage/v1/object/public/media/seed/thecitylight.webp")).toBe(
      'url("https://x.supabase.co/storage/v1/object/public/media/seed/thecitylight.webp")',
    );
  });

  it("can't break out of the CSS declaration", () => {
    const out = cssImageUrl('https://x/a.jpg");background:red;--x:("')!;
    expect(out.startsWith('url("')).toBe(true);
    expect(out.slice(5, -2)).not.toMatch(/["'()\\\s]/);
  });

  it("rejects non-http(s) URLs", () => {
    expect(cssImageUrl("javascript:alert(1)")).toBeNull();
    expect(cssImageUrl("//evil.example/x.png")).toBeNull();
    expect(cssImageUrl("")).toBeNull();
    expect(cssImageUrl(null)).toBeNull();
  });
});

describe("Site settings: section background image", () => {
  it("is optional (existing settings without it fall back to the gradient)", () => {
    expect(GLOBALS.site.parse({ name: "The Light City Church" }).sectionBackground).toBeNull();
    expect(GLOBALS.site.specs.sectionBackground).toMatchObject({ kind: "image", label: "Section background image" });
  });
});
