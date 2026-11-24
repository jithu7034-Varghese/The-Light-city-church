// Seed the CMS pages + globals from supabase/seed/pages/*.ts (old-site wording) and upload the
// church images from /public into the media bucket.
//
//   npx tsx supabase/seed-pages.ts            create what's missing, skip existing rows
//   npx tsx supabase/seed-pages.ts --force    overwrite existing pages/globals/images with the seed
//
// Uses the service role (docs/ARCHITECTURE.md §7: "seed") and publishes through the same DB
// functions as the admin (publish_page / publish_global).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../src/lib/supabase/database.types";
import { SEED_PAGES } from "./seed/pages";
import { GLOBAL_SEED } from "./seed/pages/globals";
import { SEED_IMAGES, type SeedImageFile } from "./seed/pages/helpers";
import { resolveSeedImages } from "./seed/pages/resolve";

const root = path.resolve(import.meta.dirname, "..");
for (const file of [".env.local", ".env"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) process.loadEnvFile(p);
}
const force = process.argv.includes("--force");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || url.includes("YOUR-PROJECT")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
const db = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const MIME: Record<string, string> = { ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function seedImages(): Promise<Record<SeedImageFile, string>> {
  const ids = {} as Record<SeedImageFile, string>;
  for (const [file, alt] of Object.entries(SEED_IMAGES) as [SeedImageFile, string][]) {
    const storagePath = `seed/${file}`;
    const { data: existing } = await db.from("media").select("id").eq("storage_path", storagePath).maybeSingle();
    if (existing && !force) {
      ids[file] = existing.id;
      continue;
    }
    const buffer = fs.readFileSync(path.join(root, "public", file));
    const meta = await sharp(buffer).metadata();
    const mime = MIME[path.extname(file).toLowerCase()];
    const { error: upErr } = await db.storage.from("media").upload(storagePath, buffer, { contentType: mime, upsert: true, cacheControl: "31536000" });
    if (upErr) throw new Error(`upload ${file}: ${upErr.message}`);
    const row = { file_name: file, storage_path: storagePath, mime, size_bytes: buffer.length, width: meta.width ?? null, height: meta.height ?? null, alt };
    const { data, error } = existing
      ? await db.from("media").update(row).eq("id", existing.id).select("id").single()
      : await db.from("media").insert(row).select("id").single();
    if (error || !data) throw new Error(`media row ${file}: ${error?.message}`);
    ids[file] = data.id;
    console.log(`  image ${existing ? "updated" : "uploaded"}: ${file}`);
  }
  return ids;
}

async function seedPages(images: Record<SeedImageFile, string>) {
  const results: { slug: string; title: string; result: "created" | "replaced" | "skipped" }[] = [];
  for (const [order, page] of SEED_PAGES.entries()) {
    const { data: existing } = await db.from("pages").select("id").eq("slug", page.slug).maybeSingle();
    if (existing && !force) {
      results.push({ slug: page.slug, title: page.title, result: "skipped" });
      continue;
    }
    let pageId = existing?.id;
    if (existing) {
      const { error } = await db.from("page_sections").delete().eq("page_id", existing.id);
      if (error) throw new Error(`clear ${page.slug}: ${error.message}`);
      await db.from("pages").update({ title: page.title, seo: page.seo as NonNullable<Json>, seo_title: page.seo.title ?? null, seo_description: page.seo.description ?? null, sort_order: order }).eq("id", existing.id);
    } else {
      const { data, error } = await db.from("pages").insert({ slug: page.slug, title: page.title, seo: page.seo as NonNullable<Json>, seo_title: page.seo.title ?? null, seo_description: page.seo.description ?? null, sort_order: order }).select("id").single();
      if (error || !data) throw new Error(`create ${page.slug}: ${error?.message}`);
      pageId = data.id;
    }
    const rows = page.sections.map((s, i) => ({
      page_id: pageId!,
      type: s.type,
      sort_order: i,
      visible: s.visible ?? true,
      schema_version: 1,
      data: resolveSeedImages(s.data, images) as NonNullable<Json>,
    }));
    const { error: secErr } = await db.from("page_sections").insert(rows);
    if (secErr) throw new Error(`sections ${page.slug}: ${secErr.message}`);
    const { error: pubErr } = await db.rpc("publish_page", { p_page_id: pageId!, p_note: "Seeded from the old site" });
    if (pubErr) throw new Error(`publish ${page.slug}: ${pubErr.message}`);
    results.push({ slug: page.slug, title: page.title, result: existing ? "replaced" : "created" });
  }
  return results;
}

async function seedGlobals(images: Record<SeedImageFile, string>) {
  const results: { key: string; result: "created" | "replaced" | "skipped" }[] = [];
  for (const [key, value] of Object.entries(GLOBAL_SEED) as [keyof typeof GLOBAL_SEED, unknown][]) {
    const { data: existing } = await db.from("globals").select("key, published").eq("key", key).maybeSingle();
    const hasContent = existing && existing.published && Object.keys(existing.published as object).length > 0;
    if (hasContent && !force) {
      results.push({ key, result: "skipped" });
      continue;
    }
    const draft = resolveSeedImages(value, images) as NonNullable<Json>;
    const { error } = await db.from("globals").upsert({ key, draft, has_unpublished_changes: true }, { onConflict: "key" });
    if (error) throw new Error(`global ${key}: ${error.message}`);
    const { error: pubErr } = await db.rpc("publish_global", { p_key: key });
    if (pubErr) throw new Error(`publish ${key}: ${pubErr.message}`);
    results.push({ key, result: hasContent ? "replaced" : "created" });
  }
  return results;
}

async function main() {
  console.log(`Seeding CMS into ${new URL(url!).host}${force ? " (--force: overwriting existing)" : ""}`);
  const images = await seedImages();
  const pages = await seedPages(images);
  const globals = await seedGlobals(images);
  console.log("\nPages:");
  for (const p of pages) console.log(`  ${p.result.padEnd(8)} /${p.slug === "home" ? "" : p.slug}  (${p.title})`);
  console.log("Globals:");
  for (const g of globals) console.log(`  ${g.result.padEnd(8)} ${g.key}`);
  const { count } = await db.from("pages").select("id", { count: "exact", head: true }).eq("status", "published");
  console.log(`\nPublished pages in the database: ${count}`);
}

main().catch((e) => {
  console.error("Seed failed:", e?.message ?? e);
  process.exit(1);
});
