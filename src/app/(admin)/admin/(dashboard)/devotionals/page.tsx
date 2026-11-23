import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus, Search } from "lucide-react";
import { Badge, buttonStyles, Card, EmptyState, Input, PageHeader, Select } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { formatDateTime } from "@/components/admin/format";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Devotionals" };
const PAGE_SIZE = 25;

export default async function DevotionalsAdminPage({ searchParams }: PageProps<"/admin/devotionals">) {
  const user = await requireStaff("/admin/devotionals");
  if (!can(user, "posts", "view")) return <NoAccess what="devotionals" />;

  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(sp.q).trim().slice(0, 100);
  const status = ["draft", "published"].includes(one(sp.status)) ? (one(sp.status) as "draft" | "published") : "";
  const pageNum = Math.min(Math.max(1, Number(one(sp.page)) || 1), 1000);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("posts")
    .select("id, title, slug, status, published_at, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);
  if (q) query = query.ilike("title", `%${q.replace(/[%_\\]/g, " ")}%`);
  if (status) query = query.eq("status", status);
  const { data: posts, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const link = (page: number) => `/admin/devotionals?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(page > 1 && { page: String(page) }) })}`;

  return (
    <>
      <PageHeader
        title="Devotionals"
        description={`${count ?? 0} devotional${count === 1 ? "" : "s"}`}
        actions={
          can(user, "posts", "edit") && (
            <Link href="/admin/devotionals/new" className={buttonStyles()}>
              <Plus className="size-4" aria-hidden /> New devotional
            </Link>
          )
        }
      />
      <Card className="mb-4 p-4">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input name="q" defaultValue={q} placeholder="Search titles…" aria-label="Search devotionals" className="pl-9" />
          </div>
          <Select name="status" defaultValue={status} aria-label="Status" className="sm:w-44">
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </Select>
          <button type="submit" className={buttonStyles("secondary")}>Filter</button>
        </form>
      </Card>
      <Card className="overflow-hidden">
        {!posts?.length ? (
          <EmptyState icon={BookOpen} title={q || status ? "No devotionals match" : "No devotionals yet"} description={q || status ? "Try a different search." : "Write the first one."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-subtle/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Title</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Published</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Last edited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-subtle/60">
                    <td className="max-w-0 px-4 py-3">
                      <Link href={`/admin/devotionals/${p.id}`} className="block truncate font-medium hover:underline">{p.title}</Link>
                      <span className="block truncate text-xs text-muted">/devotionals/{String(p.slug)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "Published" : p.status === "draft" ? "Draft" : "Scheduled"}</Badge>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-muted sm:table-cell">{p.published_at ? formatDateTime(p.published_at) : "—"}</td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-muted md:table-cell">{formatDateTime(p.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {pages > 1 && (
        <nav className="mt-4 flex items-center justify-between text-sm text-muted" aria-label="Pagination">
          <span>Page {pageNum} of {pages}</span>
          <div className="flex gap-2">
            {pageNum > 1 && <Link href={link(pageNum - 1)} className={buttonStyles("secondary", "sm")}>Previous</Link>}
            {pageNum < pages && <Link href={link(pageNum + 1)} className={buttonStyles("secondary", "sm")}>Next</Link>}
          </div>
        </nav>
      )}
    </>
  );
}
