// Section registry entries (docs/ARCHITECTURE.md §8): { type, label, schemaVersion, schema,
// upgrade(data, from), defaults(), editor (generic, from field specs), Component }.
import type { ReactNode } from "react";
import { schemaOf, specsOf, type FieldSpec, type Fields, type FieldsValue, type ImageRef } from "./fields";
import type { SiteData } from "./globals";

export type MediaInfo = { id: string; url: string; alt: string; width: number | null; height: number | null };

/** Published "site" global: name, serviceTimes[{id,day,time,venue,address}], email, phone, whatsapp, paypal{business,itemName,currency}, socials[{id,network,url}]. */
export type SiteSettings = SiteData;

/** What every section component receives besides its own data. */
export type SectionCtx = {
  pageSlug: string;
  /** Resolve an image field to its URL + alt text (null if missing or deleted). */
  image: (ref: ImageRef | undefined) => MediaInfo | null;
  site: SiteSettings;
  /** Site settings "Section background image": the fallback photo for photo-backed sections. */
  background: MediaInfo | null;
};

export type SectionComponent<F extends Fields> = (props: { data: FieldsValue<F>; ctx: SectionCtx }) => ReactNode | Promise<ReactNode>;

export type SectionDef<F extends Fields = Fields> = {
  type: string;
  label: string;
  description?: string;
  schemaVersion: number;
  fields: F;
  specs: Record<string, FieldSpec>;
  /** Parse stored data (any version) into the current shape, or null if it can't be used. */
  parse: (data: unknown, fromVersion?: number) => FieldsValue<F> | null;
  /** Validate data from the editor before saving. */
  validate: (data: unknown) => { ok: true; data: FieldsValue<F> } | { ok: false; error: string };
  defaults: () => FieldsValue<F>;
  Component: SectionComponent<F>;
};

export function defineSection<F extends Fields>(def: {
  type: string;
  label: string;
  description?: string;
  schemaVersion?: number;
  fields: F;
  /** Migrate data saved by an older schemaVersion. */
  upgrade?: (data: Record<string, unknown>, fromVersion: number) => Record<string, unknown>;
  Component: SectionComponent<F>;
}): SectionDef<F> {
  const schema = schemaOf(def.fields);
  const version = def.schemaVersion ?? 1;
  const upgrade = (data: unknown, from: number) => {
    const obj = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
    return def.upgrade && from < version ? def.upgrade(obj, from) : obj;
  };
  return {
    type: def.type,
    label: def.label,
    description: def.description,
    schemaVersion: version,
    fields: def.fields,
    specs: specsOf(def.fields),
    Component: def.Component,
    defaults: () => schema.parse({}),
    parse: (data, from = version) => {
      const r = schema.safeParse(upgrade(data, from));
      return r.success ? r.data : null;
    },
    validate: (data) => {
      const r = schema.safeParse(data);
      if (r.success) return { ok: true, data: r.data };
      const issue = r.error.issues[0];
      return { ok: false, error: `${issue?.path.join(" → ") || "section"}: ${issue?.message ?? "invalid"}` };
    },
  };
}
