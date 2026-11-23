// CSV export of the inbox with the current filters. Runs as the signed-in user, so RLS
// decides what's included (prayer + salvation only with the `sensitive` permission).
// Export changes no table, so it calls logActivity() itself.
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseFilters, filtersToQuery, STATUS_LABELS } from "@/lib/enquiries/filters";
import { queryEnquiries, type EnquiryListRow } from "@/lib/enquiries/query";
import { toCsv } from "@/lib/csv";

const MAX_ROWS = 5000;
const OWN_COLUMNS = new Set(["name", "email", "phone", "subject", "message"]);

export async function GET(request: Request) {
  const user = await requireStaff();
  if (!can(user, "enquiries", "view")) return new Response("Forbidden", { status: 403 });

  const filters = parseFilters(new URL(request.url).searchParams);
  const supabase = await createSupabaseServerClient();
  const [{ data: rows, error }, { data: forms }, { data: staff }] = await Promise.all([
    queryEnquiries(filters, user.id, { paginate: false, limit: MAX_ROWS }),
    supabase.from("forms").select("id, name"),
    supabase.from("profiles").select("id, full_name, email"),
  ]);
  if (error) return new Response("Export failed", { status: 500 });

  const formName = new Map((forms ?? []).map((f) => [f.id, f.name]));
  const staffName = new Map((staff ?? []).map((s) => [s.id, s.full_name || s.email || ""]));
  const data = (r: EnquiryListRow) => (r.data ?? {}) as Record<string, unknown>;

  const csv = toCsv(rows ?? [], [
    { header: "Received", value: (r) => r.created_at },
    { header: "Form", value: (r) => (r.form_id ? formName.get(r.form_id) : null) ?? r.type },
    { header: "Status", value: (r) => STATUS_LABELS[r.status] },
    { header: "Name", value: (r) => r.name },
    { header: "Email", value: (r) => r.email },
    { header: "Phone", value: (r) => r.phone },
    { header: "Assigned to", value: (r) => (r.assigned_to ? staffName.get(r.assigned_to) : "") },
    { header: "Subject", value: (r) => data(r).subject },
    { header: "Message", value: (r) => data(r).message },
    {
      header: "Other details",
      value: (r) =>
        Object.entries(data(r))
          .filter(([k]) => !OWN_COLUMNS.has(k))
          .map(([k, v]) => `${k}: ${typeof v === "boolean" ? (v ? "yes" : "no") : String(v)}`)
          .join("; "),
    },
    { header: "Private", value: (r) => (r.is_sensitive ? "yes" : "no") },
    { header: "Page", value: (r) => r.source_page },
  ]);

  const count = rows?.length ?? 0;
  await logActivity({
    actorId: user.id,
    action: "export",
    module: "enquiries",
    entityType: "enquiries",
    summary: `Exported ${count} ${count === 1 ? "enquiry" : "enquiries"} to CSV`,
    diff: { filters: filtersToQuery(filters), rows: count, truncated: count >= MAX_ROWS },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="enquiries-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
