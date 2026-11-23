import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formFieldsSchema, formSettingsSchema, type FormField, type FormSettings } from "./schema";

export type LoadedForm = {
  id: string;
  slug: string;
  name: string;
  enquiryType: string;
  fields: FormField[];
  settings: FormSettings;
};

/**
 * Load an active form with its settings (recipients etc.), which visitors can't read.
 * Service role: used only by the public submission path. Returns null for unknown,
 * inactive or malformed forms.
 */
export async function loadActiveForm(slug: string): Promise<LoadedForm | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("forms")
    .select("id, slug, name, enquiry_type, fields, settings")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return null;

  const fields = formFieldsSchema.safeParse(data.fields);
  const settings = formSettingsSchema.safeParse(data.settings);
  if (!fields.success || !settings.success) {
    console.error(`[forms] form "${slug}" has an invalid definition`, fields.error ?? settings.error);
    return null;
  }
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    enquiryType: data.enquiry_type,
    fields: fields.data,
    settings: settings.data,
  };
}

/** Staff who get the notification: the form's recipients, else ENQUIRY_RECIPIENTS. */
export function notificationRecipients(settings: FormSettings): string[] {
  if (settings.recipients.length > 0) return settings.recipients;
  return (process.env.ENQUIRY_RECIPIENTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
}
