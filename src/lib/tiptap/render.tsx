// Renders stored Tiptap JSON as React elements on the server. Only the node and mark
// types the editor allows are rendered; anything else is dropped. No HTML strings are
// injected, and links are limited to http(s)/mailto/tel and same-site paths.
import type { ReactNode } from "react";

type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = { type?: string; text?: string; marks?: Mark[]; attrs?: Record<string, unknown>; content?: Node[] };

export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const h = href.trim();
  if (h.startsWith("/") && !h.startsWith("//")) return h;
  if (h.startsWith("#")) return h;
  try {
    const u = new URL(h);
    return ["http:", "https:", "mailto:", "tel:"].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

function renderText(node: Node, key: number): ReactNode {
  let out: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        out = <strong>{out}</strong>;
        break;
      case "italic":
        out = <em>{out}</em>;
        break;
      case "underline":
        out = <u>{out}</u>;
        break;
      case "link": {
        const href = safeHref(mark.attrs?.href);
        if (href) {
          const external = /^https?:/.test(href);
          out = (
            <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}>
              {out}
            </a>
          );
        }
        break;
      }
    }
  }
  return <span key={key}>{out}</span>;
}

function renderChildren(nodes: Node[] | undefined): ReactNode[] {
  return (nodes ?? []).map((n, i) => renderNode(n, i));
}

function renderNode(node: Node, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "paragraph":
      return <p key={key}>{renderChildren(node.content)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level);
      const Tag = level === 2 ? "h2" : level === 4 ? "h4" : "h3";
      return <Tag key={key}>{renderChildren(node.content)}</Tag>;
    }
    case "bulletList":
      return <ul key={key}>{renderChildren(node.content)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderChildren(node.content)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node.content)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node.content)}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    default:
      return null;
  }
}

export function TiptapContent({ doc }: { doc: unknown }) {
  const root = doc as Node | null;
  if (!root || root.type !== "doc") return null;
  return <>{renderChildren(root.content)}</>;
}

/** Plain text of a doc, for meta descriptions. */
export function tiptapToText(doc: unknown, max = 160): string {
  const parts: string[] = [];
  const walk = (n: Node) => {
    if (n.text) parts.push(n.text);
    n.content?.forEach(walk);
  };
  if (doc && typeof doc === "object") walk(doc as Node);
  const text = parts.join(" ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
