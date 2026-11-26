// Lays out a devotional's Tiptap content for the article page. The content itself is untouched:
// it is split into runs that are rendered by the shared TiptapContent renderer. Two layout rules:
// - the first paragraph is the lead (larger, ink);
// - a scripture reference (a short paragraph that is entirely bold and contains a number, e.g.
//   "Job 23: 12") followed by a paragraph or blockquote becomes a scripture card, as do blockquotes.
import { TiptapContent } from "@/lib/tiptap/render";
import d from "../devotionals.module.css";

type Mark = { type: string };
type Node = { type?: string; text?: string; marks?: Mark[]; content?: Node[] };

const doc = (content: Node[]) => ({ type: "doc", content });

const plainText = (n: Node): string => (n.text ?? "") + (n.content ?? []).map(plainText).join("");

function referenceText(n: Node | undefined): string | null {
  if (!n || n.type !== "paragraph" || !n.content?.length) return null;
  const allBold = n.content.every(
    (c) => c.type === "hardBreak" || (c.type === "text" && (!c.text?.trim() || c.marks?.some((m) => m.type === "bold"))),
  );
  const text = plainText(n).replace(/\s+/g, " ").trim();
  return allBold && text.length > 0 && text.length <= 60 && /\d/.test(text) ? text : null;
}

const isVerse = (n: Node | undefined): n is Node =>
  !!n && (n.type === "blockquote" || (n.type === "paragraph" && plainText(n).trim() !== "" && referenceText(n) === null));

type Block =
  | { kind: "lead"; node: Node }
  | { kind: "flow"; nodes: Node[] }
  | { kind: "scripture"; reference: string | null; verse: Node[] };

function toBlocks(nodes: Node[]): Block[] {
  const blocks: Block[] = [];
  let leadDone = false;
  const pushFlow = (n: Node) => {
    const last = blocks[blocks.length - 1];
    if (last?.kind === "flow") last.nodes.push(n);
    else blocks.push({ kind: "flow", nodes: [n] });
  };
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const ref = referenceText(n);
    if (ref && isVerse(nodes[i + 1])) {
      const next = nodes[i + 1];
      blocks.push({ kind: "scripture", reference: ref, verse: next.type === "blockquote" ? (next.content ?? []) : [next] });
      i++;
      leadDone = true;
    } else if (n.type === "blockquote") {
      blocks.push({ kind: "scripture", reference: null, verse: n.content ?? [] });
      leadDone = true;
    } else if (!leadDone && n.type === "paragraph" && !ref && plainText(n).trim() !== "") {
      blocks.push({ kind: "lead", node: n });
      leadDone = true;
    } else {
      if (n.type !== "paragraph" || plainText(n).trim() !== "") leadDone = true;
      pushFlow(n);
    }
  }
  return blocks;
}

export function ArticleBody({ doc: content }: { doc: unknown }) {
  const root = content as Node | null;
  if (!root || root.type !== "doc") return null;
  return (
    <>
      {toBlocks(root.content ?? []).map((b, i) => {
        if (b.kind === "lead") {
          return (
            <div key={i} className={d.lead}>
              <TiptapContent doc={doc([b.node])} />
            </div>
          );
        }
        if (b.kind === "scripture") {
          return (
            <figure key={i} className={d.scripture}>
              {b.reference && <figcaption className={d.scriptureRef}>{b.reference}</figcaption>}
              <blockquote className={d.scriptureText}>
                <TiptapContent doc={doc(b.verse)} />
              </blockquote>
            </figure>
          );
        }
        return <TiptapContent key={i} doc={doc(b.nodes)} />;
      })}
    </>
  );
}
