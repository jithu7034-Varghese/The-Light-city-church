import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { AcceptInviteForm } from "./form";

export const metadata: Metadata = { title: "Accept invite" };

// Reached from the invite email via /api/auth/confirm, which has already signed the user in.
export default async function AcceptInvitePage() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login?error=link-expired");
  if (!user.isActive) redirect("/api/auth/signout?reason=inactive");

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Welcome to the team</h1>
        <p className="text-sm text-muted">
          You&apos;ve been invited as <strong className="font-medium text-fg">{ROLE_LABELS[user.role]}</strong>. Set up
          your account for {user.email}.
        </p>
      </div>
      <AcceptInviteForm defaultName={user.fullName} />
    </div>
  );
}
