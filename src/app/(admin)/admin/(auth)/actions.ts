"use server";
// Self-service auth actions. These act on the caller's own account, so there is no
// module permission to check with can(); instead each one validates with Zod, requires
// the right session state, and logs to the activity log where a staff session exists.
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { MIN_PASSWORD_LENGTH, safeAdminRedirect } from "@/lib/auth/gate";
import { logActivity } from "@/lib/activity";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

const newPassword = z
  .object({
    password: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`).max(128),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

// ---------- Sign in ----------
const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  next: z.string().optional(),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error || !data.user) {
    // Same message for unknown email and wrong password (no account enumeration).
    return { error: "Incorrect email or password." };
  }

  const { data: profile } = await supabase.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "This account isn't active. Please ask an administrator to give you access." };
  }

  await logActivity({ actorId: data.user.id, action: "login", module: "users", entityType: "session", summary: "Signed in" });
  // The dashboard layout sends the user on to /admin/mfa if 2FA is needed.
  redirect(safeAdminRedirect(parsed.data.next));
}

// ---------- Sign out ----------
export async function signOut(): Promise<void> {
  const user = await getSessionUser();
  if (user?.isActive) {
    await logActivity({ actorId: user.id, action: "logout", module: "users", entityType: "session", summary: "Signed out" });
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

/** "Sign out everywhere": revokes every session of this user on all devices. */
export async function signOutEverywhere(): Promise<void> {
  const user = await getSessionUser();
  if (user?.isActive) {
    await logActivity({ actorId: user.id, action: "logout", module: "users", entityType: "session", summary: "Signed out of all devices" });
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}

// ---------- Forgotten password ----------
const requestResetSchema = z.object({ email });

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = requestResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/admin/reset-password`,
  });
  if (error && error.status === 429) {
    return { error: "Too many requests. Please wait a few minutes and try again." };
  }
  if (error) console.error("resetPasswordForEmail failed", error.message);
  // Same answer whether or not the account exists.
  return { success: "If that email belongs to a staff account, we've sent a link to reset the password. It expires in 1 hour." };
}

// ---------- Set a new password (after the reset link) ----------
export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = newPassword.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const user = await getSessionUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };
  if (!user.isActive) return { error: "This account isn't active." };
  if (user.gate === "mfa-verify") redirect("/admin/mfa?next=/admin/reset-password");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: passwordError(error.message) };

  await logActivity({ actorId: user.id, action: "update", module: "users", entityType: "profile", entityId: user.id, summary: "Changed password" });
  redirect("/admin");
}

// ---------- Accept an invite ----------
const acceptInviteSchema = z
  .object({ fullName: z.string().trim().min(2, "Enter your name").max(120) })
  .and(newPassword);

export async function acceptInvite(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = acceptInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const user = await getSessionUser();
  if (!user) return { error: "Your invite link has expired. Ask an administrator to send a new one." };
  if (!user.isActive) return { error: "This account isn't active. Ask an administrator to send a new invite." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { full_name: parsed.data.fullName },
  });
  if (error) return { error: passwordError(error.message) };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);
  if (profileError) return { error: "Your password was saved, but we couldn't save your name. Try again from your profile." };

  await logActivity({ actorId: user.id, action: "update", module: "users", entityType: "profile", entityId: user.id, summary: "Accepted invite" });
  redirect("/admin"); // admins continue to 2FA setup from here
}

// ---------- MFA ----------
/** Called by the MFA page after a successful TOTP enrol or challenge (which happen in the browser). */
export async function recordMfaEvent(kind: "enrolled" | "verified"): Promise<void> {
  if (kind !== "enrolled" && kind !== "verified") return;
  const user = await getSessionUser();
  if (!user?.isActive || user.currentLevel !== "aal2") return;
  await logActivity({
    actorId: user.id,
    action: kind === "enrolled" ? "update" : "login",
    module: "users",
    entityType: kind === "enrolled" ? "mfa_factor" : "session",
    entityId: user.id,
    summary: kind === "enrolled" ? "Set up two-factor authentication" : "Verified two-factor code",
  });
}

function passwordError(message: string): string {
  if (/same|different from the old/i.test(message)) return "Choose a password you haven't used before.";
  if (/weak|pwned|leaked|characters/i.test(message)) return "That password is too easy to guess. Try a longer one.";
  return "We couldn't save that password. Please try again.";
}
