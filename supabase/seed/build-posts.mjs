#!/usr/bin/env node
// Merges every captured devotional into supabase/seed/posts.json (the input for seed.ts).
//
// Sources (later sources never overwrite earlier ones; first wins per slug):
//   1. src/data/blogs.json                       11 posts already used by the current site
//   2. supabase/seed/raw/posts_*.txt             39 posts copied from the old site's RSS range
//   3. supabase/seed/raw/light-city-devotionals.json   the rest, downloaded from the old site
//
// Usage:  node supabase/seed/build-posts.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
const rawDir = path.join(root, "supabase/seed/raw");
const out = path.join(root, "supabase/seed/posts.json");

const cleanSlug = (s) =>
  decodeURIComponent(s)
    .normalize("NFKD")
    .replace(/[’'`]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

// Old GoDaddy slugs often end in -1, -2 … when a title was reused. Keep them unique but readable.
const isJunk = (t) => /^[\s\\.·•-]*$/.test(t);

const HEADINGS = /^(confession|further stud(y|ies)|faith confession|prayer|declaration)$/i;
const SCRIPTURE_REF = /^(\d\s)?[A-Z][a-zA-Z]+(\s[A-Z][a-zA-Z]+)?\s?\d{1,3}\s?:\s?\d{1,3}([\s,\-–]+\d{1,3})*(\s?\(?[A-Z]{2,5}\)?)?:?$/;

/** blocks [{type,text}] -> Tiptap JSON doc */
function toTiptap(blocks) {
  const content = [];
  for (const b of blocks) {
    const text = (b.text ?? "").replace(/ /g, " ").trim();
    if (!text || isJunk(text)) continue;
    const t = b.type || "p";
    if (["h2", "h3", "h4", "header-one", "header-two", "header-three", "header-four"].includes(t) || HEADINGS.test(text)) {
      content.push({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text }] });
    } else if (t === "blockquote") {
      content.push({ type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text }] }] });
    } else if (SCRIPTURE_REF.test(text)) {
      content.push({ type: "paragraph", content: [{ type: "text", text, marks: [{ type: "bold" }] }] });
    } else {
      // keep in-paragraph line breaks
      const parts = text.split("\n");
      const inline = [];
      parts.forEach((p, i) => {
        if (i) inline.push({ type: "hardBreak" });
        if (p) inline.push({ type: "text", text: p });
      });
      content.push({ type: "paragraph", content: inline });
    }
  }
  return { type: "doc", content };
}

function excerptOf(blocks) {
  const body = blocks.map((b) => (b.text ?? "").trim()).filter((t) => t && !isJunk(t) && !SCRIPTURE_REF.test(t) && t.length > 60);
  const first = body[0] ?? blocks.map((b) => b.text).join(" ");
  return first.length > 200 ? first.slice(0, 197).replace(/\s+\S*$/, "") + "…" : first;
}

const posts = new Map();
const seenLegacy = new Set();
const add = (p, source) => {
  let slug = cleanSlug(p.slug);
  if (!slug) return;
  const legacy = p.legacySlug ?? p.slug;
  if (seenLegacy.has(legacy)) return;          // same old URL already added from an earlier source
  if (posts.has(slug)) {
    // different old post whose cleaned slug collides (e.g. "god’s-mirror" vs "gods-mirror"): keep both
    if (cleanSlug(posts.get(slug).legacy_url.split("/f/")[1]) === slug && posts.get(slug).title === p.title.trim()) return;
    let n = 2;
    while (posts.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  seenLegacy.add(legacy);
  const blocks = p.blocks.filter((b) => b.text && !isJunk(b.text));
  if (!blocks.length) return;
  posts.set(slug, {
    slug,
    title: p.title.trim(),
    published_at: p.date,
    author_name: "Pastor Ronnie Dube",
    excerpt: p.excerpt || excerptOf(blocks),
    categories: p.categories?.length ? p.categories : ["Daily Light"],
    content: toTiptap(blocks),
    legacy_url: `/dailylightdevotional/f/${legacy}`,
    source,
  });
};

// 1. current site data
const blogs = JSON.parse(fs.readFileSync(path.join(root, "src/data/blogs.json"), "utf8"));
for (const b of blogs) {
  add({ slug: b.slug, title: b.title, date: b.pubDate, excerpt: b.excerpt,
        blocks: b.content.map((c) => ({ type: c.tag, text: c.text })) }, "blogs.json");
}

// 2. raw text captures
for (const f of fs.readdirSync(rawDir).filter((f) => /^posts_\d+\.txt$/.test(f)).sort()) {
  const txt = fs.readFileSync(path.join(rawDir, f), "utf8");
  for (const chunk of txt.split(/\n=====\n/)) {
    if (!chunk.trim()) continue;
    const [head, ...rest] = chunk.trim().split("\n\n");
    const meta = {};
    for (const line of head.split("\n")) {
      if (line.startsWith("### ")) meta.title = line.slice(4).trim();
      else if (line.includes(": ")) { const [k, ...v] = line.split(": "); meta[k.trim()] = v.join(": ").trim(); }
    }
    const blocks = rest.join("\n\n").split(/\n(?=<[a-z-]+> )/).map((r) => {
      const m = r.match(/^<([a-z-]+)> ?([\s\S]*)$/);
      return m ? { type: m[1] === "unstyled" ? "p" : m[1], text: m[2] } : null;
    }).filter(Boolean);
    add({ slug: meta.slug, title: meta.title, date: meta.date, blocks,
          legacySlug: meta.slug === "build-gods-character-in-you" ? "build-god%E2%80%99s-character-in-you" : meta.slug }, f);
  }
}

// 3. downloaded export
const dl = path.join(rawDir, "light-city-devotionals.json");
if (fs.existsSync(dl)) {
  const data = JSON.parse(fs.readFileSync(dl, "utf8"));
  for (const p of data.posts) {
    add({ slug: p.slug, title: p.title, date: p.date, categories: p.categories,
          blocks: p.blocks.map((b) => ({ type: b.type === "unstyled" ? "p" : b.type, text: b.text })),
          legacySlug: p.slug }, "download");
  }
} else {
  console.warn("! raw/light-city-devotionals.json not found — building without it");
}

const list = [...posts.values()].sort((a, b) => (a.published_at < b.published_at ? 1 : -1));
const missingDate = list.filter((p) => !p.published_at).map((p) => p.slug);
fs.writeFileSync(out, JSON.stringify(list, null, 2) + "\n");
const bySource = list.reduce((a, p) => ((a[p.source] = (a[p.source] ?? 0) + 1), a), {});
console.log(`wrote ${list.length} posts to ${path.relative(root, out)}`, bySource);
if (missingDate.length) console.warn("! posts without a date:", missingDate);
