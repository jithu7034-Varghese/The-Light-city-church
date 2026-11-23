import { describe, expect, it } from "vitest";
import { can, type RolePermissionRow } from "@/lib/auth/permissions";

const row = (module: string, flags: Partial<RolePermissionRow> = {}): RolePermissionRow => ({
  role: "editor",
  module,
  can_view: false,
  can_edit: false,
  can_publish: false,
  can_delete: false,
  can_sensitive: false,
  ...flags,
});

const editor = {
  role: "editor" as const,
  isActive: true,
  permissions: [row("pages", { can_view: true, can_edit: true, can_publish: true }), row("media", { can_view: true })],
};

describe("can()", () => {
  it("denies when there is no user", () => {
    expect(can(null, "pages", "view")).toBe(false);
    expect(can(undefined, "pages", "view")).toBe(false);
  });

  it("follows the role's matrix row", () => {
    expect(can(editor, "pages", "publish")).toBe(true);
    expect(can(editor, "media", "view")).toBe(true);
    expect(can(editor, "media", "delete")).toBe(false);
  });

  it("denies modules with no row", () => {
    expect(can(editor, "enquiries", "view")).toBe(false);
  });

  it("ignores rows that belong to another role", () => {
    const sneaky = { ...editor, role: "viewer" as const };
    expect(can(sneaky, "pages", "edit")).toBe(false);
  });

  it("lets an active super admin do everything without matrix rows", () => {
    const sa = { role: "super_admin" as const, isActive: true, permissions: [] };
    expect(can(sa, "users", "delete")).toBe(true);
    expect(can(sa, "enquiries", "sensitive")).toBe(true);
  });

  it("denies inactive users, including super admins", () => {
    expect(can({ ...editor, isActive: false }, "pages", "view")).toBe(false);
    expect(can({ role: "super_admin", isActive: false, permissions: [] }, "pages", "view")).toBe(false);
  });
});
