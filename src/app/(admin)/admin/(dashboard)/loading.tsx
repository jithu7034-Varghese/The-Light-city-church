// Shown instantly while an admin page checks the session and loads its data.
import { Skeleton } from "@/components/admin/ui";

export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
