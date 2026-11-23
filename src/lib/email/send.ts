import "server-only";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  templateKey: string;
  entityType?: string;
  entityId?: string;
};

export type EmailStatus = "sent" | "failed" | "skipped";

let client: Resend | null = null;
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

/**
 * Send one email through Resend and record it in email_log (service role: called only from
 * the public submission path). Without RESEND_API_KEY the email is logged as "skipped"
 * and printed to the server log instead, so forms keep working before email is set up.
 */
export async function sendEmail(email: OutgoingEmail): Promise<EmailStatus> {
  const from = process.env.EMAIL_FROM ?? "The Light City Church <hello@thelightcitychurch.org>";
  const api = resend();
  let status: EmailStatus;
  let providerId: string | null = null;
  let error: string | null = null;

  if (!api) {
    status = "skipped";
    error = "RESEND_API_KEY not set";
    console.info(`[email] (not sent, no RESEND_API_KEY) to=${email.to} template=${email.templateKey} subject="${email.subject}"`);
  } else {
    try {
      const res = await api.emails.send({
        from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        replyTo: email.replyTo,
      });
      if (res.error) {
        status = "failed";
        error = res.error.message;
      } else {
        status = "sent";
        providerId = res.data?.id ?? null;
      }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  }

  const { error: logError } = await createSupabaseAdminClient().from("email_log").insert({
    to_email: email.to,
    template_key: email.templateKey,
    entity_type: email.entityType ?? null,
    entity_id: email.entityId ?? null,
    status,
    provider_id: providerId,
    error,
  });
  if (logError) console.error("[email] could not write email_log", logError.message);
  if (status === "failed") console.error(`[email] failed to=${email.to} template=${email.templateKey}: ${error}`);
  return status;
}
