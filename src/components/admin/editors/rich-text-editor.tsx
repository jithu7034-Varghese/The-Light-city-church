"use client";
// Basic rich text for devotionals: headings, bold, italic, lists, links, blockquote.
// Stores Tiptap JSON; the public site renders it with lib/tiptap/render.tsx (which drops
// anything outside this set and re-checks every link).
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2, Unlink, type LucideIcon,
} from "lucide-react";
import { cn } from "../ui/cn";
import { safeHref } from "@/lib/tiptap/render";

export function RichTextEditor({
  value,
  onChange,
  label,
}: {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  label: string;
}) {
  const editor = useEditor({
    immediatelyRender: false, // server-rendered page: create the editor in the browser
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "tiptap min-h-72 px-4 py-3 focus:outline-none", "aria-label": label, role: "textbox", "aria-multiline": "true" },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const input = window.prompt("Link address (https://…, mailto:… or /page)", current ?? "https://");
    if (input === null) return;
    if (input.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = safeHref(input.trim());
    if (!href) {
      window.alert("Use a web address starting with https://, an email (mailto:) or a page on this site (/about).");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  const tools: { icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; run: () => void }[] = editor && state
    ? [
        { icon: Heading2, label: "Heading", active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { icon: Heading3, label: "Subheading", active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
        { icon: Bold, label: "Bold", active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
        { icon: Italic, label: "Italic", active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
        { icon: List, label: "Bullet list", active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
        { icon: ListOrdered, label: "Numbered list", active: state.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
        { icon: Quote, label: "Quote (scripture)", active: state.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
        { icon: Link2, label: "Add link", active: state.link, run: setLink },
        { icon: Unlink, label: "Remove link", disabled: !state.link, run: () => editor.chain().focus().unsetLink().run() },
        { icon: Undo2, label: "Undo", disabled: !state.canUndo, run: () => editor.chain().focus().undo().run() },
        { icon: Redo2, label: "Redo", disabled: !state.canRedo, run: () => editor.chain().focus().redo().run() },
      ]
    : [];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-0.5 border-b border-border bg-subtle/60 p-1">
        {tools.map(({ icon: Icon, label: l, active, disabled, run }) => (
          <button
            key={l}
            type="button"
            onClick={run}
            disabled={disabled}
            aria-label={l}
            aria-pressed={active}
            title={l}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg disabled:opacity-40",
              active && "bg-surface text-primary shadow-sm",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
