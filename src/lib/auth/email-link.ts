// Reads what a Supabase email link left in the URL. Pure; unit-tested.
//
// With the DEFAULT email templates ({{ .ConfirmationURL }}), Supabase verifies the link itself
// and redirects to our redirectTo with either:
//   - #access_token=…&refresh_token=…&type=invite   (implicit flow: admin invites)
//   - ?code=…                                         (PKCE flow: password reset from our server)
//   - #error=…&error_code=otp_expired&error_description=…  (expired / used link)
// With our custom templates, links go to /api/auth/confirm?token_hash=… instead.

export type EmailLinkResult =
  | { kind: "none" }
  | { kind: "error"; code: string | null; message: string }
  | { kind: "tokens"; accessToken: string; refreshToken: string; type: string | null }
  | { kind: "code"; code: string };

export function readEmailLink(href: string): EmailLinkResult {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const pick = (key: string) => hash.get(key) ?? url.searchParams.get(key);

  const error = pick("error") ?? pick("error_code") ?? pick("error_description");
  if (error) {
    return { kind: "error", code: pick("error_code"), message: pick("error_description") ?? error };
  }
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "tokens", accessToken, refreshToken, type: hash.get("type") };
  }
  const code = url.searchParams.get("code");
  if (code) return { kind: "code", code };
  return { kind: "none" };
}

/** The same URL with every auth parameter removed (so tokens don't linger in history). */
export function cleanEmailLinkUrl(href: string): string {
  const url = new URL(href);
  for (const k of ["code", "error", "error_code", "error_description", "type", "token_hash"]) url.searchParams.delete(k);
  url.hash = "";
  return url.pathname + (url.searchParams.size ? `?${url.searchParams}` : "");
}

export function friendlyLinkError(code: string | null): string {
  if (code === "otp_expired") return "This link has expired or has already been used.";
  if (code === "access_denied") return "This link isn't valid any more.";
  return "We couldn't sign you in with this link.";
}
