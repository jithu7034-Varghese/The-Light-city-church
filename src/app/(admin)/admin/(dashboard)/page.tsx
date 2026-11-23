import type { Metadata } from "next";
import { BarChart3, Inbox, ListChecks } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Overview" };

// Phase 1 placeholder. Phase 2 fills this with stats, the enquiries chart,
// action items and the recent enquiries table.
export default async function OverviewPage() {
  const user = await requireStaff("/admin");
  const firstName = user.fullName.split(" ")[0] || "there";

  return (
    <>
      <PageHeader title={`Welcome, ${firstName}`} description="Here's what's happening at The Light City Church." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>New enquiries</CardTitle>
            <CardDescription>Contact, prayer and volunteer forms</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={Inbox} title="No enquiries yet" description="Messages from the website's forms will appear here." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Action items</CardTitle>
            <CardDescription>Things that need someone&apos;s attention</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={ListChecks} title="All clear" description="Unanswered enquiries and drafts waiting to publish will be listed here." />
          </CardContent>
        </Card>
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Activity this month</CardTitle>
            <CardDescription>Enquiries over time</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState icon={BarChart3} title="No data yet" description="A chart appears once the forms start receiving submissions." />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
