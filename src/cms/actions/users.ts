"use server";
// Staff invites and access (Super Admin only). Supabase's invite and ban APIs need the
// service role (docs/ARCHITECTURE.md §7: "invites"); profile changes are made as the
// signed-in Super Admin so the DB guard + profiles audit trigger see who did it. Only
// "resend invite" (no table change) calls logActivity().
import { refresh } from "next/cache";
import { z } from "zod";
import { requireStaff, type SessionUser } from "@/lib/auth/session";
import { can, INVITABLE_ROLES, ROLE_LABELS } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserActionResult = { ok: true; message: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const NO_PERMISSION: UserActionResult = { ok: false, error: "Only a Super Admin can manage staff accounts." };
const INVALID: UserActionResult = { ok: false, error: "Something about that request wasn't valid." };
/** "Deactivated" = a ban far in the future; it stops session refresh (the DB already blocks inactive profiles). */
const BAN_FOREVER = "876000h";

async function requireSuperAdmin(): Promise<SessionUser | null> {
  const user = await requireStaff();
  return user.role === "super_admin" && can(user, "users", "edit") ? user : null;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  fullName: z.string().trim().min(2, "Enter their name").max(120),
  role: z.enum(INVITABLE_ROLES, { error: "Choose a role" }),
});

export async function inviteStaff(input: { email: string; fullName: string; role: string }): Promise<UserActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const actor = await requireSuperAdmin();
  if (!actor) return NO_PERMISSION;
  const { email, fullName, role } = parsed.data;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl()}/admin/accept-invite`,
  });
  if (error || !data.user) {
    if (/already.*registered|already exists/i.test(error?.message ?? "")) {
      return { ok: false, error: "Someone with that email already has an account.", fieldErrors: { email: "Already has an account" } };
    }
    console.error("[inviteStaff] invite failed", error?.message);
    return { ok: false, error: "Couldn't send the invite. Please try again." };
  }

  // inviteUserByEmail can't set app_metadata, so the new profile starts inactive (by design:
  // see handle_new_user). Record the role in app_metadata (service role), then set the
  // profile's role + active flag AS THE SUPER ADMIN, so the profiles audit trigger records
  // who granted access (that's the activity-log entry; no logActivity() here).
  const userId = data.user.id;
  const supabase = await createSupabaseServerClient();
  const [{ error: metaError }, { error: profileError }] = await Promise.all([
    admin.auth.admin.updateUserById(userId, { app_metadata: { role } }),
    supabase.from("profiles").update({ role, is_active: true, full_name: fullName }).eq("id", userId),
  ]);
  if (metaError || profileError) {
    console.error("[inviteStaff] role setup failed", metaError?.message, profileError?.message);
    return { ok: false, error: "The invite was sent, but their role couldn't be saved. Revoke it and invite them again." };
  }

  refresh();
  return { ok: true, message: `Invite sent to ${email} as ${ROLE_LABELS[role]}` };
}

/** Load a staff member's auth record and make sure it's someone this action may touch. */
async function loadTarget(actor: SessionUser, userId: string) {
  if (userId === actor.id) return { error: "You can't change your own account here." } as const;
  const admin = createSupabaseAdminClient();
  const [{ data, error }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
  ]);
  if (error || !data.user) return { error: "That account no longer exists." } as const;
  // Protect against locking the church out: other Super Admins are changed in Supabase directly.
  if (profile?.role === "super_admin") return { error: "Super Admin accounts can't be changed here." } as const;
  return { user: data.user } as const;
}

const isPending = (u: { email_confirmed_at?: string | null; last_sign_in_at?: string | null }) =>
  !u.email_confirmed_at && !u.last_sign_in_at;

export async function resendInvite(input: { userId: string }): Promise<UserActionResult> {
  const parsed = z.object({ userId: z.uuid() }).safeParse(input);
  if (!parsed.success) return INVALID;
  const actor = await requireSuperAdmin();
  if (!actor) return NO_PERMISSION;
  const target = await loadTarget(actor, parsed.data.userId);
  if ("error" in target) return { ok: false, error: target.error as string };
  if (!isPending(target.user) || !target.user.email) return { ok: false, error: "They've already accepted their invite." };

  const { error } = await createSupabaseAdminClient().auth.admin.inviteUserByEmail(target.user.email, {
    redirectTo: `${siteUrl()}/admin/accept-invite`,
  });
  if (error) {
    console.error("[resendInvite] failed", error.message);
    return { ok: false, error: error.status === 429 ? "Too many emails sent. Wait a few minutes." : "Couldn't resend the invite." };
  }
  await logActivity({ actorId: actor.id, action: "update", module: "users", entityType: "profiles", entityId: target.user.id, summary: `Resent invite to ${target.user.email}` });
  refresh();
  return { ok: true, message: `Invite resent to ${target.user.email}` };
}

export async function revokeInvite(input: { userId: string }): Promise<UserActionResult> {
  const parsed = z.object({ userId: z.uuid() }).safeParse(input);
  if (!parsed.success) return INVALID;
  const actor = await requireSuperAdmin();
  if (!actor) return NO_PERMISSION;
  const target = await loadTarget(actor, parsed.data.userId);
  if ("error" in target) return { ok: false, error: target.error as string };
  if (!isPending(target.user)) return { ok: false, error: "They've already joined. Deactivate the account instead." };

  // Delete the profile as the Super Admin first, so the profiles audit trigger records who
  // revoked it (a cascade from the service-role auth delete would have no actor). Then delete
  // the auth user, which kills the invite link.
  const supabase = await createSupabaseServerClient();
  const { data: removed, error: profileError } = await supabase.from("profiles").delete().eq("id", target.user.id).select("id");
  if (profileError || !removed?.length) return { ok: false, error: "Couldn't revoke the invite." };
  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(target.user.id);
  if (error) {
    console.error("[revokeInvite] profile removed but auth user delete failed", error.message);
    return { ok: false, error: "Access was removed, but the invite link may still work until you try again." };
  }

  refresh();
  return { ok: true, message: "Invite revoked" };
}

export async function setStaffActive(input: { userId: string; active: boolean }): Promise<UserActionResult> {
  const parsed = z.object({ userId: z.uuid(), active: z.boolean() }).safeParse(input);
  if (!parsed.success) return INVALID;
  const actor = await requireSuperAdmin();
  if (!actor) return NO_PERMISSION;
  const target = await loadTarget(actor, parsed.data.userId);
  if ("error" in target) return { ok: false, error: target.error as string };

  // As the Super Admin: the profile guard + audit trigger apply. Takes effect immediately in
  // the DB (RLS checks is_active) and in the app (requireStaff checks it on every request).
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: parsed.data.active })
    .eq("id", target.user.id)
    .select("full_name, email")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't update the account." };

  // Also stop (or allow) refreshing their login, so open sessions end within the hour.
  const { error: banError } = await createSupabaseAdminClient().auth.admin.updateUserById(target.user.id, {
    ban_duration: parsed.data.active ? "none" : BAN_FOREVER,
  });
  if (banError) console.error("[setStaffActive] ban update failed", banError.message);

  const who = data.full_name || data.email || "the account";
  refresh(); // audited by the profiles audit trigger (is_active change, with the actor)
  return { ok: true, message: parsed.data.active ? `${who} can sign in again` : `${who} has been deactivated` };
}
