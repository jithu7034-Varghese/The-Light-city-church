import { describe, expect, it } from "vitest";
import {
  buildFormSchema,
  describeSubmission,
  enquiryColumns,
  formFieldsSchema,
  type FormField,
} from "@/lib/forms/schema";

const f = (field: Partial<FormField> & Pick<FormField, "key" | "type">): FormField => ({
  id: `fld_${field.key}`,
  label: field.key[0].toUpperCase() + field.key.slice(1),
  required: false,
  ...field,
});

// Mirrors the seeded Prayer & Testimony form
const prayer: FormField[] = [
  f({ key: "name", type: "text", required: true }),
  f({ key: "email", type: "email", required: true }),
  f({ key: "phone", type: "phone" }),
  f({ key: "kind", type: "select", required: true, options: [{ value: "prayer", label: "A prayer request" }, { value: "testimony", label: "A testimony" }] }),
  f({ key: "message", type: "textarea", required: true }),
  f({ key: "may_share", type: "checkbox" }),
  f({ key: "consent", type: "consent", required: true, label: "I agree to you keeping these details" }),
];

const valid = { name: "  Pat  ", email: "PAT@Example.com", kind: "prayer", message: "Please pray for my mum", consent: "on" };

function errors(fields: FormField[], data: Record<string, unknown>) {
  const r = buildFormSchema(fields).safeParse(data);
  if (r.success) return {};
  return Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
}

describe("buildFormSchema", () => {
  it("accepts a valid submission and normalises it", () => {
    const r = buildFormSchema(prayer).parse(valid);
    expect(r).toEqual({
      name: "Pat",
      email: "pat@example.com",
      phone: undefined,
      kind: "prayer",
      message: "Please pray for my mum",
      may_share: false,
      consent: true,
    });
  });

  it("reports every missing required field with its label", () => {
    const e = errors(prayer, {});
    expect(e.name).toBe("Name is required");
    expect(e.email).toBe("Email is required");
    expect(e.kind).toBe("Kind is required");
    expect(e.message).toBe("Message is required");
    expect(e.consent).toBe("Please tick this box to continue");
  });

  it("treats whitespace-only as missing", () => {
    expect(errors(prayer, { ...valid, name: "   " }).name).toBe("Name is required");
  });

  it("lets optional fields be blank", () => {
    expect(buildFormSchema(prayer).safeParse({ ...valid, phone: "" }).success).toBe(true);
  });

  it("validates emails, phones and select options", () => {
    expect(errors(prayer, { ...valid, email: "not-an-email" }).email).toBe("Enter a valid email address");
    expect(errors(prayer, { ...valid, phone: "call me" }).phone).toBe("Enter a valid phone number");
    expect(buildFormSchema(prayer).safeParse({ ...valid, phone: "+44 (0)115 123-4567" }).success).toBe(true);
    expect(errors(prayer, { ...valid, kind: "hack" }).kind).toBe("Choose one of the options");
  });

  it("enforces length limits (default and custom)", () => {
    expect(errors(prayer, { ...valid, message: "x".repeat(5001) }).message).toMatch(/5000 characters or fewer/);
    const short = [f({ key: "note", type: "text", max_length: 5 })];
    expect(errors(short, { note: "123456" }).note).toMatch(/5 characters or fewer/);
  });

  it("requires consent to be ticked, not just present", () => {
    expect(errors(prayer, { ...valid, consent: "false" }).consent).toBe("Please tick this box to continue");
    expect(errors(prayer, { ...valid, consent: false }).consent).toBe("Please tick this box to continue");
  });

  it("drops keys that aren't fields (no smuggling extra data)", () => {
    const r = buildFormSchema(prayer).parse({ ...valid, is_sensitive: false, status: "closed" });
    expect(r).not.toHaveProperty("is_sensitive");
    expect(r).not.toHaveProperty("status");
  });

  it("rejects non-string values for text fields", () => {
    expect(buildFormSchema(prayer).safeParse({ ...valid, message: { $gt: "" } }).success).toBe(false);
    expect(buildFormSchema(prayer).safeParse({ ...valid, name: ["a"] }).success).toBe(false);
  });

  it("uses a generic name in messages for very long labels", () => {
    const long = [f({ key: "q", type: "text", required: true, label: "x".repeat(80) })];
    expect(errors(long, {}).q).toBe("This field is required");
  });
});

describe("formFieldsSchema", () => {
  it("rejects duplicate keys and bad key names", () => {
    expect(formFieldsSchema.safeParse([f({ key: "a", type: "text" }), f({ key: "a", type: "email" })]).success).toBe(false);
    expect(formFieldsSchema.safeParse([{ ...f({ key: "a", type: "text" }), key: "Bad Key" }]).success).toBe(false);
    expect(formFieldsSchema.safeParse(prayer).success).toBe(true);
  });
});

describe("enquiryColumns / describeSubmission", () => {
  it("maps name, email, phone and consent to enquiry columns", () => {
    const data = buildFormSchema(prayer).parse({ ...valid, phone: "07123 456789" });
    expect(enquiryColumns(prayer, data)).toEqual({ name: "Pat", email: "pat@example.com", phone: "07123 456789", consent: true });
  });

  it("joins first/last name when there's no name field", () => {
    const fields = [f({ key: "first_name", type: "text" }), f({ key: "last_name", type: "text" }), f({ key: "email", type: "email" })];
    expect(enquiryColumns(fields, { first_name: "Ann", last_name: "Lee" }).name).toBe("Ann Lee");
    expect(enquiryColumns(fields, {}).name).toBeNull();
  });

  it("describes values with option labels and Yes/No", () => {
    const data = buildFormSchema(prayer).parse(valid);
    const rows = describeSubmission(prayer, data);
    expect(rows.find((r) => r.key === "kind")?.value).toBe("A prayer request");
    expect(rows.find((r) => r.key === "may_share")?.value).toBe("No");
    expect(rows.find((r) => r.key === "phone")).toBeUndefined();
  });
});
