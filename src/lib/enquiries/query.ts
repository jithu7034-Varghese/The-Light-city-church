import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dateBounds, PAGE_SIZE, type EnquiryFilters } from "./filters";

export const LIST_COLUMNS =
  "id, type, name, email, phone, status, assigned_to, created_at, is_sensitive, form_id, contact_id, source_page, data" as const;

/**
 * Enquiries matching the filters, as the signed-in user (RLS hides prayer requests from
 * anyone without the `sensitive` permission). Used by the inbox and the CSV export.
 */
export async function queryEnquiries(
  filters: EnquiryFilters,
  userId: string,
  { paginate = true, limit = 5000 }: { paginate?: boolean; limit?: number } = {},
) {
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("enquiries").select(LIST_COLUMNS, { count: "exact" });

  if (filters.q) q = q.textSearch("search", filters.q, { type: "websearch", config: "simple" });
  if (filters.form) q = q.eq("form_id", filters.form);
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.assignee === "me") q = q.eq("assigned_to", userId);
  else if (filters.assignee === "none") q = q.is("assigned_to", null);
  else if (filters.assignee) q = q.eq("assigned_to", filters.assignee);
  const { start, end } = dateBounds(filters);
  if (start) q = q.gte("created_at", start);
  if (end) q = q.lt("created_at", end);

  q = q.order("created_at", { ascending: false });
  if (paginate) {
    const from = (filters.page - 1) * PAGE_SIZE;
    q = q.range(from, from + PAGE_SIZE - 1);
  } else {
    q = q.limit(limit);
  }
  return q;
}

export type EnquiryListRow = NonNullable<Awaited<ReturnType<typeof queryEnquiries>>["data"]>[number];
