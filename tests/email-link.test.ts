import { describe, expect, it } from "vitest";
import { cleanEmailLinkUrl, friendlyLinkError, readEmailLink } from "@/lib/auth/email-link";

const base = "https://church.example/admin/accept-invite";

describe("readEmailLink", () => {
  it("finds nothing on a plain URL", () => {
    expect(readEmailLink(base)).toEqual({ kind: "none" });
  });

  it("reads implicit-flow tokens from the hash (default invite email)", () => {
    expect(readEmailLink(`${base}#access_token=AT&expires_in=3600&refresh_token=RT&token_type=bearer&type=invite`)).toEqual({
      kind: "tokens",
      accessToken: "AT",
      refreshToken: "RT",
      type: "invite",
    });
  });

  it("reads a PKCE ?code= (default reset email)", () => {
    expect(readEmailLink("https://church.example/admin/reset-password?code=abc-123")).toEqual({ kind: "code", code: "abc-123" });
  });

  it("reports errors from the hash or the query", () => {
    expect(readEmailLink(`${base}#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired`)).toEqual({
      kind: "error",
      code: "otp_expired",
      message: "Email link is invalid or has expired",
    });
    expect(readEmailLink(`${base}?error=server_error`).kind).toBe("error");
  });

  it("prefers an error over tokens", () => {
    expect(readEmailLink(`${base}#access_token=AT&refresh_token=RT&error=x`).kind).toBe("error");
  });

  it("ignores half a token pair", () => {
    expect(readEmailLink(`${base}#access_token=AT`).kind).toBe("none");
  });
});

describe("cleanEmailLinkUrl", () => {
  it("removes tokens, codes and errors but keeps other params", () => {
    expect(cleanEmailLinkUrl(`${base}?code=abc&next=%2Fadmin#access_token=AT`)).toBe("/admin/accept-invite?next=%2Fadmin");
    expect(cleanEmailLinkUrl(`${base}#error=x`)).toBe("/admin/accept-invite");
  });
});

describe("friendlyLinkError", () => {
  it("explains expired links", () => {
    expect(friendlyLinkError("otp_expired")).toMatch(/expired/);
    expect(friendlyLinkError(null)).toMatch(/couldn't sign you in/);
  });
});
