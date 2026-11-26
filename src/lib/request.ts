import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** The visitor's IP as seen by Vercel / a proxy, or null locally. */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || null;
}

/**
 * Salted SHA-256 of the IP. We store and rate-limit on this, never the raw IP (UK GDPR:
 * data minimisation). Set IP_HASH_SALT in production so hashes can't be reversed by
 * hashing the whole IPv4 space.
 */
export function hashIp(ip: string | null): string {
  const salt = process.env.IP_HASH_SALT ?? "lcc-dev-salt";
  return createHash("sha256").update(`${salt}:${ip ?? "unknown"}`).digest("hex").slice(0, 32);
}
