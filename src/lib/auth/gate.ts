// Pure auth decisions, kept free of Next/Supabase imports so they are unit-tested
// (tests/auth-gate.test.ts) and shared by the proxy, layouts and Server Actions.
import type { AppRole } from "./permissions";

/** Signed-in users are signed out after this much inactivity (docs/ARCHITECTURE.md §13). */
export const IDLE_TIMEOUT_MINUTES = 30;

/** Minimum password length for staff accounts. */
export const MIN_PASSWORD_LENGTH = 12;

/**
 * Paths under /admin that work without a session. Everything else under /admin needs one.
 * accept-invite and reset-password are public because Supabase's default email links deliver
 * the session in the URL hash (#access_token=…) or as ?code=, which only the browser can
 * turn into a session (see AuthLinkHandler). The pages show nothing private without one.
 */
export const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset-password", "/admin/accept-invite"] as const;

export function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Master switch for authenticator-app (TOTP) 2FA on the admin. While false, nobody is asked
 * to enrol or to enter a code: email + password is enough, even for accounts that already
 * have a factor. Set back to true to turn 2FA on again.
 */
export const MFA_ENABLED = false;

/** Super Admins and Admins must use TOTP 2FA; anyone else can be required to via profiles.require_mfa. */
export function isMfaRequired(role: AppRole, requireMfa: boolean, mfaEnabled = MFA_ENABLED): boolean {
  if (!mfaEnabled) return false;
  return requireMfa || role === "super_admin" || role === "admin";
}

export type GateInput = {
  hasUser: boolean;
  isActive: boolean;
  role: AppRole;
  requireMfa: boolean;
  /** Assurance level of the current session (from the JWT `aal` claim). */
  currentLevel: string | null;
  /** aal2 when the user has a verified factor, so the session can be stepped up. */
  nextLevel: string | null;
};

export type GateResult = "ok" | "login" | "inactive" | "mfa-verify" | "mfa-enroll";

/**
 * What a request to the dashboard should do. A user with a verified factor must always
 * complete the challenge (even when 2FA is optional for their role), otherwise a stolen
 * password alone would be enough.
 */
export function authGate(input: GateInput, mfaEnabled = MFA_ENABLED): GateResult {
  if (!input.hasUser) return "login";
  if (!input.isActive) return "inactive";
  if (!mfaEnabled) return "ok";
  if (input.currentLevel === "aal2") return "ok";
  if (input.nextLevel === "aal2") return "mfa-verify";
  if (isMfaRequired(input.role, input.requireMfa, mfaEnabled)) return "mfa-enroll";
  return "ok";
}

/**
 * Only allow redirects back into the admin on this origin. Anything else (absolute URLs,
 * protocol-relative "//evil.com", backslash tricks) falls back to the dashboard.
 */
export function safeAdminRedirect(next: string | null | undefined, fallback = "/admin"): string {
  if (!next || typeof next !== "string") return fallback;
  if (!next.startsWith("/admin")) return fallback;
  if (next.startsWith("//") || next.includes("\\") || /[\u0000-\u001f]/.test(next)) return fallback;
  const rest = next.slice("/admin".length);
  if (rest !== "" && !rest.startsWith("/") && !rest.startsWith("?")) return fallback; // e.g. /administrator
  return next;
}
