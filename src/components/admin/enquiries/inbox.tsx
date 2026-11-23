"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Download, Inbox as InboxIcon, Search, Star, Trash2, X } from "lucide-react";
import {
  Alert, Button, buttonStyles, Card, Checkbox, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, toast,
} from "../ui";
import { cn } from "../ui/cn";
import { PrivateBadge, StatusBadge } from "./status-badge";
import { EnquiryDrawer } from "./enquiry-drawer";
import { formatDateTime as formatDate } from "../format";
import {
  filtersToQuery, hasActiveFilters, STATUSES, STATUS_LABELS, type EnquiryFilters, type EnquiryStatus,
} from "@/lib/enquiries/filters";
import {
  assignEnquiries, deleteEnquiries, deleteSavedFilter, saveEnquiryFilter, setEnquiryStatus, type ActionResult,
} from "@/cms/actions/enquiries";

export type InboxRow = {
  id: string;
  type: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: EnquiryStatus;
  assigned_to: string | null;
  created_at: string;
  is_sensitive: boolean;
  form_id: string | null;
  contact_id: string | null;
  source_page: string | null;
  data: unknown;
};

export type InboxDetail = {
  enquiry: InboxRow & { consent: boolean; expires_at: string | null };
  notes: { id: string; body: string; created_at: string; author_id: string | null }[];
  fields: { key: string; label: string; value: string }[];
};

export type Option = { id: string; name: string };
export type InboxPermissions = { edit: boolean; remove: boolean; convert: boolean };


export function Inbox(props: {
  rows: InboxRow[];
  total: number;
  pageCount: number;
  filters: EnquiryFilters;
  loadError: boolean;
  forms: Option[];
  staff: Option[];
  savedFilters: { id: string; name: string; query: string }[];
  detail: InboxDetail | null;
  detailMissing: boolean;
  currentUserId: string;
  permissions: InboxPermissions;
}) {
  const { rows, total, pageCount, filters, forms, staff, permissions } = props;
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const formName = useMemo(() => new Map(forms.map((f) => [f.id, f.name])), [forms]);
  const staffName = useMemo(() => new Map(staff.map((s) => [s.id, s.name])), [staff]);
  const query = filtersToQuery(filters);
  const activeSaved = props.savedFilters.find((s) => s.query === query);

  function navigate(next: Partial<EnquiryFilters>, open?: string | null) {
    const merged = { ...filters, ...next };
    const qs = new URLSearchParams(filtersToQuery(merged, { includePage: true }));
    if (open) qs.set("open", open);
    setSelected(new Set());
    router.push(`/admin/enquiries${qs.size ? `?${qs}` : ""}`, { scroll: false });
  }
  const setFilter = (next: Partial<EnquiryFilters>) => navigate({ ...next, page: 1 });
  const detailHref = (id: string) => {
    const qs = new URLSearchParams(filtersToQuery(filters, { includePage: true }));
    qs.set("open", id);
    return `/admin/enquiries?${qs}`;
  };

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        if (result.message) toast.success(result.message);
        setSelected(new Set());
        after?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  const ids = [...selected];
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allOnPage ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="space-y-4">
      {/* ---------- Filters ---------- */}
      <Card className="p-4">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
            setFilter({ q: q || undefined });
          }}
        >
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input key={filters.q ?? ""} name="q" defaultValue={filters.q} placeholder="Search name, email, phone or message…" aria-label="Search enquiries" className="pl-9" />
          </div>
          <Select aria-label="Form" value={filters.form ?? ""} onChange={(e) => setFilter({ form: e.target.value || undefined })}>
            <option value="">All forms</option>
            {forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </Select>
          <Select aria-label="Status" value={filters.status ?? ""} onChange={(e) => setFilter({ status: (e.target.value || undefined) as EnquiryStatus | undefined })}>
            <option value="">Any status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </Select>
          <Select aria-label="Assigned to" value={filters.assignee ?? ""} onChange={(e) => setFilter({ assignee: e.target.value || undefined })}>
            <option value="">Anyone</option>
            <option value="me">Assigned to me</option>
            <option value="none">Unassigned</option>
            {staff.filter((s) => s.id !== props.currentUserId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
            <Input type="date" aria-label="Received from" value={filters.from ?? ""} max={filters.to} onChange={(e) => setFilter({ from: e.target.value || undefined })} />
            <span className="text-sm text-muted">to</span>
            <Input type="date" aria-label="Received to" value={filters.to ?? ""} min={filters.from} onChange={(e) => setFilter({ to: e.target.value || undefined })} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end">
            <button type="submit" className="sr-only">Search</button>
            {hasActiveFilters(filters) && (
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin/enquiries")}>
                <X className="size-4" aria-hidden /> Clear filters
              </Button>
            )}
            <SavedFilters
              saved={props.savedFilters}
              activeId={activeSaved?.id}
              onPick={(q) => router.push(`/admin/enquiries${q ? `?${q}` : ""}`)}
              onDelete={(id) => run(() => deleteSavedFilter({ id }))}
            />
            {hasActiveFilters(filters) && !activeSaved && (
              <Button variant="secondary" size="sm" onClick={() => setSaveOpen(true)}>
                <Star className="size-4" aria-hidden /> Save filter
              </Button>
            )}
            <a href={`/api/enquiries/export${query ? `?${query}` : ""}`} className={buttonStyles("secondary", "sm")} download>
              <Download className="size-4" aria-hidden /> Export CSV
            </a>
          </div>
        </form>
      </Card>

      {props.loadError && <Alert tone="danger">We couldn&apos;t load enquiries. Refresh the page to try again.</Alert>}
      {props.detailMissing && <Alert tone="warning">That enquiry doesn&apos;t exist any more, or you don&apos;t have access to it.</Alert>}

      {/* ---------- Bulk actions ---------- */}
      {selected.size > 0 && (permissions.edit || permissions.remove) && (
        <div className="sticky top-16 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-info-soft px-4 py-2.5" role="toolbar" aria-label="Bulk actions">
          <span className="mr-2 text-sm font-medium">{selected.size} selected</span>
          {permissions.edit && (
            <>
              {(["read", "follow_up", "closed"] as const).map((s) => (
                <Button key={s} size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setEnquiryStatus({ ids, status: s }))}>
                  {s === "read" ? "Mark read" : s === "follow_up" ? "Follow-up" : "Close"}
                </Button>
              ))}
              <Select
                aria-label="Assign selected to"
                className="h-8 w-auto text-sm"
                value=""
                disabled={pending}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) run(() => assignEnquiries({ ids, assigneeId: v === "none" ? null : v }));
                }}
              >
                <option value="">Assign to…</option>
                <option value="none">Nobody (unassign)</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </>
          )}
          {permissions.remove && (
            <Button size="sm" variant="danger" disabled={pending} onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>Clear selection</Button>
        </div>
      )}

      {/* ---------- Table ---------- */}
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title={hasActiveFilters(filters) ? "No enquiries match these filters" : "No enquiries yet"}
            description={hasActiveFilters(filters) ? "Try clearing some filters." : "Messages sent through the website's forms will appear here."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-subtle/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="w-10 px-4 py-3">
                    <Checkbox checked={allOnPage} onChange={toggleAll} aria-label="Select all on this page" />
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">From</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Form</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">Assigned</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium sm:table-cell">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const unread = r.status === "unread";
                  const preview = String((r.data as Record<string, unknown> | null)?.message ?? "");
                  return (
                    <tr
                      key={r.id}
                      className={cn("cursor-pointer hover:bg-subtle/60", selected.has(r.id) && "bg-info-soft/60")}
                      onClick={() => navigate({}, r.id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select enquiry from ${r.name ?? r.email ?? "unknown"}`} />
                      </td>
                      <td className="max-w-0 px-3 py-3">
                        <Link
                          href={detailHref(r.id)}
                          scroll={false}
                          onClick={(e) => e.stopPropagation()}
                          className={cn("block truncate hover:underline", unread ? "font-semibold text-fg" : "text-fg")}
                        >
                          {unread && <span className="mr-1.5 inline-block size-2 rounded-full bg-primary align-middle" aria-label="Unread" />}
                          {r.name || r.email || "No name"}
                        </Link>
                        <p className="truncate text-xs text-muted">
                          {r.is_sensitive ? "Private message" : preview || r.email || ""}
                        </p>
                      </td>
                      <td className="hidden px-3 py-3 md:table-cell">
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          {(r.form_id && formName.get(r.form_id)) || r.type}
                          {r.is_sensitive && <PrivateBadge />}
                        </span>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-muted lg:table-cell">
                        {r.assigned_to ? (staffName.get(r.assigned_to) ?? "Former staff") : "—"}
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-muted sm:table-cell">{formatDate(r.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------- Pagination ---------- */}
      {total > 0 && (
        <nav className="flex items-center justify-between text-sm text-muted" aria-label="Pagination">
          <span>
            {total} {total === 1 ? "enquiry" : "enquiries"} · page {filters.page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={filters.page <= 1} onClick={() => navigate({ page: filters.page - 1 })}>
              <ChevronLeft className="size-4" aria-hidden /> Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={filters.page >= pageCount} onClick={() => navigate({ page: filters.page + 1 })}>
              Next <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        </nav>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => run(() => deleteEnquiries({ ids }), () => setConfirmDelete(false))}
        loading={pending}
        title={`Delete ${selected.size === 1 ? "this enquiry" : `${selected.size} enquiries`}?`}
        description="They'll be removed permanently, with their notes. This can't be undone."
      />

      <SaveFilterDialog
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={(name) => run(() => saveEnquiryFilter({ name, query }), () => setSaveOpen(false))}
        pending={pending}
      />

      {props.detail && (
        <EnquiryDrawer
          key={props.detail.enquiry.id}
          detail={props.detail}
          formName={(props.detail.enquiry.form_id && formName.get(props.detail.enquiry.form_id)) || props.detail.enquiry.type}
          staff={staff}
          permissions={permissions}
          onClose={() => navigate({})}
        />
      )}
    </div>
  );
}

function SavedFilters({
  saved,
  activeId,
  onPick,
  onDelete,
}: {
  saved: { id: string; name: string; query: string }[];
  activeId?: string;
  onPick: (query: string) => void;
  onDelete: (id: string) => void;
}) {
  if (saved.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Select
        aria-label="Saved filters"
        className="h-8 w-auto text-sm"
        value={activeId ?? ""}
        onChange={(e) => {
          const s = saved.find((x) => x.id === e.target.value);
          if (s) onPick(s.query);
        }}
      >
        <option value="">Saved filters…</option>
        {saved.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      {activeId && (
        <Button variant="ghost" size="sm" onClick={() => onDelete(activeId)} aria-label="Remove this saved filter" title="Remove this saved filter">
          <Trash2 className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}

function SaveFilterDialog({
  open,
  onClose,
  onSave,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Save this filter"
      description="Saved filters are private to you."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(name)} loading={pending} disabled={!name.trim()}>Save</Button>
        </>
      }
    >
      <Field label="Name">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. My follow-ups" autoFocus />
      </Field>
    </Dialog>
  );
}
