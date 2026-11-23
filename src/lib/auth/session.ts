import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authGate, isMfaRequired, type GateResult } from "./gate";
import type { AppRole, PermissionSubject, RolePermissionRow } from "./permissions";

export type SessionUser = PermissionSubject & {
  id: string;
  email: string;
  fullName: string;
  requireMfa: boolean;
  mfaRequired: boolean;
  currentLevel: string | null;
  nextLevel: string | null;
  gate: Exclude<GateResult, "login">;
};

/**
 * The signed-in user with profile, permissions and MFA state, or null.
 * Verifies the JWT (getClaims), never trusts the cookie alone. Cached per request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (error || !claims?.sub) return null;

  const [{ data: profile }, { data: aal }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active, require_mfa")
      .eq("id", claims.sub)
      .maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const role: AppRole = profile?.role ?? "viewer";
  const isActive = profile?.is_active ?? false;
  const requireMfa = profile?.require_mfa ?? false;

  let permissions: RolePermissionRow[] = [];
  if (isActive && role !== "super_admin") {
    const { data } = await supabase.from("role_permissions").select("*").eq("role", role);
    permissions = data ?? [];
  }

  const currentLevel = (claims.aal as string | undefined) ?? aal?.currentLevel ?? null;
  const nextLevel = aal?.nextLevel ?? null;
  const gate = authGate({ hasUser: true, isActive, role, requireMfa, currentLevel, nextLevel });

  return {
    id: claims.sub,
    email: profile?.email ?? (claims.email as string | undefined) ?? "",
    fullName: profile?.full_name ?? "",
    role,
    isActive,
    requireMfa,
    mfaRequired: isMfaRequired(role, requireMfa),
    permissions,
    currentLevel,
    nextLevel,
    gate: gate === "login" ? "inactive" : gate,
  };
});

/** Where to send a user who can't use the dashboard yet. */
export function gateRedirectPath(gate: GateResult, next?: string): string | null {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  switch (gate) {
    case "ok": return null;
    case "login": return `/admin/login${q}`;
    case "inactive": return "/api/auth/signout?reason=inactive";
    case "mfa-verify":
    case "mfa-enroll": return `/admin/mfa${q}`;
  }
}

/**
 * Use at the top of every dashboard layout/page and every admin Server Action.
 * Redirects unless the user is signed in, active and has passed MFA where needed.
 */
export async function requireStaff(next?: string): Promise<SessionUser> {
  const user = await getSessionUser();
  const target = gateRedirectPath(user?.gate ?? "login", next);
  if (target || !user) redirect(target ?? "/admin/login");
  return user;
}
