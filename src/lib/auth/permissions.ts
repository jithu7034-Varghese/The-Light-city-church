import type { Database } from "@/lib/supabase/database.types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type PermissionAction = "view" | "edit" | "publish" | "delete" | "sensitive";
export type PermissionModule =
  | "enquiries" | "forms" | "bookings" | "contacts" | "events" | "subscribers"
  | "pages" | "globals" | "posts" | "sermons" | "media" | "seo"
  | "email_templates" | "users" | "settings" | "activity";

export type RolePermissionRow = Database["public"]["Tables"]["role_permissions"]["Row"];

/**
 * Mirrors public.has_permission() in SQL. Use it in Server Actions and the UI
 * (hide buttons), but RLS in the database stays the real enforcement.
 */
export function can(
  role: AppRole | null | undefined,
  matrix: RolePermissionRow[],
  module: PermissionModule,
  action: PermissionAction,
): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  const row = matrix.find((r) => r.role === role && r.module === module);
  if (!row) return false;
  switch (action) {
    case "view": return row.can_view;
    case "edit": return row.can_edit;
    case "publish": return row.can_publish;
    case "delete": return row.can_delete;
    case "sensitive": return row.can_sensitive;
  }
}
