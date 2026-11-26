// Seed the devotionals: loads supabase/seed/posts.json into posts, categories and
// post_categories by slug, all with status "published".
//
// LEGACY first-load tool: posts.json (built once by the legacy build-posts.mjs) has already been
// applied to the church database, and devotionals are now edited in the admin.
//
//   npx tsx supabase/seed.ts            only on a database with NO posts yet (e.g. a new staging project);
//                                       refuses if any posts exist
//   npx tsx supabase/seed.ts --force    run anyway: overwrites posts with the same slug (loses staff edits)
//                                       and adds missing ones
//
// Uses the service role (docs/ARCHITECTURE.md §7: "seed"). Reads .env.local.
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { buildSeed, chunk, seedRefusal } from "./seed/build-seed";

const root = path.resolve(import.meta.dirname, "..");
for (const file of [".env.local", ".env"]) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) process.loadEnvFile(p);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || url.includes("YOUR-PROJECT")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const force = process.argv.includes("--force");

async function main() {
  // Refuse to touch a database that already has devotionals unless --force.
  const { count: existingCount, error: countErr } = await db.from("posts").select("id", { count: "exact", head: true });
  if (countErr) throw countErr;
  const refusal = seedRefusal(existingCount ?? 0, force);
  if (refusal) {
    console.error(refusal);
    process.exit(1);
  }

  const plan = buildSeed(JSON.parse(fs.readFileSync(path.join(root, "supabase/seed/posts.json"), "utf8")));
  console.log(`Seeding ${plan.posts.length} posts and ${plan.categories.length} categories into ${new URL(url!).host}${force ? " (--force)" : ""}`);

  // Categories: create missing ones; only --force renames existing ones.
  const { error: catUpsertError } = await db.from("categories").upsert(plan.categories, { onConflict: "slug", ignoreDuplicates: !force });
  if (catUpsertError) throw catUpsertError;
  const { data: cats, error: catError } = await db.from("categories").select("id, slug").in("slug", plan.categories.map((c) => c.slug));
  if (catError) throw catError;
  const catId = new Map((cats ?? []).map((c) => [String(c.slug), c.id]));

  // Posts: skip slugs that already exist unless --force.
  const existing = new Set<string>();
  for (const batch of chunk(plan.posts.map((p) => p.slug), 200)) {
    const { data, error } = await db.from("posts").select("slug").in("slug", batch);
    if (error) throw error;
    for (const r of data ?? []) existing.add(String(r.slug));
  }
  const toWrite = force ? plan.posts : plan.posts.filter((p) => !existing.has(p.slug));
  console.log(`  ${existing.size} already exist${force ? " (overwriting)" : " (skipped)"}, ${toWrite.length} to write`);

  const postId = new Map<string, string>();
  for (const batch of chunk(toWrite, 50)) {
    const { data, error } = await db.from("posts").upsert(batch, { onConflict: "slug" }).select("id, slug");
    if (error) throw error;
    for (const r of data ?? []) postId.set(String(r.slug), r.id);
    process.stdout.write(`  posts ${postId.size}/${toWrite.length}\r`);
  }
  console.log();

  const links = plan.links
    .map((l) => ({ post_id: postId.get(l.post_slug), category_id: catId.get(l.category_slug) }))
    .filter((l): l is { post_id: string; category_id: string } => Boolean(l.post_id && l.category_id));
  for (const batch of chunk(links, 200)) {
    const { error } = await db.from("post_categories").upsert(batch, { onConflict: "post_id,category_id", ignoreDuplicates: true });
    if (error) throw error;
  }

  const { count, error: countError } = await db.from("posts").select("id", { count: "exact", head: true }).eq("status", "published");
  if (countError) throw countError;
  console.log(`Done. ${links.length} category links. Published posts in the database: ${count}`);
}

main().catch((e) => {
  console.error("Seed failed:", e?.message ?? e);
  process.exit(1);
});
