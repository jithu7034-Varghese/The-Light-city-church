"use server";
// Enquiries inbox mutations. Every action: Zod → requireStaff() → can() → DB as the user
// (RLS still applies, so private enquiries stay hidden without `sensitive`) → refresh.
// Activity log: `enquiries` and `contacts` have DB audit triggers (status, assignment,
// deletes; new contacts), which record the actor, so those actions don't call logActivity().
// Notes and saved filters have no trigger, so they do.
import { refresh } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { can, type PermissionAction, type PermissionModule } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STATUS_LABELS, filtersToQuery, parseFilters } from "@/lib/enquiries/filters";

export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string };

const ids = z.array(z.uuid()).min(1, "Select at least one enquiry").max(200, "Select 200 or fewer at a time");
const status = z.enum(["unread", "read", "follow_up", "closed"]);

const NO_PERMISSION: ActionResult = { ok: false, error: "You don't have permission to do that." };
const INVALID: ActionResult = { ok: false, error: "Something about that request wasn't valid. Please try again." };

async function authorise(...needs: [PermissionModule, PermissionAction][]) {
  const user = await requireStaff();
  return needs.every(([m, a]) => can(user, m, a)) ? user : null;
}

const countLabel = (n: number) => (n === 1 ? "1 enquiry" : `${n} enquiries`);

export async function setEnquiryStatus(input: { ids: string[]; status: string }): Promise<ActionResult> {
  const parsed = z.object({ ids, status }).safeParse(input);
  if (!parsed.success) return INVALID;
  const user = await authorise(["enquiries", "edit"]);
  if (!user) return NO_PERMISSION;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("enquiries")
    .update({ status: parsed.data.status })
    .in("id", parsed.data.ids)
    .select("id");
  if (error) return { ok: false, error: "Couldn't update the status. Please try again." };

  refresh(); // audited by the audit_enquiries trigger
  return { ok: true, message: `Marked ${countLabel(data?.length ?? 0)} as ${STATUS_LABELS[parsed.data.status]}` };
}

/** Opening an unread enquiry marks it read. No-op if it's already been read. */
export async function markEnquiryRead(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return INVALID;
  const user = await authorise(["enquiries", "edit"]);
  if (!user) return { ok: true }; // viewers can open enquiries; they just don't change status

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("enquiries")
    .update({ status: "read" })
    .eq("id", id)
    .eq("status", "unread")
    .select("id");
  if (data?.length) refresh(); // audited by the audit_enquiries trigger
  return { ok: true };
}

export async function assignEnquiries(input: { ids: string[]; assigneeId: string | null }): Promise<ActionResult> {
  const parsed = z.object({ ids, assigneeId: z.uuid().nullable() }).safeParse(input);
  if (!parsed.success) return INVALID;
  const user = await authorise(["enquiries", "edit"]);
  if (!user) return NO_PERMISSION;

  const supabase = await createSupabaseServerClient();
  let assigneeName = "nobody";
  if (parsed.data.assigneeId) {
    const { data: staff } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_active")
      .eq("id", parsed.data.assigneeId)
      .maybeSingle();
    if (!staff?.is_active) return { ok: false, error: "You can only assign enquiries to active staff." };
    assigneeName = staff.full_name || staff.email || "a colleague";
  }

  const { data, error } = await supabase
    .from("enquiries")
    .update({ assigned_to: parsed.data.assigneeId })
    .in("id", parsed.data.ids)
    .select("id");
  if (error) return { ok: false, error: "Couldn't assign. Please try again." };

  refresh(); // audited by the audit_enquiries trigger
  const label = countLabel(data?.length ?? 0);
  return { ok: true, message: parsed.data.assigneeId ? `Assigned ${label} to ${assigneeName}` : `Unassigned ${label}` };
}

export async function addEnquiryNote(input: { enquiryId: string; body: string }): Promise<ActionResult> {
  const parsed = z
    .object({ enquiryId: z.uuid(), body: z.string().trim().min(1, "Write a note first").max(5000) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid note" };
  const user = await authorise(["enquiries", "edit"]);
  if (!user) return NO_PERMISSION;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("enquiry_notes")
    .insert({ enquiry_id: parsed.data.enquiryId, author_id: user.id, body: parsed.data.body })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't save the note. Please try again." };

  // Don't copy the note text into the log: notes on prayer requests are private.
  await logActivity({ actorId: user.id, action: "create", module: "enquiries", entityType: "enquiry_notes", entityId: parsed.data.enquiryId, summary: "Added a note" });
  refresh();
  return { ok: true, message: "Note added", id: data.id };
}

export async function deleteEnquiries(input: { ids: string[] }): Promise<ActionResult> {
  const parsed = z.object({ ids }).safeParse(input);
  if (!parsed.success) return INVALID;
  const user = await authorise(["enquiries", "delete"]);
  if (!user) return NO_PERMISSION;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("enquiries").delete().in("id", parsed.data.ids).select("id");
  if (error) return { ok: false, error: "Couldn't delete. Please try again." };

  refresh(); // audited by the audit_enquiries trigger
  return { ok: true, message: `Deleted ${countLabel(data?.length ?? 0)}` };
}

export async function convertEnquiryToContact(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return INVALID;
  const user = await authorise(["enquiries", "edit"], ["contacts", "edit"]);
  if (!user) return NO_PERMISSION;

  const supabase = await createSupabaseServerClient();
  const { data: contactId, error } = await supabase.rpc("convert_enquiry_to_contact", { p_enquiry_id: parsed.data.id });
  if (error || !contactId) return { ok: false, error: "Couldn't create the person record. Please try again." };

  refresh(); // a new contact is audited by the audit_contacts trigger

  return { ok: true, message: "Saved to People", id: contactId };
}

// ---------- Saved filters (per user) ----------

export async function saveEnquiryFilter(input: { name: string; query: string }): Promise<ActionResult> {
  const parsed = z
    .object({ name: z.string().trim().min(1, "Give the filter a name").max(60), query: z.string().max(1000) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid filter" };
  const user = await authorise(["enquiries", "view"]);
  if (!user) return NO_PERMISSION;

  // Store only known, valid filters (never arbitrary query strings).
  const query = filtersToQuery(parseFilters(new URLSearchParams(parsed.data.query)));
  if (!query) return { ok: false, error: "Choose some filters before saving." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_filters")
    .upsert({ owner_id: user.id, module: "enquiries", name: parsed.data.name, query }, { onConflict: "owner_id,module,name" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't save the filter." };

  await logActivity({ actorId: user.id, action: "create", module: "enquiries", entityType: "saved_filters", entityId: data.id, summary: `Saved filter "${parsed.data.name}"` });
  refresh();
  return { ok: true, message: "Filter saved", id: data.id };
}

export async function deleteSavedFilter(input: { id: string }): Promise<ActionResult> {
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return INVALID;
  const user = await authorise(["enquiries", "view"]);
  if (!user) return NO_PERMISSION;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("saved_filters").delete().eq("id", parsed.data.id).select("id");
  if (error || !data?.length) return { ok: false, error: "Couldn't remove the filter." };

  await logActivity({ actorId: user.id, action: "delete", module: "enquiries", entityType: "saved_filters", entityId: parsed.data.id, summary: "Removed a saved filter" });
  refresh();
  return { ok: true, message: "Filter removed" };
}
