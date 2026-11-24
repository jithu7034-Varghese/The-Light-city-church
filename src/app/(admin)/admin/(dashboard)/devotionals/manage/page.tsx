import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { CategoriesManager, AuthorsManager } from "@/components/admin/devotionals/taxonomy-managers";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAuthors, loadCategories } from "../load";

export const metadata: Metadata = { title: "Categories & authors" };

export default async function DevotionalTaxonomyPage() {
  const user = await requireStaff("/admin/devotionals/manage");
  if (!can(user, "posts", "view")) return <NoAccess what="devotionals" />;

  const supabase = await createSupabaseServerClient();
  const [categories, authors, { data: links }, { data: byAuthor }] = await Promise.all([
    loadCategories(),
    loadAuthors(),
    supabase.from("post_categories").select("category_id"),
    supabase.from("posts").select("author_id").not("author_id", "is", null),
  ]);
  const tally = (ids: (string | null)[]) => ids.reduce<Record<string, number>>((m, id) => (id ? ((m[id] = (m[id] ?? 0) + 1), m) : m), {});
  const categoryCounts = tally((links ?? []).map((l) => l.category_id));
  const authorCounts = tally((byAuthor ?? []).map((p) => p.author_id));
  const permissions = { edit: can(user, "posts", "edit"), remove: can(user, "posts", "delete"), upload: can(user, "media", "edit") };

  return (
    <>
      <PageHeader
        title="Categories & authors"
        description="Used to group devotionals on the website and to show who wrote them."
        actions={<Link href="/admin/devotionals" className="text-sm text-muted hover:text-fg">← All devotionals</Link>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoriesManager categories={categories.map((c) => ({ ...c, count: categoryCounts[c.id] ?? 0 }))} permissions={permissions} />
        <AuthorsManager authors={authors.map((a) => ({ ...a, count: authorCounts[a.id] ?? 0 }))} permissions={permissions} />
      </div>
    </>
  );
}
