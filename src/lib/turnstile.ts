import "server-only";

export type TurnstileResult = { ok: true; skipped?: boolean } | { ok: false; reason: string };

/**
 * Verify a Cloudflare Turnstile token. Without TURNSTILE_SECRET_KEY (local dev, or before
 * the church's Cloudflare account exists) the check is skipped with a warning, and the
 * rate limiter + honeypot still apply.
 */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("[turnstile] TURNSTILE_SECRET_KEY not set: skipping spam check");
    return { ok: true, skipped: true };
  }
  if (!token) return { ok: false, reason: "missing-token" };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    return json.success ? { ok: true } : { ok: false, reason: (json["error-codes"] ?? ["failed"]).join(",") };
  } catch (e) {
    console.error("[turnstile] verification request failed", e);
    return { ok: false, reason: "unreachable" };
  }
}
