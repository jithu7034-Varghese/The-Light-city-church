import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { PageEditor, type EditorSection } from "@/components/admin/cms/page-editor";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/slug";
import { getSectionDef } from "@/cms/registry";
import { seoFromRow } from "@/cms/seo";
import { loadMediaMap } from "../../cms-media";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[slug]">) {
  const { slug } = await params;
  const user = await requireStaff(`/admin/pages/${slug}`);
  if (!can(user, "pages", "view")) return <NoAccess what="the website pages" />;
  if (!isValidSlug(slug)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: page } = await supabase.from("pages").select("id, slug, title, seo_title, seo_description, seo_keywords, seo_image_url, updated_at").eq("slug", slug).maybeSingle();
  if (!page) notFound();
  const { data: rows } = await supabase.from("page_sections").select("id, type, schema_version, visible, data").eq("page_id", page.id).order("sort_order");

  const sections: EditorSection[] = (rows ?? []).map((r) => {
    const def = getSectionDef(r.type);
    // Upgrade + fill defaults so the editor always gets the current shape.
    const data = (def?.parse(r.data, r.schema_version) ?? (r.data as Record<string, unknown>)) as Record<string, unknown>;
    return { id: r.id, type: r.type, label: def?.label ?? r.type, description: def?.description, visible: r.visible, data, specs: def?.specs ?? null };
  });
  const canPublish = can(user, "pages", "edit") && can(user, "pages", "publish");

  return (
    <>
      <PageHeader
        title={page.title}
        description={canPublish ? "Edit any text, button or image, then Save & publish. Changes go live straight away." : "You can view this page's content. Publishing needs an Editor or Admin."}
        actions={<Link href="/admin/pages" className="text-sm text-muted hover:text-fg">← All pages</Link>}
      />
      {canPublish ? (
        <PageEditor
          page={{ id: page.id, slug: String(page.slug), title: page.title, updatedAt: page.updated_at, seo: seoFromRow(page) }}
          initialSections={sections}
          initialMedia={await loadMediaMap(sections.map((s) => s.data))}
          canUpload={can(user, "media", "edit")}
        />
      ) : (
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted">
          {sections.map((s) => <li key={s.id}>{s.label}{s.visible ? "" : " (hidden)"}</li>)}
        </ul>
      )}
    </>
  );
}
