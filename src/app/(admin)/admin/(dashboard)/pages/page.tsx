import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { formatDateTime } from "@/components/admin/format";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pages" };

export default async function PagesAdminPage() {
  const user = await requireStaff("/admin/pages");
  if (!can(user, "pages", "view")) return <NoAccess what="the website pages" />;
  const supabase = await createSupabaseServerClient();
  const { data: pages } = await supabase.from("pages").select("id, slug, title, status, published_at, sort_order").order("sort_order").order("title");

  return (
    <>
      <PageHeader title="Pages" description="Edit the text, buttons and images on each page of the website." />
      <Card className="overflow-hidden">
        {!pages?.length ? (
          <EmptyState icon={FileText} title="No pages yet" description="Run the pages seed to create the website's pages." />
        ) : (
          <ul className="divide-y divide-border">
            {pages.map((p) => {
              const path = p.slug === "home" ? "/" : `/${p.slug}`;
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-subtle/60">
                  <FileText className="size-4 text-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/pages/${p.slug}`} className="block truncate font-medium hover:underline">{p.title}</Link>
                    <span className="text-xs text-muted">{path}{p.published_at ? ` · published ${formatDateTime(p.published_at)}` : ""}</span>
                  </div>
                  <Badge tone={p.status === "published" ? "success" : "neutral"}>{p.status === "published" ? "Live" : "Draft"}</Badge>
                  <a href={path} target="_blank" rel="noopener" className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-fg" aria-label={`View ${p.title} on the website`}>
                    <ExternalLink className="size-4" />
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
