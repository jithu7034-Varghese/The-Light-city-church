"use client";
import { useState, useTransition } from "react";
import { MailPlus, RotateCw, UserMinus, UserPlus, Users, XCircle } from "lucide-react";
import {
  Alert, Badge, Button, Card, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, toast,
} from "../ui";
import { formatDateTime } from "../format";
import { INVITABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS, type AppRole } from "@/lib/auth/permissions";
import { inviteStaff, resendInvite, revokeInvite, setStaffActive, type UserActionResult } from "@/cms/actions/users";

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  status: "active" | "pending" | "deactivated";
  invitedAt: string | null;
  lastSignIn: string | null;
  isSelf: boolean;
};

const STATUS = {
  active: { label: "Active", tone: "success" },
  pending: { label: "Invite sent", tone: "info" },
  deactivated: { label: "Deactivated", tone: "neutral" },
} as const;

type Confirm = { kind: "revoke" | "deactivate"; row: StaffRow } | null;

export function StaffTable({ rows, authUnavailable }: { rows: StaffRow[]; authUnavailable: boolean }) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<UserActionResult>, after?: () => void) {
    startTransition(async () => {
      const r = await action();
      if (r.ok) {
        toast.success(r.message);
        after?.();
      } else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" aria-hidden /> Invite staff
        </Button>
      </div>
      {authUnavailable && (
        <Alert tone="warning">Couldn&apos;t load sign-in details from Supabase Auth. Invite status may be out of date.</Alert>
      )}

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No staff yet" description="Invite your first colleague to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-subtle/60 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Person</th>
                  <th scope="col" className="px-3 py-3 font-medium">Role</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Last sign-in</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-0 px-4 py-3">
                      <p className="truncate font-medium">{r.name || "No name yet"} {r.isSelf && <span className="font-normal text-muted">(you)</span>}</p>
                      <p className="truncate text-xs text-muted">{r.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{ROLE_LABELS[r.role]}</td>
                    <td className="px-3 py-3"><Badge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</Badge></td>
                    <td className="hidden whitespace-nowrap px-3 py-3 text-muted md:table-cell">
                      {r.lastSignIn ? formatDateTime(r.lastSignIn) : r.invitedAt ? `Invited ${formatDateTime(r.invitedAt)}` : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {!r.isSelf && r.role !== "super_admin" && r.status === "pending" && (
                          <>
                            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => resendInvite({ userId: r.id }))}>
                              <RotateCw className="size-3.5" aria-hidden /> Resend
                            </Button>
                            <Button size="sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => setConfirm({ kind: "revoke", row: r })}>
                              <XCircle className="size-3.5" aria-hidden /> Revoke
                            </Button>
                          </>
                        )}
                        {!r.isSelf && r.role !== "super_admin" && r.status === "active" && (
                          <Button size="sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => setConfirm({ kind: "deactivate", row: r })}>
                            <UserMinus className="size-3.5" aria-hidden /> Deactivate
                          </Button>
                        )}
                        {!r.isSelf && r.status === "deactivated" && (
                          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => setStaffActive({ userId: r.id, active: true }))}>
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <ConfirmDialog
        open={confirm !== null}
        onCancel={() => setConfirm(null)}
        loading={pending}
        confirmLabel={confirm?.kind === "revoke" ? "Revoke invite" : "Deactivate"}
        title={confirm?.kind === "revoke" ? `Revoke the invite for ${confirm.row.email}?` : `Deactivate ${confirm?.row.name || confirm?.row.email}?`}
        description={
          confirm?.kind === "revoke"
            ? "Their invite link will stop working. You can invite them again later."
            : "They'll lose access straight away and be signed out. You can reactivate them later."
        }
        onConfirm={() => {
          if (!confirm) return;
          const { kind, row } = confirm;
          run(
            () => (kind === "revoke" ? revokeInvite({ userId: row.id }) : setStaffActive({ userId: row.id, active: false })),
            () => setConfirm(null),
          );
        }}
      />
    </div>
  );
}

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ email: "", fullName: "", role: "editor" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const role = form.role as (typeof INVITABLE_ROLES)[number];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await inviteStaff(form);
      if (r.ok) {
        toast.success(r.message);
        setForm({ email: "", fullName: "", role: "editor" });
        setErrors({});
        onClose();
      } else {
        setErrors(r.fieldErrors ?? {});
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Invite a staff member"
      description="They'll get an email with a link to set their password. Admins must also set up 2FA."
    >
      <form id="invite-form" onSubmit={submit} className="space-y-4 pb-5" noValidate>
        <Field label="Name" error={errors.fullName}>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} autoComplete="off" required />
        </Field>
        <Field label="Email" error={errors.email}>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" required />
        </Field>
        <Field label="Role" hint={ROLE_DESCRIPTIONS[role]} error={errors.role}>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {INVITABLE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>
            <MailPlus className="size-4" aria-hidden /> Send invite
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
