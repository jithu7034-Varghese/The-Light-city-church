import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { safeAdminRedirect } from "@/lib/auth/gate";
import { signOut } from "../actions";
import { MfaChallenge, MfaEnroll } from "./mfa-forms";

export const metadata: Metadata = { title: "Two-factor authentication" };

export default async function MfaPage({ searchParams }: PageProps<"/admin/mfa">) {
  await connection(); // session-checked: always per request
  const params = await searchParams;
  const next = safeAdminRedirect(typeof params.next === "string" ? params.next : undefined);

  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (user.gate === "inactive") redirect("/api/auth/signout?reason=inactive");
  if (user.gate === "ok") redirect(next);

  return (
    <div className="space-y-5">
      {user.gate === "mfa-enroll" ? (
        <>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Set up two-factor authentication</h1>
            <p className="text-sm text-muted">
              Your role needs a second step when signing in. Scan the code with an authenticator app such as Google
              Authenticator, Microsoft Authenticator or 1Password, then enter the 6-digit code it shows.
            </p>
          </div>
          <MfaEnroll next={next} />
        </>
      ) : (
        <>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Enter your code</h1>
            <p className="text-sm text-muted">Open your authenticator app and enter the 6-digit code for The Light City Church.</p>
          </div>
          <MfaChallenge next={next} />
        </>
      )}
      <form action={signOut} className="text-center">
        <button type="submit" className="text-sm font-medium text-muted hover:text-fg hover:underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
