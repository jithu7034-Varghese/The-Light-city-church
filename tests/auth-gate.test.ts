import { describe, expect, it } from "vitest";
import { authGate, isMfaRequired, isPublicAdminPath, safeAdminRedirect, type GateInput } from "@/lib/auth/gate";

const base: GateInput = {
  hasUser: true,
  isActive: true,
  role: "editor",
  requireMfa: false,
  currentLevel: "aal1",
  nextLevel: "aal1",
};

describe("authGate", () => {
  it("sends visitors without a session to login", () => {
    expect(authGate({ ...base, hasUser: false })).toBe("login");
  });

  it("blocks inactive accounts before anything else", () => {
    expect(authGate({ ...base, isActive: false, currentLevel: "aal2" })).toBe("inactive");
  });

  it("lets an editor without 2FA in", () => {
    expect(authGate(base)).toBe("ok");
  });

  it.each(["super_admin", "admin"] as const)("makes %s enrol in 2FA", (role) => {
    expect(authGate({ ...base, role })).toBe("mfa-enroll");
  });

  it("honours require_mfa for other roles", () => {
    expect(authGate({ ...base, requireMfa: true })).toBe("mfa-enroll");
  });

  it("challenges anyone who has a verified factor but an aal1 session", () => {
    expect(authGate({ ...base, nextLevel: "aal2" })).toBe("mfa-verify");
    expect(authGate({ ...base, role: "admin", nextLevel: "aal2" })).toBe("mfa-verify");
  });

  it("lets an aal2 session in", () => {
    expect(authGate({ ...base, role: "super_admin", currentLevel: "aal2", nextLevel: "aal2" })).toBe("ok");
  });
});

describe("isMfaRequired", () => {
  it("is required for admins and opt-in for others", () => {
    expect(isMfaRequired("super_admin", false)).toBe(true);
    expect(isMfaRequired("admin", false)).toBe(true);
    expect(isMfaRequired("viewer", false)).toBe(false);
    expect(isMfaRequired("viewer", true)).toBe(true);
  });
});

describe("isPublicAdminPath", () => {
  it("allows only the login, reset and accept-invite pages without a session", () => {
    expect(isPublicAdminPath("/admin/login")).toBe(true);
    expect(isPublicAdminPath("/admin/reset-password")).toBe(true);
    expect(isPublicAdminPath("/admin/accept-invite")).toBe(true);
    expect(isPublicAdminPath("/admin")).toBe(false);
    expect(isPublicAdminPath("/admin/mfa")).toBe(false);
    expect(isPublicAdminPath("/admin/loginx")).toBe(false);
  });
});

describe("safeAdminRedirect", () => {
  it("keeps admin paths", () => {
    expect(safeAdminRedirect("/admin")).toBe("/admin");
    expect(safeAdminRedirect("/admin/pages/home?tab=seo")).toBe("/admin/pages/home?tab=seo");
    expect(safeAdminRedirect("/admin?x=1")).toBe("/admin?x=1");
  });

  it.each([
    undefined,
    null,
    "",
    "https://evil.example/admin",
    "//evil.example/admin",
    "/\\evil.example",
    "/admin\\..\\evil",
    "/administrator",
    "/about",
    "javascript:alert(1)",
    "/admin/\nSet-Cookie:x",
  ])("rejects %j", (value) => {
    expect(safeAdminRedirect(value)).toBe("/admin");
  });

  it("uses the given fallback", () => {
    expect(safeAdminRedirect("https://x", "/admin/accept-invite")).toBe("/admin/accept-invite");
  });
});
