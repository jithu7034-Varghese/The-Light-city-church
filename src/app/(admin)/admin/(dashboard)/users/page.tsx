import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { StaffTable, type StaffRow } from "@/components/admin/users/staff-table";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await requireStaff("/admin/users");
  if (user.role !== "super_admin" || !can(user, "users", "edit")) return <NoAccess what="managing staff accounts" />;

  const supabase = await createSupabaseServerClient();
  // Invite state and last sign-in live in Supabase Auth, which only the service role can read.
  const [{ data: profiles }, { data: auth, error: authError }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, is_active, created_at").order("created_at"),
    createSupabaseAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const authById = new Map((auth?.users ?? []).map((u) => [u.id, u]));

  const rows: StaffRow[] = (profiles ?? []).map((p) => {
    const a = authById.get(p.id);
    const pending = Boolean(a && !a.email_confirmed_at && !a.last_sign_in_at);
    return {
      id: p.id,
      name: p.full_name,
      email: p.email ?? a?.email ?? "",
      role: p.role,
      status: pending ? "pending" : p.is_active ? "active" : "deactivated",
      invitedAt: a?.invited_at ?? null,
      lastSignIn: a?.last_sign_in_at ?? null,
      isSelf: p.id === user.id,
    };
  });

  return (
    <>
      <PageHeader title="Users" description="Invite staff and control who can sign in to the admin." />
      <StaffTable rows={rows} authUnavailable={Boolean(authError)} />
    </>
  );
}
