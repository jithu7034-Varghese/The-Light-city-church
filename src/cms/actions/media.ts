"use server";
// Simple media upload (fast-track): signed direct upload to the public "media" bucket, then a
// media row with required alt text. No variants yet (docs/ARCHITECTURE.md §10 is the full plan).
//   1. createMediaUpload  → checks media.edit, returns a one-time signed upload token
//   2. browser uploads the file straight to Storage (never through our server: Vercel's 4.5 MB limit)
//   3. saveUploadedMedia  → checks the stored object, inserts the row AS THE USER (RLS + audit trigger)
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MEDIA_BUCKET, publicMediaUrl } from "@/lib/media/url";

export type MediaItem = { id: string; url: string; alt: string; title: string | null; width: number | null; height: number | null };
export type MediaResult<T> = { ok: true; data: T } | { ok: false; error: string };

const MAX_BYTES = 10 * 1024 * 1024;
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as const;
const mime = z.enum(Object.keys(EXT) as [keyof typeof EXT, ...(keyof typeof EXT)[]], { error: "Use a JPG, PNG, WebP, GIF or AVIF image" });
const PATH = /^uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|gif|avif)$/;

const NO_PERMISSION = { ok: false as const, error: "You don't have permission to upload images." };

export async function createMediaUpload(input: { mime: string; size: number }): Promise<MediaResult<{ path: string; token: string }>> {
  const parsed = z.object({ mime, size: z.number().int().positive().max(MAX_BYTES, "Images must be 10 MB or smaller") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file" };
  const user = await requireStaff();
  if (!can(user, "media", "edit")) return NO_PERMISSION;

  const now = new Date();
  const path = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${EXT[parsed.data.mime]}`;
  const { data, error } = await createSupabaseAdminClient().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[media] sign failed", error?.message);
    return { ok: false, error: "Couldn't start the upload. Please try again." };
  }
  return { ok: true, data: { path: data.path, token: data.token } };
}

const saveSchema = z.object({
  path: z.string().regex(PATH),
  fileName: z.string().trim().min(1).max(200),
  alt: z.string().trim().min(1, "Describe the image for people who can't see it (alt text)").max(250),
  title: z.string().trim().max(200).optional(),
  width: z.number().int().positive().max(20000).nullable(),
  height: z.number().int().positive().max(20000).nullable(),
});

export async function saveUploadedMedia(input: z.input<typeof saveSchema>): Promise<MediaResult<MediaItem>> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid image details" };
  const user = await requireStaff();
  if (!can(user, "media", "edit")) return NO_PERMISSION;
  const { path, fileName, alt, title, width, height } = parsed.data;

  // Trust what Storage holds, not what the browser says.
  const admin = createSupabaseAdminClient();
  const dir = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data: objects } = await admin.storage.from(MEDIA_BUCKET).list(dir, { search: name, limit: 1 });
  const object = objects?.find((o) => o.name === name);
  const meta = (object?.metadata ?? {}) as { size?: number; mimetype?: string };
  if (!object || !meta.mimetype || !(meta.mimetype in EXT) || (meta.size ?? 0) > MAX_BYTES) {
    if (object) await admin.storage.from(MEDIA_BUCKET).remove([path]);
    return { ok: false, error: "The upload didn't finish or isn't a supported image. Please try again." };
  }

  // As the user: RLS checks media.edit again and the media audit trigger records who uploaded it.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("media")
    .insert({ file_name: fileName, storage_path: path, mime: meta.mimetype, size_bytes: meta.size ?? 0, width, height, alt, title: title || null, uploaded_by: user.id })
    .select("id, storage_path, alt, title, width, height")
    .single();
  if (error || !data) {
    await admin.storage.from(MEDIA_BUCKET).remove([path]);
    return { ok: false, error: "Couldn't save the image. Please try again." };
  }
  return { ok: true, data: { id: data.id, url: publicMediaUrl(data.storage_path), alt: data.alt, title: data.title, width: data.width, height: data.height } };
}

export async function listMedia(input: { q?: string; page?: number }): Promise<MediaResult<{ items: MediaItem[]; hasMore: boolean }>> {
  const parsed = z.object({ q: z.string().trim().max(100).optional(), page: z.number().int().min(1).max(500).default(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid search" };
  const user = await requireStaff();
  if (!can(user, "media", "view")) return { ok: false, error: "You don't have access to the media library." };

  const size = 24;
  const from = (parsed.data.page - 1) * size;
  const supabase = await createSupabaseServerClient();
  let q = supabase.from("media").select("id, storage_path, alt, title, width, height").order("created_at", { ascending: false }).range(from, from + size);
  if (parsed.data.q) {
    const term = parsed.data.q.replace(/[%_,()\\]/g, " ");
    q = q.or(`alt.ilike.%${term}%,title.ilike.%${term}%,file_name.ilike.%${term}%`);
  }
  const { data, error } = await q;
  if (error) return { ok: false, error: "Couldn't load images." };
  const rows = data ?? [];
  return {
    ok: true,
    data: {
      items: rows.slice(0, size).map((m) => ({ id: m.id, url: publicMediaUrl(m.storage_path), alt: m.alt, title: m.title, width: m.width, height: m.height })),
      hasMore: rows.length > size,
    },
  };
}
