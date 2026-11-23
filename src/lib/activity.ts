import "server-only";
import type { Json } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PermissionModule } from "@/lib/auth/permissions";

export type ActivityEntry = {
  /** The signed-in user doing the action (RLS only accepts the caller's own id). */
  actorId: string;
  action: "create" | "update" | "delete" | "publish" | "restore" | "login" | "logout" | (string & {});
  module: PermissionModule;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  diff?: Json;
};

/**
 * Append to the activity log as the signed-in user. Best effort: a logging failure is
 * reported but never undoes the action (key tables are also audited by DB triggers).
 */
export async function logActivity(entry: ActivityEntry): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("activity_log").insert({
      actor_id: entry.actorId,
      action: entry.action,
      module: entry.module,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      summary: entry.summary ?? "",
      diff: entry.diff ?? null,
    });
    if (error) console.error("logActivity failed", error.message);
  } catch (e) {
    console.error("logActivity failed", e);
  }
}
