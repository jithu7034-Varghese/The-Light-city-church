import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type PermissionAction = "view" | "edit" | "publish" | "delete" | "sensitive";
export type PermissionModule =
  | "enquiries" | "forms" | "bookings" | "contacts" | "events" | "subscribers"
  | "pages" | "globals" | "posts" | "sermons" | "media" | "seo"
  | "email_templates" | "users" | "settings" | "activity";

export type RolePermissionRow = Database["public"]["Tables"]["role_permissions"]["Row"];

/** The parts of a signed-in user that permission checks need. */
export type PermissionSubject = {
  role: AppRole;
  isActive: boolean;
  /** role_permissions rows for the user's role (RLS returns them only to active staff). */
  permissions: RolePermissionRow[];
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  pastor: "Pastor / Staff",
  editor: "Editor",
  viewer: "Viewer",
};

/**
 * Mirrors public.has_permission() in SQL. Use it in Server Actions and to hide UI,
 * but RLS in the database stays the real enforcement.
 */
export function can(
  user: PermissionSubject | null | undefined,
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === "super_admin") return true;
  const row = user.permissions.find((r) => r.role === user.role && r.module === module);
  if (!row) return false;
  switch (action) {
    case "view": return row.can_view;
    case "edit": return row.can_edit;
    case "publish": return row.can_publish;
    case "delete": return row.can_delete;
    case "sensitive": return row.can_sensitive;
  }
}
