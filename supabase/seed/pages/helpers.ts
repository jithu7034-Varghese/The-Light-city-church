// Helpers for page seed data (supabase/seed/pages/*.ts). Pure data, no imports from the app,
// so `npx tsx supabase/seed-pages.ts` can load it. tests/seed-pages.test.ts validates every
// page against the section registry.

/** Church images in /public that the seed uploads to the media bucket (with alt text). Only real
 *  church photos/graphics: never the stock "portrait" images of people who aren't church members. */
export const SEED_IMAGES = {
  "pastorronny.jpeg": "Pastor Ronnie Dube smiling, in a grey jacket",
  "ronnyandanna.jpeg": "Pastors Ronnie and Annalene Dube smiling together",
  "thecitylight.webp": "“Welcome to The Light City Church” with three crosses above the empty tomb",
  "logo1.png": "A crown of thorns",
  "citylights.jpeg": "Sunrise over a mountain peak",
} as const;
export type SeedImageFile = keyof typeof SEED_IMAGES;

/** Image field value pointing at a /public file; the seed swaps it for the real media id. */
export function img(file: SeedImageFile) {
  return { mediaId: `seed:${file}` };
}

export function link(label: string, href: string) {
  return { label, href };
}

export function button(id: string, label: string, href: string) {
  return { id, label, link: { label, href } };
}

type TextNode = { type: "text"; text: string; marks?: { type: string; attrs?: Record<string, unknown> }[] };
type Block = { type: string; attrs?: Record<string, unknown>; content?: unknown[] };

const text = (t: string): TextNode[] => (t ? [{ type: "text", text: t }] : []);

/** Tiptap doc from plain paragraphs. */
export function paragraphs(...items: string[]) {
  return { type: "doc" as const, content: items.filter(Boolean).map((p) => ({ type: "paragraph", content: text(p) })) };
}

/** Tiptap doc from a mix of paragraphs and scripture quotes (blockquote + reference). */
export function article(items: (string | { scripture: string; reference: string })[]) {
  const content: Block[] = items.map((i) =>
    typeof i === "string"
      ? { type: "paragraph", content: text(i) }
      : {
          type: "blockquote",
          content: [
            { type: "paragraph", content: text(`“${i.scripture}”`) },
            { type: "paragraph", content: [{ type: "text", text: i.reference, marks: [{ type: "bold" }] }] },
          ],
        },
  );
  return { type: "doc" as const, content };
}

/** Minimal Markdown → Tiptap: #/##/### headings, paragraphs, "-"/"*" bullets, "1." numbered lists, **bold**, [links](url). */
export function markdown(md: string) {
  const inline = (s: string): TextNode[] => {
    const out: TextNode[] = [];
    const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ type: "text", text: s.slice(last, m.index) });
      if (m[1]) out.push({ type: "text", text: m[1], marks: [{ type: "bold" }] });
      else out.push({ type: "text", text: m[2], marks: [{ type: "link", attrs: { href: m[3] } }] });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ type: "text", text: s.slice(last) });
    return out;
  };
  const content: Block[] = [];
  let list: Block | null = null;
  let para: string[] = [];
  let tableHeader: string[] | null = null;
  const flushPara = () => {
    if (para.length) content.push({ type: "paragraph", content: inline(para.join(" ")) });
    para = [];
  };
  const cells = (row: string) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const clean = md.replace(/\r/g, "").replace(/<!--[\s\S]*?-->/g, "");
  for (const raw of clean.split("\n")) {
    // Tables (no table node in the editor): each row becomes a bullet "First cell — Header: cell. …"
    if (/^\s*\|/.test(raw)) {
      flushPara();
      const row = cells(raw);
      if (row.every((c) => /^:?-{3,}:?$/.test(c))) continue; // separator
      if (!tableHeader) {
        tableHeader = row;
        list = { type: "bulletList", content: [] };
        content.push(list);
        continue;
      }
      const rest = row.slice(1).map((c, i) => (c && c !== "—" ? `${tableHeader![i + 1]}: ${c}` : "")).filter(Boolean);
      list!.content!.push({ type: "listItem", content: [{ type: "paragraph", content: inline([row[0], rest.join(". ")].filter(Boolean).join(" — ")) }] });
      continue;
    }
    tableHeader = null;
    const line = raw.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushPara();
      const type = bullet ? "bulletList" : "orderedList";
      if (!list || list.type !== type) {
        list = { type, content: [] };
        content.push(list);
      }
      list.content!.push({ type: "listItem", content: [{ type: "paragraph", content: inline((bullet ?? numbered)![1]) }] });
      continue;
    }
    list = null;
    if (!line) {
      flushPara();
    } else if (heading) {
      flushPara();
      content.push({ type: "heading", attrs: { level: heading[1].length === 3 ? 3 : 2 }, content: inline(heading[2]) });
    } else {
      para.push(line);
    }
  }
  flushPara();
  return { type: "doc" as const, content };
}

export type SeedSection = { type: string; visible?: boolean; data: Record<string, unknown> };
export type SeedPage = {
  slug: string;
  title: string;
  seo: { title?: string; description?: string };
  sections: SeedSection[];
};
