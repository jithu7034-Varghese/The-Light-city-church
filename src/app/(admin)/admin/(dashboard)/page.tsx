import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, HeartHandshake, Inbox, Mail, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/admin/ui";
import { cn } from "@/components/admin/ui/cn";
import { GrowthChart } from "@/components/admin/overview/growth-chart";
import { PrivateBadge, StatusBadge } from "@/components/admin/enquiries/status-badge";
import { formatDateTime } from "@/components/admin/format";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bucketCounts, parseRange, RANGES } from "@/lib/overview";

export const metadata: Metadata = { title: "Overview" };

type ActionItem = { text: string; count: number; href?: string };

/** Request-time timestamps for the queries (this page is rendered per request). */
function timeBounds() {
  const now = new Date();
  return {
    nowIso: now.toISOString(),
    twoDaysAgo: new Date(now.getTime() - 48 * 3600_000).toISOString(),
  };
}

export default async function OverviewPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireStaff("/admin");
  const range = parseRange((await searchParams).range);
  const supabase = await createSupabaseServerClient();
  const firstName = user.fullName.split(" ")[0] || "there";

  const canEnquiries = can(user, "enquiries", "view");
  const canPosts = can(user, "posts", "view");
  const canBookings = can(user, "bookings", "view");
  const canPages = can(user, "pages", "view");
  const { nowIso, twoDaysAgo } = timeBounds();

  // Every count runs as the user, so RLS decides what's counted (prayer requests only
  // for the prayer team). head:true = count only, no rows transferred.
  const count = async (q: PromiseLike<{ count: number | null }>, allowed: boolean) => (allowed ? ((await q).count ?? 0) : null);
  const enquiries = () => supabase.from("enquiries").select("id", { count: "exact", head: true });

  // Prayer requests are private: only counted for staff with the `sensitive` permission.
  const canPrivate = canEnquiries && can(user, "enquiries", "sensitive");

  const [
    total, unread, published, pendingBookings, chart, recent, forms,
    staleUnread, myFollowUps, unassignedPrivate, draftPages, openPrayer,
  ] = await Promise.all([
    count(enquiries(), canEnquiries),
    count(enquiries().eq("status", "unread"), canEnquiries),
    count(
      supabase.from("posts").select("id", { count: "exact", head: true })
        .or(`status.eq.published,and(status.eq.scheduled,published_at.lte.${nowIso})`),
      canPosts,
    ),
    count(supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "requested"), canBookings),
    canEnquiries ? supabase.rpc("enquiry_daily_counts", { p_days: range }) : Promise.resolve({ data: null }),
    canEnquiries
      ? supabase.from("enquiries").select("id, name, email, type, status, is_sensitive, form_id, created_at").order("created_at", { ascending: false }).limit(6)
      : Promise.resolve({ data: null }),
    supabase.from("forms").select("id, name, slug"),
    count(enquiries().eq("status", "unread").lt("created_at", twoDaysAgo), canEnquiries),
    count(enquiries().eq("status", "follow_up").eq("assigned_to", user.id), canEnquiries),
    count(enquiries().eq("is_sensitive", true).is("assigned_to", null).neq("status", "closed"), canPrivate),
    count(supabase.from("pages").select("id", { count: "exact", head: true }).eq("has_unpublished_changes", true), canPages),
    count(enquiries().eq("type", "prayer").neq("status", "closed"), canPrivate),
  ]);

  const formName = new Map((forms.data ?? []).map((f) => [f.id, f.name]));
  const prayerFormId = forms.data?.find((f) => f.slug === "prayer")?.id;

  const actionItems: ActionItem[] = [
    { text: "unread enquiries waiting more than 2 days", count: staleUnread ?? 0, href: "/admin/enquiries?status=unread" },
    { text: "follow-ups assigned to you", count: myFollowUps ?? 0, href: "/admin/enquiries?status=follow_up&assignee=me" },
    {
      text: "private prayer & salvation messages with nobody assigned",
      count: unassignedPrivate ?? 0,
      href: "/admin/enquiries?assignee=none",
    },
    { text: "consultation requests awaiting a reply", count: pendingBookings ?? 0 }, // Bookings screen arrives in R2
    { text: "pages with unpublished changes", count: draftPages ?? 0 }, // Pages screen arrives in Phase 4
  ].filter((i) => i.count > 0);

  return (
    <>
      <PageHeader title={`Welcome, ${firstName}`} description="Here's what's happening at The Light City Church." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Enquiries" caption="Lifetime" value={total} icon={Inbox} href={canEnquiries ? "/admin/enquiries" : undefined} />
        <StatCard label="Unread" caption="Attention needed" value={unread} icon={Mail} attention={(unread ?? 0) > 0} href={canEnquiries ? "/admin/enquiries?status=unread" : undefined} />
        <StatCard label="Devotionals" caption="Published" value={published} icon={BookOpen} />
        <StatCard
          label="Open Prayer Requests"
          caption="Attention needed"
          value={openPrayer}
          icon={HeartHandshake}
          attention={(openPrayer ?? 0) > 0}
          href={canPrivate && prayerFormId ? `/admin/enquiries?form=${prayerFormId}` : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3 sm:flex-row">
            <div className="space-y-1">
              <CardTitle>Growth Trajectory</CardTitle>
              <CardDescription>Enquiries received from the website</CardDescription>
            </div>
            <nav aria-label="Chart range" className="flex shrink-0 rounded-lg border border-border bg-subtle p-0.5 text-xs font-medium">
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={`/admin?range=${r}`}
                  scroll={false}
                  aria-current={r === range ? "true" : undefined}
                  className={cn("rounded-md px-2.5 py-1 text-muted hover:text-fg", r === range && "bg-surface text-fg shadow-sm")}
                >
                  {r} days
                </Link>
              ))}
            </nav>
          </CardHeader>
          <CardContent>
            {chart.data ? (
              <GrowthChart buckets={bucketCounts(chart.data, range)} range={range} />
            ) : (
              <EmptyState title="Not available for your role" description="The chart shows enquiry numbers, which your role can't see." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Things that need someone&apos;s attention</CardDescription>
          </CardHeader>
          <CardContent>
            {actionItems.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="All clear" description="Nothing needs attention right now." />
            ) : (
              <ul className="divide-y divide-border">
                {actionItems.map((item) => {
                  const body = (
                    <>
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-warning-soft text-xs font-semibold text-warning tabular-nums">
                        {item.count}
                      </span>
                      <span className="flex-1 text-sm">{item.text}</span>
                      {item.href && <ArrowRight className="size-4 text-muted" aria-hidden />}
                    </>
                  );
                  return (
                    <li key={item.text}>
                      {item.href ? (
                        <Link href={item.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-subtle">{body}</Link>
                      ) : (
                        <div className="flex items-center gap-3 py-2.5">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {canEnquiries && (
        <Card className="mt-4 overflow-hidden">
          <CardHeader className="flex-row items-center justify-between sm:flex-row">
            <CardTitle>Recent Enquiries</CardTitle>
            <Link href="/admin/enquiries" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </CardHeader>
          {recent.data && recent.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-subtle/60 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium">From</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Form</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                    <th scope="col" className="hidden px-5 py-2.5 font-medium md:table-cell">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recent.data.map((r) => (
                    <tr key={r.id} className="hover:bg-subtle/60">
                      <td className="max-w-0 px-5 py-3">
                        <Link href={`/admin/enquiries?open=${r.id}`} className={cn("block truncate hover:underline", r.status === "unread" && "font-semibold")}>
                          {r.name || r.email || "No name"}
                        </Link>
                      </td>
                      <td className="hidden px-3 py-3 sm:table-cell">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          {(r.form_id && formName.get(r.form_id)) || r.type}
                          {r.is_sensitive && <PrivateBadge />}
                        </span>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-muted md:table-cell">{formatDateTime(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <CardContent>
              <EmptyState icon={Inbox} title="No enquiries yet" description="Messages from the website's forms will appear here." />
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
}

function StatCard({
  label,
  caption,
  value,
  icon: Icon,
  attention = false,
  href,
}: {
  label: string;
  caption: string;
  value: number | null;
  icon: LucideIcon;
  attention?: boolean;
  href?: string;
}) {
  const content = (
    <Card className={cn("h-full p-5", href && "transition-colors hover:border-primary/40")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <Icon className="size-4 text-muted" aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value === null ? "—" : value.toLocaleString("en-GB")}</p>
      <p className={cn("mt-1 text-xs font-semibold uppercase tracking-wide", attention ? "text-warning" : "text-muted")}>
        {value === null ? "Not in your role" : caption}
      </p>
    </Card>
  );
  return href ? <Link href={href} className="block rounded-xl">{content}</Link> : content;
}
