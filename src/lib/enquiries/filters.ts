// Inbox filters live in the URL (?q=&form=&status=&assignee=&from=&to=&page=), so a view
// can be bookmarked, saved as a "saved filter", and reused by the CSV export.
// Pure; unit-tested in tests/enquiry-filters.test.ts.
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

export type EnquiryStatus = Database["public"]["Enums"]["enquiry_status"];
export const STATUSES: EnquiryStatus[] = ["unread", "read", "follow_up", "closed"];
export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  unread: "Unread",
  read: "Read",
  follow_up: "Follow-up",
  closed: "Closed",
};

export const PAGE_SIZE = 25;

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((s) => !Number.isNaN(Date.parse(s)));

const fieldSchemas = {
  q: z.string().trim().min(1).max(100),
  form: z.uuid(),
  status: z.enum(["unread", "read", "follow_up", "closed"]),
  assignee: z.union([z.literal("me"), z.literal("none"), z.uuid()]),
  from: date,
  to: date,
  page: z.coerce.number().int().min(1).max(10_000),
} as const;

export type EnquiryFilters = {
  q?: string;
  form?: string;
  status?: EnquiryStatus;
  assignee?: string;
  from?: string;
  to?: string;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function get(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

/** Parse filters leniently: an invalid value is ignored rather than breaking the page. */
export function parseFilters(params: RawParams): EnquiryFilters {
  const out: EnquiryFilters = { page: 1 };
  for (const key of Object.keys(fieldSchemas) as (keyof typeof fieldSchemas)[]) {
    const raw = get(params, key);
    if (raw === undefined || raw === "") continue;
    const parsed = fieldSchemas[key].safeParse(raw);
    if (parsed.success) (out as Record<string, unknown>)[key] = parsed.data;
  }
  return out;
}

/** Canonical query string for a set of filters (page omitted unless > 1). */
export function filtersToQuery(filters: Partial<EnquiryFilters>, { includePage = false } = {}): string {
  const p = new URLSearchParams();
  for (const key of ["q", "form", "status", "assignee", "from", "to"] as const) {
    const v = filters[key];
    if (v) p.set(key, v);
  }
  if (includePage && filters.page && filters.page > 1) p.set("page", String(filters.page));
  return p.toString();
}

/** Inclusive date range → [start, endExclusive) ISO timestamps (UTC days). */
export function dateBounds(filters: Pick<EnquiryFilters, "from" | "to">) {
  const start = filters.from ? `${filters.from}T00:00:00.000Z` : undefined;
  let end: string | undefined;
  if (filters.to) {
    const d = new Date(`${filters.to}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    end = d.toISOString();
  }
  return { start, end };
}

export function hasActiveFilters(filters: EnquiryFilters): boolean {
  return filtersToQuery(filters) !== "";
}
