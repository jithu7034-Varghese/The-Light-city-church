"use server";
// Globals (navbar, footer, site settings, announcement): Save = publish. Zod → can(module,
// edit + publish) → update draft as the user → publish_global() → updateTag("global:<key>").
// `globals` has a DB audit trigger, so no logActivity() here.
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GLOBALS } from "@/cms/globals";
import type { Json } from "@/lib/supabase/database.types";

export type SaveGlobalResult = { ok: true; message: string } | { ok: false; error: string };

export async function saveGlobal(input: { key: string; data: unknown }): Promise<SaveGlobalResult> {
  const parsed = z.object({ key: z.enum(["navbar", "footer", "site", "announcement"]), data: z.unknown() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const def = GLOBALS[parsed.data.key];
  const user = await requireStaff();
  if (!can(user, def.module, "edit") || !can(user, def.module, "publish")) {
    return { ok: false, error: `You don't have permission to publish the ${def.label.toLowerCase()}.` };
  }
  const v = def.validate(parsed.data.data);
  if (!v.ok) return { ok: false, error: v.error };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("globals").update({ draft: v.data as NonNullable<Json>, has_unpublished_changes: true, updated_by: user.id }).eq("key", def.key);
  if (error) return { ok: false, error: "Couldn't save. Please try again." };
  const { error: publishError } = await supabase.rpc("publish_global", { p_key: def.key });
  if (publishError) return { ok: false, error: "Saved, but publishing failed. Please try again." };

  updateTag(`global:${def.key}`);
  return { ok: true, message: `${def.label} published` };
}
