"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Mail, Phone, Trash2, UserPlus, UserCheck } from "lucide-react";
import { Button, buttonStyles, ConfirmDialog, Field, Label, Select, Sheet, Textarea, toast } from "../ui";
import { PrivateBadge, StatusBadge } from "./status-badge";
import type { InboxDetail, InboxPermissions, Option } from "./inbox";
import { formatDateTime as formatDate, formatLongDate } from "../format";
import { STATUSES, STATUS_LABELS, type EnquiryStatus } from "@/lib/enquiries/filters";
import {
  addEnquiryNote, assignEnquiries, convertEnquiryToContact, deleteEnquiries, markEnquiryRead, setEnquiryStatus,
  type ActionResult,
} from "@/cms/actions/enquiries";

export function EnquiryDrawer({
  detail,
  formName,
  staff,
  permissions,
  onClose,
}: {
  detail: InboxDetail;
  formName: string;
  staff: Option[];
  permissions: InboxPermissions;
  onClose: () => void;
}) {
  const { enquiry, notes, fields } = detail;
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const markedRead = useRef(false);
  const staffName = new Map(staff.map((s) => [s.id, s.name]));

  // Opening an unread enquiry marks it read (for people who can change status).
  useEffect(() => {
    if (markedRead.current || enquiry.status !== "unread" || !permissions.edit) return;
    markedRead.current = true;
    void markEnquiryRead(enquiry.id);
  }, [enquiry.id, enquiry.status, permissions.edit]);

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        if (r.message) toast.success(r.message);
        after?.();
      } else {
        toast.error(r.error);
      }
    });
  }

  const ids = [enquiry.id];
  const message = fields.find((f) => f.key === "message");
  const otherFields = fields.filter((f) => !["name", "email", "phone", "message"].includes(f.key));

  return (
    <Sheet
      open
      onClose={onClose}
      title={enquiry.name || enquiry.email || "Enquiry"}
      description={
        <span>
          {formName} · {formatDate(enquiry.created_at)}
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {enquiry.email && (
            <a href={`mailto:${enquiry.email}`} className={buttonStyles("primary", "sm")}>
              <Mail className="size-4" aria-hidden /> Reply by email
            </a>
          )}
          {permissions.convert &&
            (enquiry.contact_id ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <UserCheck className="size-4" aria-hidden /> Saved to People
              </span>
            ) : (
              <Button size="sm" variant="secondary" loading={pending} onClick={() => run(() => convertEnquiryToContact({ id: enquiry.id }))}>
                <UserPlus className="size-4" aria-hidden /> Convert to person
              </Button>
            ))}
          {permissions.remove && (
            <Button size="sm" variant="ghost" className="ml-auto text-danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={enquiry.status} />
          {enquiry.is_sensitive && <PrivateBadge />}
        </div>

        {permissions.edit && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="drawer-status">Status</Label>
              <Select
                id="drawer-status"
                value={enquiry.status}
                disabled={pending}
                onChange={(e) => run(() => setEnquiryStatus({ ids, status: e.target.value as EnquiryStatus }))}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drawer-assignee">Assigned to</Label>
              <Select
                id="drawer-assignee"
                value={enquiry.assigned_to ?? ""}
                disabled={pending}
                onChange={(e) => run(() => assignEnquiries({ ids, assigneeId: e.target.value || null }))}
              >
                <option value="">Nobody</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
          </div>
        )}
        {!permissions.edit && enquiry.assigned_to && (
          <p className="text-sm text-muted">Assigned to {staffName.get(enquiry.assigned_to) ?? "former staff"}</p>
        )}

        <dl className="space-y-3 text-sm">
          {enquiry.email && (
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted" aria-hidden />
              <dt className="sr-only">Email</dt>
              <dd><a href={`mailto:${enquiry.email}`} className="text-primary hover:underline">{enquiry.email}</a></dd>
            </div>
          )}
          {enquiry.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted" aria-hidden />
              <dt className="sr-only">Phone</dt>
              <dd><a href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`} className="text-primary hover:underline">{enquiry.phone}</a></dd>
            </div>
          )}
        </dl>

        {message && (
          <section aria-labelledby="msg-h">
            <h3 id="msg-h" className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">{message.label}</h3>
            <p className="whitespace-pre-wrap rounded-lg bg-subtle p-3 text-sm leading-relaxed">{message.value}</p>
          </section>
        )}

        {otherFields.length > 0 && (
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            {otherFields.map((f) => (
              <div key={f.key} className="contents">
                <dt className="text-muted">{f.label}</dt>
                <dd className="whitespace-pre-wrap">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="text-xs text-muted">
          {enquiry.source_page && <>Sent from {enquiry.source_page}. </>}
          {enquiry.consent && <>Consent given. </>}
          {enquiry.expires_at && <>Deleted automatically on {formatLongDate(enquiry.expires_at)}.</>}
        </p>

        <section aria-labelledby="notes-h" className="space-y-3 border-t border-border pt-5">
          <h3 id="notes-h" className="text-sm font-semibold">Notes {notes.length > 0 && <span className="text-muted">({notes.length})</span>}</h3>
          {notes.length === 0 && <p className="text-sm text-muted">No notes yet. Notes are only visible to staff.</p>}
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1.5 text-xs text-muted">
                  {(n.author_id && staffName.get(n.author_id)) || "Former staff"} · {formatDate(n.created_at)}
                </p>
              </li>
            ))}
          </ul>
          {permissions.edit && (
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => addEnquiryNote({ enquiryId: enquiry.id, body: note }), () => setNote(""));
              }}
            >
              <Field label="Add a note">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={5000} placeholder="e.g. Called back, praying together on Sunday" />
              </Field>
              <Button type="submit" size="sm" loading={pending} disabled={!note.trim()}>Add note</Button>
            </form>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => run(() => deleteEnquiries({ ids }), () => { setConfirmDelete(false); onClose(); })}
        loading={pending}
        title="Delete this enquiry?"
        description="It will be removed permanently with its notes. This can't be undone."
      />
    </Sheet>
  );
}
