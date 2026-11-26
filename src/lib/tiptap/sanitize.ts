// Server-side clean-up of a Tiptap JSON document before it is saved. Devotional bodies are
// stored as Tiptap JSON (not HTML), so "sanitising" means rebuilding the tree with only the
// nodes, marks and attributes the editor produces. Anything else (unknown nodes, style or
// class attributes, javascript: links, …) is dropped. Links keep a safe href and an optional
// target="_blank"; the renderer adds rel="noopener noreferrer".
import { safeHref } from "./render";

type Json = Record<string, unknown>;
export type CleanNode = { type: string; text?: string; attrs?: Json; marks?: { type: string; attrs?: Json }[]; content?: CleanNode[] };

const BLOCKS = new Set(["paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "hardBreak", "horizontalRule"]);
const MAX_DEPTH = 20;

function cleanMarks(marks: unknown): CleanNode["marks"] {
  if (!Array.isArray(marks)) return undefined;
  const out: NonNullable<CleanNode["marks"]> = [];
  const seen = new Set<string>();
  for (const m of marks as Json[]) {
    const type = m?.type;
    if (typeof type !== "string" || seen.has(type)) continue;
    if (type === "bold" || type === "italic") {
      out.push({ type });
      seen.add(type);
    } else if (type === "link") {
      const attrs = (m.attrs ?? {}) as Json;
      const href = safeHref(attrs.href);
      if (!href) continue;
      out.push({ type: "link", attrs: { href, target: attrs.target === "_blank" ? "_blank" : null } });
      seen.add(type);
    }
  }
  return out.length ? out : undefined;
}

function cleanNode(node: unknown, depth: number): CleanNode | null {
  if (!node || typeof node !== "object" || depth > MAX_DEPTH) return null;
  const n = node as Json;
  if (n.type === "text") {
    if (typeof n.text !== "string" || n.text === "") return null;
    const marks = cleanMarks(n.marks);
    return marks ? { type: "text", text: n.text, marks } : { type: "text", text: n.text };
  }
  if (typeof n.type !== "string" || !BLOCKS.has(n.type)) return null;
  const out: CleanNode = { type: n.type };
  const attrs = (n.attrs ?? {}) as Json;
  if (n.type === "heading") out.attrs = { level: attrs.level === 2 ? 2 : 3 };
  if (n.type === "orderedList") {
    const start = Number(attrs.start);
    out.attrs = { start: Number.isInteger(start) && start > 0 && start < 10_000 ? start : 1 };
  }
  if (n.type !== "hardBreak" && n.type !== "horizontalRule" && Array.isArray(n.content)) {
    const content = n.content.map((c) => cleanNode(c, depth + 1)).filter((c): c is CleanNode => c !== null);
    if (content.length) out.content = content;
  }
  return out;
}

/** Returns a clean { type: "doc", content } with only editor-supported nodes, marks and attributes. */
export function sanitizeDoc(doc: unknown): { type: "doc"; content: CleanNode[] } {
  const content = doc && typeof doc === "object" && Array.isArray((doc as Json).content) ? ((doc as Json).content as unknown[]) : [];
  return { type: "doc", content: content.map((c) => cleanNode(c, 1)).filter((c): c is CleanNode => c !== null) };
}
