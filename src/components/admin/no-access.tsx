import { ShieldAlert } from "lucide-react";
import { Card } from "./ui/card";
import { EmptyState } from "./ui/feedback";

/** Shown instead of a page when the signed-in user's role doesn't allow it. */
export function NoAccess({ what = "this page" }: { what?: string }) {
  return (
    <Card>
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access"
        description={`Your role doesn't include ${what}. Ask a Super Admin if you need it.`}
      />
    </Card>
  );
}
