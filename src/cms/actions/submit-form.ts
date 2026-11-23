"use server";
// The ONE public write path (docs/ARCHITECTURE.md §11). Visitors have no DB write access,
// so this action validates everything itself and then uses the service role:
//   load form → honeypot → Turnstile → rate limit → Zod from the form's fields →
//   insert enquiry → (after the response) staff notification + auto-reply, each in email_log.
// It's public, so there's no can() check and no activity-log actor; the enquiry row is the record.
import { after } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadActiveForm, notificationRecipients, type LoadedForm } from "@/lib/forms/load";
import { buildFormSchema, describeSubmission, enquiryColumns, type SubmissionData } from "@/lib/forms/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { getClientIp, hashIp } from "@/lib/request";
import { sendEmail } from "@/lib/email/send";
import { detailsTable, renderSubject, renderTemplate } from "@/lib/email/render";

export type SubmitResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const RATE_LIMIT = { max: 5, windowSeconds: 600 };
const GENERIC_ERROR = "Sorry, we couldn't send your message. Please try again in a moment.";

const inputSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{1,60}$/),
  data: z.record(z.string().max(40), z.unknown()).refine((d) => Object.keys(d).length <= 60),
  meta: z
    .object({
      turnstileToken: z.string().max(2048).optional(),
      sourcePage: z.string().max(200).regex(/^\/[^\s]*$/).optional(),
      /** Honeypot: a hidden input real people never fill in. */
      website: z.string().max(200).optional(),
    })
    .default({}),
});

export async function submitForm(
  slug: string,
  data: Record<string, unknown>,
  meta?: { turnstileToken?: string; sourcePage?: string; website?: string },
): Promise<SubmitResult> {
  const input = inputSchema.safeParse({ slug, data, meta });
  if (!input.success) return { ok: false, error: GENERIC_ERROR };

  const form = await loadActiveForm(input.data.slug);
  if (!form) return { ok: false, error: "This form isn't available right now." };
  const success = { ok: true as const, message: form.settings.success_message ?? "Thank you! Your message has been sent." };

  // Bots fill every field. Pretend it worked so they don't adapt.
  if (input.data.meta.website) return success;

  const ip = await getClientIp();
  if (form.settings.turnstile) {
    const check = await verifyTurnstile(input.data.meta.turnstileToken, ip);
    if (!check.ok) {
      return { ok: false, error: "Please complete the spam check and try again." };
    }
  }

  const admin = createSupabaseAdminClient();
  const ipHash = hashIp(ip);
  const { data: allowed, error: rateError } = await admin.rpc("check_rate_limit", {
    p_key: `form:${form.slug}:${ipHash}`,
    p_max: RATE_LIMIT.max,
    p_window_seconds: RATE_LIMIT.windowSeconds,
  });
  if (rateError) {
    console.error("[submitForm] rate limiter failed", rateError.message);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!allowed) {
    return { ok: false, error: "You've sent several messages in a short time. Please wait 10 minutes and try again." };
  }

  const parsed = buildFormSchema(form.fields).safeParse(input.data.data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const values = parsed.data as SubmissionData;
  const columns = enquiryColumns(form.fields, values);

  // is_sensitive + expires_at are also enforced by a DB trigger from the form's settings.
  const { data: row, error: insertError } = await admin
    .from("enquiries")
    .insert({
      form_id: form.id,
      type: form.enquiryType,
      ...columns,
      data: JSON.parse(JSON.stringify(values)),
      is_sensitive: form.settings.sensitive,
      ip_hash: ipHash,
      source_page: input.data.meta.sourcePage ?? null,
    })
    .select("id")
    .single();
  if (insertError || !row) {
    console.error("[submitForm] insert failed", insertError?.message);
    return { ok: false, error: GENERIC_ERROR };
  }

  const subscribe =
    form.settings.subscribe === true ||
    (form.settings.subscribe_field ? values[form.settings.subscribe_field] === true : false);
  if (subscribe && columns.email) {
    const { error } = await admin
      .from("subscribers")
      .upsert({ email: columns.email, name: columns.name, source: form.slug }, { onConflict: "email", ignoreDuplicates: true });
    if (error) console.error("[submitForm] subscriber upsert failed", error.message);
  }

  // Emails go out after the visitor gets their answer, so a slow provider never delays it.
  after(() => sendSubmissionEmails(form, row.id, values, columns));

  return success;
}

async function sendSubmissionEmails(
  form: LoadedForm,
  enquiryId: string,
  values: SubmissionData,
  columns: ReturnType<typeof enquiryColumns>,
) {
  try {
    const admin = createSupabaseAdminClient();
    const keys = ["enquiry_notification", form.settings.auto_reply?.template_key].filter(Boolean) as string[];
    const { data: templates } = await admin
      .from("email_templates")
      .select("key, subject, body")
      .in("key", keys)
      .eq("is_active", true);
    const byKey = new Map((templates ?? []).map((t) => [t.key, t]));
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const sends: Promise<unknown>[] = [];

    // 1. Staff notification. Sensitive forms (prayer) never put the content or the
    //    person's name in email: staff read it in the admin, behind permissions.
    const notify = byKey.get("enquiry_notification");
    if (notify && form.settings.notify_staff !== false) {
      const vars = {
        form_name: form.name,
        name: form.settings.sensitive ? "a website visitor" : (columns.name ?? columns.email ?? "a website visitor"),
        admin_url: `${siteUrl}/admin/enquiries?open=${enquiryId}`,
      };
      const details = form.settings.sensitive
        ? "<p><em>This message is private. Open it in the admin to read it.</em></p>"
        : detailsTable(describeSubmission(form.fields, values));
      for (const to of notificationRecipients(form.settings)) {
        sends.push(
          sendEmail({
            to,
            subject: renderSubject(notify.subject, vars),
            html: renderTemplate(notify.body, vars, { details }),
            replyTo: form.settings.sensitive ? undefined : (columns.email ?? undefined),
            templateKey: notify.key,
            entityType: "enquiry",
            entityId: enquiryId,
          }),
        );
      }
    }

    // 2. Auto-reply to the visitor.
    const reply = form.settings.auto_reply?.enabled ? byKey.get(form.settings.auto_reply.template_key) : undefined;
    if (reply && columns.email) {
      const vars = { name: columns.name?.split(" ")[0] ?? "friend", form_name: form.name };
      sends.push(
        sendEmail({
          to: columns.email,
          subject: renderSubject(reply.subject, vars),
          html: renderTemplate(reply.body, vars),
          templateKey: reply.key,
          entityType: "enquiry",
          entityId: enquiryId,
        }),
      );
    }

    await Promise.allSettled(sends);
  } catch (e) {
    console.error("[submitForm] emails failed", e);
  }
}
