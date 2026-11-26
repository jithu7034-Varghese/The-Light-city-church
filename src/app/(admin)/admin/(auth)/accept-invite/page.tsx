import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/admin/ui";
import { AuthLinkHandler } from "@/components/admin/auth-link-handler";
import { getSessionUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { AcceptInviteForm } from "./form";

export const metadata: Metadata = { title: "Accept invite" };

// Reached from the invite email in one of two ways:
//  - default Supabase template: lands here with #access_token=… → AuthLinkHandler signs in
//  - our custom template: /api/auth/confirm has already signed the user in
export default async function AcceptInvitePage() {
  const user = await getSessionUser();
  if (user && !user.isActive) redirect("/api/auth/signout?reason=inactive");

  return (
    <AuthLinkHandler retryHref="/admin/login" retryLabel="Go to sign in (ask an administrator to resend your invite)">
      {user ? (
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Welcome to the team</h1>
            <p className="text-sm text-muted">
              You&apos;ve been invited as <strong className="font-medium text-fg">{ROLE_LABELS[user.role]}</strong>. Set
              up your account for {user.email}.
            </p>
          </div>
          <AcceptInviteForm defaultName={user.fullName} />
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-xl font-semibold tracking-tight">Accept your invite</h1>
          <Alert tone="info">Open the link in your invite email to set up your account. If it has expired, ask an administrator to send a new one.</Alert>
          <Link href="/admin/login" className="block text-center text-sm font-medium text-primary hover:underline">Go to sign in</Link>
        </div>
      )}
    </AuthLinkHandler>
  );
}
