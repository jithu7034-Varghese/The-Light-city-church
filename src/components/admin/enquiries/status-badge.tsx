import { Lock } from "lucide-react";
import { Badge } from "../ui/feedback";
import { STATUS_LABELS, type EnquiryStatus } from "@/lib/enquiries/filters";

const TONES = { unread: "info", read: "neutral", follow_up: "warning", closed: "success" } as const;

export function StatusBadge({ status }: { status: EnquiryStatus }) {
  return <Badge tone={TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function PrivateBadge() {
  return (
    <Badge tone="danger" className="gap-1" title="Private (prayer or salvation): only staff with private-enquiry access can see this">
      <Lock className="size-3" aria-hidden /> Private
    </Badge>
  );
}
