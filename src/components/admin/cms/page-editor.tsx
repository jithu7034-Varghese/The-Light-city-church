"use client";
import { useState, useTransition } from "react";
import { ChevronDown, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Alert, Badge, Button, buttonStyles, Card, toast } from "../ui";
import { SeoFields } from "../seo-fields";
import type { SeoValue } from "@/cms/seo";
import { cn } from "../ui/cn";
import { FieldsEditor, type MediaMap } from "./fields-editor";
import { savePage } from "@/cms/actions/pages";
import type { FieldSpec } from "@/cms/fields";

export type EditorSection = {
  id: string;
  type: string;
  label: string;
  description?: string;
  visible: boolean;
  data: Record<string, unknown>;
  specs: Record<string, FieldSpec> | null; // null = unknown section type (read-only)
};

export function PageEditor({
  page,
  initialSections,
  initialMedia,
  canUpload,
}: {
  page: { id: string; slug: string; title: string; updatedAt: string; seo: SeoValue };
  initialSections: EditorSection[];
  initialMedia: MediaMap;
  canUpload: boolean;
}) {
  const [sections, setSections] = useState(initialSections);
  const [seo, setSeo] = useState(page.seo);
  const [media, setMedia] = useState(initialMedia);
  const [updatedAt, setUpdatedAt] = useState(page.updatedAt);
  const [open, setOpen] = useState<string | null>(initialSections[0]?.id ?? null);
  const [dirty, setDirty] = useState(false);
  const [errorSection, setErrorSection] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const path = page.slug === "home" ? "/" : `/${page.slug}`;

  const update = (id: string, patch: Partial<EditorSection>) => {
    setDirty(true);
    setSections((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  function publish() {
    setErrorSection(null);
    startTransition(async () => {
      const r = await savePage({
        pageId: page.id,
        expectedUpdatedAt: updatedAt,
        seo,
        sections: sections.filter((s) => s.specs).map((s) => ({ id: s.id, visible: s.visible, data: s.data })),
      });
      if (!r.ok) {
        if (r.sectionId) {
          setErrorSection(r.sectionId);
          setOpen(r.sectionId);
        }
        toast.error(r.error);
        return;
      }
      setUpdatedAt(r.updatedAt);
      setDirty(false);
      toast.success(`${page.title} published`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-10 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <span className="text-sm text-muted">{dirty ? "Unsaved changes" : "All changes published"}</span>
        <div className="ml-auto flex gap-2">
          <a href={path} target="_blank" rel="noopener" className={buttonStyles("ghost", "sm")}>
            View page <ExternalLink className="size-3.5" aria-hidden />
          </a>
          <Button onClick={publish} loading={pending} disabled={!dirty}>Save &amp; publish</Button>
        </div>
      </div>

      <Alert tone="info">Sections stay in a fixed order. Hide a section to take it off the page without losing its content.</Alert>

      <ol className="space-y-3">
        {sections.map((s, i) => {
          const isOpen = open === s.id;
          return (
            <li key={s.id}>
              <Card className={cn("overflow-hidden", errorSection === s.id && "border-danger", !s.visible && "opacity-70")}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button type="button" className="flex flex-1 items-center gap-3 text-left" onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen}>
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-subtle text-xs font-semibold text-muted">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{s.label}</span>
                      {s.description && <span className="block truncate text-xs text-muted">{s.description}</span>}
                    </span>
                    <ChevronDown className={cn("ml-auto size-4 text-muted transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                  {!s.visible && <Badge>Hidden</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => update(s.id, { visible: !s.visible })} aria-label={s.visible ? `Hide ${s.label}` : `Show ${s.label}`}>
                    {s.visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
                    {s.visible ? "Shown" : "Hidden"}
                  </Button>
                </div>
                {isOpen && (
                  <div className="border-t border-border px-4 py-4">
                    {s.specs ? (
                      <FieldsEditor
                        specs={s.specs}
                        value={s.data}
                        onChange={(data) => update(s.id, { data })}
                        media={media}
                        onMedia={(id, item) => setMedia((m) => ({ ...m, [id]: item }))}
                        canUpload={canUpload}
                        idPrefix={s.id}
                      />
                    ) : (
                      <p className="text-sm text-muted">This section type ({s.type}) can&apos;t be edited here.</p>
                    )}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      <Card className="space-y-4 p-4">
        <h2 className="font-semibold">Search &amp; sharing</h2>
        <SeoFields
          value={seo}
          onChange={(next) => { setDirty(true); setSeo(next); }}
          canUpload={canUpload}
          fallbackTitle={page.slug === "home" ? "The Light City Church" : `${page.title} | The Light City Church`}
        />
      </Card>
    </div>
  );
}
