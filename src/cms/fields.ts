// Field builders for CMS sections and globals. Each builder returns BOTH the Zod schema
// (validation on save + safe parsing on read) and the editor spec (rendered by the generic
// admin form), so the two can never drift apart. Every field has a default, so
// `schema.parse({})` always yields a complete, renderable value.
//
// Conventions (docs/ARCHITECTURE.md §7):
//   - an image is `{ mediaId: "<uuid>" } | null` (media usage is derived from this shape)
//   - every list item has a stable `id`
import { z } from "zod";
import { safeHref } from "@/lib/tiptap/render";

export type FieldSpec =
  | { kind: "text"; label: string; help?: string; max: number; placeholder?: string }
  | { kind: "textarea"; label: string; help?: string; max: number }
  | { kind: "richtext"; label: string; help?: string }
  | { kind: "link"; label: string; help?: string }
  | { kind: "image"; label: string; help?: string }
  | { kind: "select"; label: string; help?: string; options: { value: string; label: string }[] }
  | { kind: "boolean"; label: string; help?: string }
  | { kind: "list"; label: string; help?: string; itemLabel: string; max: number; fields: Record<string, FieldSpec>; titleKey?: string }
  | { kind: "group"; label: string; help?: string; fields: Record<string, FieldSpec> };

export type Field<Z extends z.ZodType = z.ZodType> = { zod: Z; spec: FieldSpec };
export type Fields = Record<string, Field>;
export type FieldsValue<F extends Fields> = { [K in keyof F]: z.output<F[K]["zod"]> };

export type ImageRef = { mediaId: string } | null;
export type LinkValue = { label: string; href: string };
export type RichText = { type: "doc"; content: unknown[] };

const EMPTY_DOC: RichText = { type: "doc", content: [] };

export const f = {
  text: (label: string, o: { help?: string; max?: number; default?: string; placeholder?: string } = {}) => ({
    zod: z.string().max(o.max ?? 300).default(o.default ?? ""),
    spec: { kind: "text", label, help: o.help, max: o.max ?? 300, placeholder: o.placeholder } as FieldSpec,
  }),
  textarea: (label: string, o: { help?: string; max?: number; default?: string } = {}) => ({
    zod: z.string().max(o.max ?? 5000).default(o.default ?? ""),
    spec: { kind: "textarea", label, help: o.help, max: o.max ?? 5000 } as FieldSpec,
  }),
  richtext: (label: string, o: { help?: string } = {}) => ({
    zod: z
      .looseObject({ type: z.literal("doc"), content: z.array(z.unknown()) })
      .refine((d) => JSON.stringify(d).length <= 200_000, "Too much text in one section")
      .default(EMPTY_DOC) as unknown as z.ZodType<RichText, unknown>,
    spec: { kind: "richtext", label, help: o.help } as FieldSpec,
  }),
  link: (label: string, o: { help?: string; default?: LinkValue } = {}) => ({
    zod: z
      .object({
        label: z.string().max(80).default(""),
        href: z
          .string()
          .trim()
          .max(500)
          .default("")
          .refine((h) => h === "" || safeHref(h) !== null, "Use https://…, mailto:…, tel:… or a page path like /about"),
      })
      .default(o.default ?? { label: "", href: "" }),
    spec: { kind: "link", label, help: o.help } as FieldSpec,
  }),
  image: (label: string, o: { help?: string } = {}) => ({
    zod: z.object({ mediaId: z.uuid() }).nullable().default(null),
    spec: { kind: "image", label, help: o.help } as FieldSpec,
  }),
  select: <const V extends readonly [string, ...string[]]>(
    label: string,
    options: { [K in keyof V]: { value: V[K]; label: string } },
    o: { help?: string; default?: V[number] } = {},
  ) => ({
    zod: z.enum(options.map((x) => x.value) as unknown as V).default((o.default ?? options[0].value) as never),
    spec: { kind: "select", label, help: o.help, options: [...options] } as FieldSpec,
  }),
  boolean: (label: string, o: { help?: string; default?: boolean } = {}) => ({
    zod: z.boolean().default(o.default ?? false),
    spec: { kind: "boolean", label, help: o.help } as FieldSpec,
  }),
  /** A nested set of fields stored as one object (e.g. PayPal settings). */
  group: <F extends Fields>(label: string, fields: F, o: { help?: string } = {}) => ({
    zod: z.preprocess((v) => v ?? {}, z.object(mapZod(fields))) as unknown as z.ZodType<FieldsValue<F>, unknown>,
    spec: { kind: "group", label, help: o.help, fields: mapSpec(fields) } as FieldSpec,
  }),
  list: <F extends Fields>(label: string, itemLabel: string, fields: F, o: { help?: string; max?: number; titleKey?: keyof F & string } = {}) => {
    const item = z.object({ id: z.string().min(1).max(40), ...mapZod(fields) }) as unknown as z.ZodType<{ id: string } & FieldsValue<F>, unknown>;
    return {
      zod: z.array(item).max(o.max ?? 50).default([]),
      spec: { kind: "list", label, help: o.help, itemLabel, max: o.max ?? 50, fields: mapSpec(fields), titleKey: o.titleKey } as FieldSpec,
    };
  },
};

/** Default value for a spec (used by the editor when adding a list item). Mirrors the Zod defaults. */
export function defaultForSpec(spec: FieldSpec): unknown {
  switch (spec.kind) {
    case "text":
    case "textarea":
      return "";
    case "richtext":
      return { type: "doc", content: [] };
    case "link":
      return { label: "", href: "" };
    case "image":
      return null;
    case "select":
      return spec.options[0]?.value ?? "";
    case "boolean":
      return false;
    case "list":
      return [];
    case "group":
      return Object.fromEntries(Object.entries(spec.fields).map(([k, s]) => [k, defaultForSpec(s)]));
  }
}

export function newListItem(spec: Extract<FieldSpec, { kind: "list" }>): Record<string, unknown> {
  return { id: newItemId(), ...(defaultForSpec({ kind: "group", label: "", fields: spec.fields }) as Record<string, unknown>) };
}

function mapZod(fields: Fields): Record<string, z.ZodType> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.zod]));
}
function mapSpec(fields: Fields): Record<string, FieldSpec> {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.spec]));
}

/** The Zod object for a set of fields. Unknown keys are dropped. */
export function schemaOf<F extends Fields>(fields: F) {
  return z.object(mapZod(fields)) as unknown as z.ZodType<FieldsValue<F>, unknown>;
}

/** Editor specs in declaration order. */
export function specsOf(fields: Fields): Record<string, FieldSpec> {
  return mapSpec(fields);
}

/** Every `mediaId` referenced anywhere in a JSON value (same rule as the DB's extract_media_ids). */
export function collectMediaIds(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => collectMediaIds(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "mediaId" && typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v)) out.add(v);
      else collectMediaIds(v, out);
    }
  }
  return out;
}

/** Short stable id for new list items. */
export function newItemId(): string {
  return Math.random().toString(36).slice(2, 10);
}
