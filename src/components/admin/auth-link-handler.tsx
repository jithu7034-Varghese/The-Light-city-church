"use client";
// Turns a Supabase DEFAULT email link (session in the #hash, or ?code=) into a cookie session,
// then re-renders the page on the server, which now sees the signed-in user.
// Needed because a new Supabase project can't use custom email templates until custom SMTP
// is set up; our token_hash route (/api/auth/confirm) handles the custom-template links.
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Alert, Spinner } from "./ui";
import { cleanEmailLinkUrl, friendlyLinkError, readEmailLink } from "@/lib/auth/email-link";
import type { Database } from "@/lib/supabase/database.types";

type State = { kind: "idle" } | { kind: "working" } | { kind: "error"; message: string };

/**
 * A dedicated client with URL detection OFF: the shared browser client uses the PKCE flow and
 * rejects implicit-flow (#access_token) links, so we handle both kinds explicitly here.
 */
function linkClient() {
  return createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    isSingleton: false,
    auth: { detectSessionInUrl: false },
  });
}

export function AuthLinkHandler({
  children,
  retryHref,
  retryLabel,
}: {
  children: React.ReactNode;
  /** Where to send people whose link failed. */
  retryHref: string;
  retryLabel: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [refreshing, startRefresh] = useTransition();

  useEffect(() => {
    const link = readEmailLink(window.location.href);
    if (link.kind === "none") return;
    const clean = cleanEmailLinkUrl(window.location.href);

    void (async () => {
      if (link.kind === "error") {
        window.history.replaceState(null, "", clean);
        setState({ kind: "error", message: friendlyLinkError(link.code) });
        return;
      }
      setState({ kind: "working" });
      const supabase = linkClient();
      const { error } =
        link.kind === "tokens"
          ? await supabase.auth.setSession({ access_token: link.accessToken, refresh_token: link.refreshToken })
          : await supabase.auth.exchangeCodeForSession(link.code);
      window.history.replaceState(null, "", clean); // tokens/codes never stay in the address bar
      if (error) {
        setState({
          kind: "error",
          message:
            link.kind === "code"
              ? "This link has expired, was already used, or was opened in a different browser from the one you asked for it in."
              : friendlyLinkError(null),
        });
        return;
      }
      // Session cookie is set: let the server render the signed-in version of the page.
      startRefresh(() => {
        router.refresh();
        setState({ kind: "idle" });
      });
    })();
  }, [router]);

  if (state.kind === "working" || refreshing) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted" role="status">
        <Spinner className="size-6" />
        Signing you in…
      </div>
    );
  }
  if (state.kind === "error") {
    return (
      <div className="space-y-4">
        <Alert tone="warning">{state.message}</Alert>
        <Link href={retryHref} className="block text-center text-sm font-medium text-primary hover:underline">
          {retryLabel}
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
