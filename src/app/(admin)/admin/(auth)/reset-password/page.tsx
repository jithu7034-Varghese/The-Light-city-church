import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLinkHandler } from "@/components/admin/auth-link-handler";
import { getSessionUser } from "@/lib/auth/session";
import { RequestResetForm, SetPasswordForm } from "./forms";

export const metadata: Metadata = { title: "Reset password" };

// Two modes: without a session, ask for the email. With a session (the user arrived via the
// reset link, or is signed in), set a new password. The reset link arrives either via
// /api/auth/confirm (custom template) or here with ?code= (default template), which
// AuthLinkHandler exchanges for a session.
export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (user?.isActive && user.gate === "mfa-verify") redirect("/admin/mfa?next=/admin/reset-password");

  return (
    <AuthLinkHandler retryHref="/admin/reset-password" retryLabel="Request a new reset link">
      {user?.isActive ? (
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1>
            <p className="text-sm text-muted">For {user.email}</p>
          </div>
          <SetPasswordForm />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Reset your password</h1>
            <p className="text-sm text-muted">We&apos;ll email you a link to choose a new one.</p>
          </div>
          <RequestResetForm />
          <p className="text-center text-sm">
            <Link href="/admin/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      )}
    </AuthLinkHandler>
  );
}
