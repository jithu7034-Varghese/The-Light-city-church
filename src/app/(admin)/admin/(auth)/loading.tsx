// Shown instantly while a sign-in page checks the session.
import { Spinner } from "@/components/admin/ui";

export default function AuthLoading() {
  return (
    <div className="flex justify-center py-10 text-muted" role="status" aria-label="Loading">
      <Spinner className="size-6" />
    </div>
  );
}
