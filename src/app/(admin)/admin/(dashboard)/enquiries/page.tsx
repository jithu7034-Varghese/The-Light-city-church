import type { Metadata } from "next";
import { z } from "zod";
import { PageHeader } from "@/components/admin/ui";
import { NoAccess } from "@/components/admin/no-access";
import { Inbox, type InboxDetail } from "@/components/admin/enquiries/inbox";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseFilters, PAGE_SIZE } from "@/lib/enquiries/filters";
import { queryEnquiries } from "@/lib/enquiries/query";
import { describeSubmission, formFieldsSchema } from "@/lib/forms/schema";

export const metadata: Metadata = { title: "Enquiries" };

export default async function EnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  const user = await requireStaff("/admin/enquiries");
  if (!can(user, "enquiries", "view")) return <NoAccess what="the enquiries inbox" />;

  const params = await searchParams;
  const filters = parseFilters(params);
  const openParam = typeof params.open === "string" ? params.open : undefined;
  const openId = openParam && z.uuid().safeParse(openParam).success ? openParam : undefined;

  const supabase = await createSupabaseServerClient();
  const [list, { data: forms }, { data: staff }, { data: saved }, detail] = await Promise.all([
    queryEnquiries(filters, user.id),
    supabase.from("forms").select("id, name, slug, fields").order("name"),
    supabase.from("profiles").select("id, full_name, email").eq("is_active", true).order("full_name"),
    supabase.from("saved_filters").select("id, name, query").eq("module", "enquiries").order("name"),
    openId ? loadDetail(openId) : Promise.resolve(null),
  ]);

  const formsById = new Map((forms ?? []).map((f) => [f.id, f]));

  async function loadDetail(id: string): Promise<InboxDetail | null> {
    const [{ data: enquiry }, { data: notes }] = await Promise.all([
      supabase
        .from("enquiries")
        .select("id, type, name, email, phone, status, assigned_to, created_at, is_sensitive, form_id, contact_id, source_page, consent, expires_at, data")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("enquiry_notes").select("id, body, created_at, author_id").eq("enquiry_id", id).order("created_at"),
    ]);
    if (!enquiry) return null; // missing, deleted, or hidden by RLS (prayer request without access)
    return { enquiry, notes: notes ?? [], fields: [] };
  }

  // Attach readable field labels from the form definition.
  if (detail?.enquiry.form_id) {
    const parsed = formFieldsSchema.safeParse(formsById.get(detail.enquiry.form_id)?.fields);
    const data = (detail.enquiry.data ?? {}) as Record<string, unknown>;
    detail.fields = parsed.success
      ? describeSubmission(parsed.data, data)
      : Object.entries(data).map(([key, value]) => ({ key, label: key, value: String(value) }));
  }

  const total = list.count ?? 0;
  return (
    <>
      <PageHeader
        title="Enquiries"
        description={
          can(user, "enquiries", "sensitive")
            ? "Messages from every form on the website, including private prayer requests and salvation decisions."
            : "Messages from the website's forms. Prayer requests and salvation decisions are private and only shown to the pastoral team."
        }
      />
      <Inbox
        rows={list.data ?? []}
        total={total}
        pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        filters={filters}
        loadError={Boolean(list.error)}
        forms={(forms ?? []).map(({ id, name }) => ({ id, name }))}
        staff={(staff ?? []).map((s) => ({ id: s.id, name: s.full_name || s.email || "Unnamed" }))}
        savedFilters={saved ?? []}
        detail={openId ? detail : null}
        detailMissing={Boolean(openId && !detail)}
        currentUserId={user.id}
        permissions={{
          edit: can(user, "enquiries", "edit"),
          remove: can(user, "enquiries", "delete"),
          convert: can(user, "enquiries", "edit") && can(user, "contacts", "edit"),
        }}
      />
    </>
  );
}
