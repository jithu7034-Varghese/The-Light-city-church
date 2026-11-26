// Forms are data (forms.fields / forms.settings). This file turns a form definition into
// the Zod schema that validates a submission, on the server (submitForm) and, later, in
// the R2 Form Builder preview. Pure: no Next/Supabase imports, so it's unit-tested.
import { z } from "zod";

export const FIELD_TYPES = ["text", "email", "phone", "textarea", "select", "checkbox", "consent"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

const optionSchema = z.object({ value: z.string().min(1).max(100), label: z.string().min(1).max(200) });

/** Shape of one entry in forms.fields. */
export const formFieldSchema = z.object({
  id: z.string().min(1).max(64),
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/, "Field keys are lowercase letters, numbers and _"),
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1).max(300),
  required: z.boolean().default(false),
  placeholder: z.string().max(200).optional(),
  options: z.array(optionSchema).max(50).optional(),
  max_length: z.number().int().positive().max(10_000).optional(),
});
export type FormField = z.infer<typeof formFieldSchema>;

/** Shape of forms.settings. Unknown keys are kept so R2 can add settings without a migration. */
export const formSettingsSchema = z.looseObject({
  recipients: z.array(z.email()).default([]),
  auto_reply: z.object({ enabled: z.boolean(), template_key: z.string() }).optional(),
  success_message: z.string().max(500).optional(),
  submit_label: z.string().max(60).optional(),
  turnstile: z.boolean().default(true),
  sensitive: z.boolean().default(false),
  retention_days: z.number().int().positive().optional(),
  /** Always add the submitter to subscribers (newsletter form). */
  subscribe: z.boolean().optional(),
  /** Add to subscribers only when this checkbox field is ticked. */
  subscribe_field: z.string().optional(),
  /** Set false to skip the staff notification email. */
  notify_staff: z.boolean().optional(),
});
export type FormSettings = z.infer<typeof formSettingsSchema>;

export const formFieldsSchema = z
  .array(formFieldSchema)
  .min(1)
  .max(60)
  .refine((fields) => new Set(fields.map((f) => f.key)).size === fields.length, "Field keys must be unique");

const DEFAULT_MAX: Record<FieldType, number> = {
  text: 200,
  email: 254,
  phone: 30,
  textarea: 5000,
  select: 100,
  checkbox: 0,
  consent: 0,
};

/** "on" / "true" / true → true. Missing or anything else → false. HTML checkboxes send "on". */
const checkboxValue = z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());

/** Trim strings; treat empty as missing so optional fields can be left blank. */
const blankToUndefined = (v: unknown) => {
  if (typeof v !== "string") return v;
  const t = v.trim();
  return t === "" ? undefined : t;
};

function fieldSchema(field: FormField): z.ZodType {
  const label = field.label.length > 60 ? "This field" : field.label;
  const max = field.max_length ?? DEFAULT_MAX[field.type];

  if (field.type === "checkbox") return checkboxValue;
  if (field.type === "consent") {
    return field.required
      ? checkboxValue.refine((v) => v === true, { message: "Please tick this box to continue" })
      : checkboxValue;
  }

  let base: z.ZodType<string, string>;
  switch (field.type) {
    case "email":
      base = z.email("Enter a valid email address").max(max).transform((v) => v.toLowerCase());
      break;
    case "phone":
      base = z
        .string()
        .max(max, `${label} is too long`)
        .regex(/^[+()\d\s.-]{6,}$/, "Enter a valid phone number");
      break;
    case "select": {
      const values = (field.options ?? []).map((o) => o.value);
      base = z.string().refine((v) => values.includes(v), { message: "Choose one of the options" });
      break;
    }
    default:
      base = z.string().max(max, `${label} must be ${max} characters or fewer`);
  }

  const required = z.preprocess(
    blankToUndefined,
    z.string({ error: `${label} is required` }).pipe(base),
  );
  return field.required ? required : z.preprocess(blankToUndefined, base.optional());
}

/** Build the submission validator for a form. Unknown keys are dropped. */
export function buildFormSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodType> = {};
  for (const field of fields) shape[field.key] = fieldSchema(field);
  return z.object(shape);
}

export type SubmissionData = Record<string, string | boolean | undefined>;

/** Map validated data onto the enquiries table's own columns (the rest stays in `data`). */
export function enquiryColumns(fields: FormField[], data: Record<string, unknown>) {
  const str = (key: string) => (typeof data[key] === "string" ? (data[key] as string) : null);
  const emailField = fields.find((f) => f.type === "email");
  const phoneField = fields.find((f) => f.type === "phone");
  const first = str("first_name");
  const last = str("last_name");
  const name = str("name") ?? ([first, last].filter(Boolean).join(" ") || null);
  return {
    name,
    email: emailField ? str(emailField.key) : null,
    phone: phoneField ? str(phoneField.key) : null,
    consent: fields.some((f) => f.type === "consent" && data[f.key] === true),
  };
}

/** Readable label/value pairs for emails and the inbox detail view. */
export function describeSubmission(fields: FormField[], data: Record<string, unknown>) {
  return fields
    .filter((f) => data[f.key] !== undefined && data[f.key] !== null && data[f.key] !== "")
    .map((f) => {
      const raw = data[f.key];
      let value: string;
      if (typeof raw === "boolean") value = raw ? "Yes" : "No";
      else if (f.type === "select") value = f.options?.find((o) => o.value === raw)?.label ?? String(raw);
      else value = String(raw);
      return { key: f.key, label: f.label, value };
    });
}
