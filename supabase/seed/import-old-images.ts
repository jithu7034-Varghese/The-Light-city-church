// Import the old GoDaddy site's images (supabase/seed/raw/old-site-images.json).
//
//   npx tsx supabase/seed/import-old-images.ts                  add what's missing
//   npx tsx supabase/seed/import-old-images.ts --force          also redo posts that already have a featured image
//   npx tsx supabase/seed/import-old-images.ts --include-stock  also use GoDaddy stock-library photos (skipped by default:
//                                                               they show people who aren't from the church)
//
// Uses the service role (docs/ARCHITECTURE.md §7: "seed"). Every image is resized to max 1600px WebP
// and stored once per source URL in the public "media" bucket with a media row (alt text required).
//   - Devotionals: featured (else og) image → devotionals/<slug>.webp → posts.featured_media_id
//   - Gallery: all old gallery photos → Gallery page grid + empty/placeholder slots of the Home photo collage
//   - Page images: About → Pastor Ronnie, The Loved Circle → "Extravagant Love", Home → "Worship with us",
//     only where the current image is empty or a placeholder (never a real church photo). Pages are
//     then published with publish_page().
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../src/lib/supabase/database.types";
import {
  fileNameOf, fullImageUrl, isReplaceable, isStockImage, legacySlugOf, normalizeSlug, pickPostImage, runPool,
} from "./old-images-lib";

type ImageEntry = { url: string; alt: string; section: string; page: string };
type Source = { posts: Record<string, { featured?: string | null; og?: string | null }>; gallery: ImageEntry[]; page_images: ImageEntry[] };

const root = path.resolve(import.meta.dirname, "../..");
for (const file of [".env.local", ".env"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) process.loadEnvFile(p);
}
const force = process.argv.includes("--force");
const includeStock = process.argv.includes("--include-stock");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || url.includes("YOUR-PROJECT")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
const db = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const src = JSON.parse(fs.readFileSync(path.join(root, "supabase/seed/raw/old-site-images.json"), "utf8")) as Source;

const MAX_DOWNLOAD = 30 * 1024 * 1024;
const GALLERY_ALT = "The Light City Church photo gallery";
const failures: string[] = [];
const notes: string[] = [];
let uploaded = 0;

// ---------- one media row per unique source URL ----------
const mediaBySource = new Map<string, Promise<string>>();

async function download(source: string): Promise<Buffer> {
  const res = await fetch(source, { signal: AbortSignal.timeout(45_000), headers: { "User-Agent": "Mozilla/5.0 (compatible; site-migration)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type || "no content-type"})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_DOWNLOAD) throw new Error("larger than 30 MB");
  return buf;
}

/** Download → WebP (max 1600px) → upload to storagePath → media row. Reuses existing rows unless --force. */
function importImage(source: string, storagePath: string, alt: string): Promise<string> {
  const cached = mediaBySource.get(source);
  if (cached) return cached;
  const job = (async () => {
    const { data: existing } = await db.from("media").select("id").eq("storage_path", storagePath).maybeSingle();
    if (existing && !force) return existing.id;
    const original = await download(source);
    const { data: webp, info } = await sharp(original, { failOn: "none" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const { error: upErr } = await db.storage.from("media").upload(storagePath, webp, { contentType: "image/webp", upsert: true, cacheControl: "31536000" });
    if (upErr) throw new Error(`upload: ${upErr.message}`);
    const row = { file_name: fileNameOf(source), storage_path: storagePath, mime: "image/webp", size_bytes: webp.length, width: info.width, height: info.height, alt: alt.trim() || GALLERY_ALT };
    const { data, error } = existing
      ? await db.from("media").update(row).eq("id", existing.id).select("id").single()
      : await db.from("media").insert(row).select("id").single();
    if (error || !data) throw new Error(`media row: ${error?.message}`);
    uploaded++;
    return data.id;
  })();
  mediaBySource.set(source, job);
  job.catch(() => mediaBySource.delete(source)); // let the retry try again
  return job;
}

// ---------- devotionals ----------
async function importDevotionals() {
  const { data: posts, error } = await db.from("posts").select("id, slug, title, legacy_url, featured_media_id");
  if (error || !posts) throw new Error(`load posts: ${error?.message}`);
  const byLegacy = new Map(posts.map((p) => [normalizeSlug(legacySlugOf(p.legacy_url) ?? ""), p]));

  type Job = { legacy: string; post: (typeof posts)[number]; source: string };
  const jobs: Job[] = [];
  const pathForSource = new Map<string, string>(); // first post's slug names a shared image
  let skippedExisting = 0;
  for (const [legacy, entry] of Object.entries(src.posts)) {
    const post = byLegacy.get(normalizeSlug(legacy));
    if (!post) {
      failures.push(`devotional "${legacy}": no post with this legacy URL`);
      continue;
    }
    const source = pickPostImage(entry);
    if (!source) {
      failures.push(`devotional "${post.slug}": the old site had no image`);
      continue;
    }
    if (post.featured_media_id && !force) {
      skippedExisting++;
      continue;
    }
    if (!pathForSource.has(source)) pathForSource.set(source, `devotionals/${post.slug}.webp`);
    jobs.push({ legacy, post, source });
  }

  const results = await runPool(jobs, 4, async (j) => {
    const mediaId = await importImage(j.source, pathForSource.get(j.source)!, j.post.title);
    const { error: upErr } = await db.from("posts").update({ featured_media_id: mediaId }).eq("id", j.post.id);
    if (upErr) throw new Error(`update post: ${upErr.message}`);
    return mediaId;
  });
  let updated = 0;
  for (const r of results) {
    if (r.ok) updated++;
    else failures.push(`devotional "${r.item.post.slug}" (${r.item.source}): ${r.error}`);
  }
  return { updated, skippedExisting, uniqueSources: pathForSource.size };
}

// ---------- pages ----------
type SectionRow = { id: string; type: string; sort_order: number; data: Record<string, unknown> };

async function loadPage(slug: string) {
  const { data, error } = await db.from("pages").select("id, page_sections(id, type, sort_order, data)").eq("slug", slug).maybeSingle();
  if (error || !data) throw new Error(`load page ${slug}: ${error?.message ?? "not found"}`);
  return { id: data.id, sections: (data.page_sections as SectionRow[]).sort((a, b) => a.sort_order - b.sort_order) };
}

let storagePaths = new Map<string, string>();
async function refreshStoragePaths() {
  const { data } = await db.from("media").select("id, storage_path");
  storagePaths = new Map((data ?? []).map((m) => [m.id, m.storage_path]));
}
const pathOf = (id: string) => storagePaths.get(id);

const newId = (prefix: string, i: number) => `${prefix}-${i + 1}`;

async function importGallery() {
  const entries = src.gallery.filter((g) => includeStock || !isStockImage(g.url));
  const stock = src.gallery.length - entries.length;
  if (stock) notes.push(`gallery: skipped ${stock} stock photo(s)`);
  const results = await runPool(entries.map((g, i) => ({ ...g, i })), 4, (g) => importImage(fullImageUrl(g.url), `gallery/old-site-${g.i + 1}.webp`, g.alt || GALLERY_ALT));
  const ids: string[] = [];
  for (const r of results) {
    if (r.ok) ids.push(r.value);
    else failures.push(`gallery image ${r.item.i + 1} (${r.item.url}): ${r.error}`);
  }
  if (!ids.length) return { count: 0, galleryAdded: 0, homeFilled: 0 };
  await refreshStoragePaths();

  // Gallery page: append to the grid (skipping images already in it).
  const gallery = await loadPage("gallery");
  const grid = gallery.sections.find((s) => s.type === "gallery_grid");
  let galleryAdded = 0;
  if (grid) {
    const items = (grid.data.items as { id: string; image: { mediaId: string } | null }[]) ?? [];
    const present = new Set(items.map((it) => it.image?.mediaId));
    ids.forEach((id, i) => {
      if (present.has(id)) return;
      items.push({ id: newId("old-site", i), image: { mediaId: id }, tag: "", title: "", caption: "" } as never);
      galleryAdded++;
    });
    await saveSection(grid, { ...grid.data, items });
    await publish(gallery.id, "gallery", "Added the old site's photo gallery");
  } else notes.push("gallery page: no gallery grid section found");

  // Home photo collage (4 slots): fill empty/placeholder slots only.
  const home = await loadPage("home");
  const collage = home.sections.find((s) => s.type === "home_gallery");
  let homeFilled = 0;
  if (collage) {
    const photos = ((collage.data.photos as { id: string; image: { mediaId: string } | null; caption?: string }[]) ?? []).slice();
    const used = new Set(photos.map((p) => p.image?.mediaId));
    const queue = ids.filter((id) => !used.has(id));
    for (let i = 0; i < 4 && queue.length; i++) {
      if (photos[i] && !isReplaceable(photos[i].image, pathOf)) continue; // keep real photos
      const id = queue.shift()!;
      if (photos[i]) photos[i] = { ...photos[i], image: { mediaId: id } };
      else photos.push({ id: newId("home-photo", i), image: { mediaId: id }, caption: "" });
      homeFilled++;
    }
    if (homeFilled) {
      await saveSection(collage, { ...collage.data, photos });
      await publish(home.id, "home", "Added photos from the old site's gallery");
    }
  } else notes.push("home page: no photo collage section found");

  return { count: ids.length, galleryAdded, homeFilled };
}

/** Old-site section name → which image field(s) it maps to on the new page. */
const PAGE_TARGETS: Record<string, { page: string; match: string }> = {
  "Pastor Ronnie Dube": { page: "about", match: "Pastor Ronnie Dube" },
  "Extravagant Love": { page: "the-loved-circle", match: "Extravagant Love" },
  "Worship with us this Sunday": { page: "home", match: "Worship with us this Sunday" },
};

async function importPageImages() {
  const assigned: string[] = [];
  const changedPages = new Set<string>();
  for (const [i, entry] of src.page_images.entries()) {
    const label = `${entry.page} → "${entry.section}"`;
    if (isStockImage(entry.url) && !includeStock) {
      notes.push(`${label}: skipped, it's a GoDaddy stock photo ("${entry.alt}"), not a church photo`);
      continue;
    }
    let mediaId: string;
    try {
      mediaId = await importImage(fullImageUrl(entry.url), `pages/${entry.page}-${i + 1}.webp`, entry.alt || `The Light City Church: ${entry.section}`);
    } catch (e) {
      try {
        mediaId = await importImage(fullImageUrl(entry.url), `pages/${entry.page}-${i + 1}.webp`, entry.alt || `The Light City Church: ${entry.section}`);
      } catch {
        failures.push(`page image ${label} (${entry.url}): ${e instanceof Error ? e.message : e}`);
        continue;
      }
    }
    const target = PAGE_TARGETS[entry.section];
    if (!target) {
      notes.push(`${label}: uploaded to the media library (no matching section on the new site)`);
      continue;
    }
    await refreshStoragePaths();
    const page = await loadPage(target.page);
    const want = target.match.toLowerCase();
    let found = false;
    for (const s of page.sections) {
      const d = s.data;
      // Sections whose heading matches, with an image field
      if (String(d.heading ?? "").trim().toLowerCase() === want) {
        found = true;
        if (!("image" in d)) {
          notes.push(`${label}: the "${s.type}" section has no image field, left as is`);
        } else if (!isReplaceable(d.image as { mediaId: string } | null, pathOf)) {
          notes.push(`${label}: kept the real church photo already there (${pathOf((d.image as { mediaId: string }).mediaId)})`);
        } else {
          await saveSection(s, { ...d, image: { mediaId } });
          changedPages.add(target.page);
          assigned.push(`${label} (${s.type})`);
        }
      }
      // List items whose name matches (e.g. the About leaders)
      if (Array.isArray(d.items)) {
        const items = d.items as { name?: string; image?: { mediaId: string } | null }[];
        const idx = items.findIndex((it) => String(it.name ?? "").trim().toLowerCase() === want);
        if (idx >= 0) {
          found = true;
          if (!isReplaceable(items[idx].image, pathOf)) {
            notes.push(`${label}: kept the real church photo already there (${pathOf(items[idx].image!.mediaId)})`);
          } else {
            const next = items.map((it, j) => (j === idx ? { ...it, image: { mediaId } } : it));
            await saveSection(s, { ...d, items: next });
            changedPages.add(target.page);
            assigned.push(`${label} (${s.type} item)`);
          }
        }
      }
    }
    if (!found) notes.push(`${label}: no matching section on the new page`);
  }
  for (const slug of changedPages) {
    const page = await loadPage(slug);
    await publish(page.id, slug, "Added images from the old site");
  }
  return { assigned };
}

async function saveSection(section: SectionRow, data: Record<string, unknown>) {
  const { error } = await db.from("page_sections").update({ data: data as NonNullable<Json> }).eq("id", section.id);
  if (error) throw new Error(`save section ${section.type}: ${error.message}`);
  section.data = data;
}

const published = new Set<string>();
async function publish(pageId: string, slug: string, note: string) {
  const { error } = await db.rpc("publish_page", { p_page_id: pageId, p_note: note });
  if (error) throw new Error(`publish ${slug}: ${error.message}`);
  published.add(slug);
}

async function main() {
  console.log(`Importing old-site images into ${new URL(url!).host}${force ? " (--force)" : ""}${includeStock ? " (--include-stock)" : ""}`);
  const dev = await importDevotionals();
  console.log(`  devotionals: ${dev.updated} updated`);
  const gal = await importGallery();
  console.log(`  gallery: ${gal.count} imported`);
  const pages = await importPageImages();

  console.log("\n===== Summary =====");
  console.log(`Posts updated:            ${dev.updated}${dev.skippedExisting ? ` (${dev.skippedExisting} skipped: already had a featured image)` : ""}`);
  console.log(`Unique images uploaded:   ${uploaded}`);
  console.log(`Gallery images:           ${gal.count} (added ${gal.galleryAdded} to the Gallery page, filled ${gal.homeFilled} Home collage slot(s))`);
  console.log(`Page images assigned:     ${pages.assigned.length ? pages.assigned.join("; ") : "none"}`);
  console.log(`Pages published:          ${[...published].join(", ") || "none"}`);
  if (notes.length) console.log(`\nNotes:\n${notes.map((n) => `  - ${n}`).join("\n")}`);
  console.log(`\nFailures (${failures.length}):${failures.length ? `\n${failures.map((f) => `  - ${f}`).join("\n")}` : " none"}`);
}

main().catch((e) => {
  console.error("Import failed:", e?.message ?? e);
  process.exit(1);
});
